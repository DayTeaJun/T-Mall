"use server";

import { createActionSupabaseClient } from "../config/supabase/server/server";

interface ConfirmOrderItemInput {
  productId: string;
  quantity: number;
  size: string | null;
}

interface ConfirmOrderInput {
  orderId: string;
  paymentKey: string;
  request: string;
  receiver: string;
  detailAddress: string;
  userCouponId: string | null;
  items: ConfirmOrderItemInput[];
  // 장바구니에서 결제한 경우에만 true (바로구매는 장바구니를 안 거치므로 false)
  clearCartAfter?: boolean;
}

// 결제 확정 + 주문 저장. 클라이언트가 보낸 가격/할인액은 절대 신뢰하지 않고,
// 상품 가격과 쿠폰 정보를 서버에서 직접 다시 조회해 금액을 계산한 뒤 그 금액으로
// Toss 결제 승인을 요청한다 - 클라이언트가 조작한 금액과 실제 결제된 금액이
// 다르면 Toss API 자체가 승인을 거부하므로, 가격 조작으로 주문이 완료되는 걸 막는다.
export async function confirmOrder(
  input: ConfirmOrderInput,
): Promise<{ orderId: string }> {
  const supabase = await createActionSupabaseClient();

  // 1. 요청을 보낸 사람이 실제로 누구인지 서버가 직접 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("사용자 인증에 실패하였습니다.");
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("상품 정보가 비어 있습니다.");
  }

  // 2. 동일 상품+사이즈 병합
  const mergedMap = new Map<string, ConfirmOrderItemInput>();
  for (const item of input.items) {
    const key = `${item.productId}::${item.size ?? "null"}`;
    const existing = mergedMap.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      mergedMap.set(key, { ...item });
    }
  }
  const mergedItems = Array.from(mergedMap.values());

  // 3. 상품 가격/재고를 DB에서 다시 조회 - 클라이언트가 보낸 가격은 쓰지 않음
  const productIds = [...new Set(mergedItems.map((i) => i.productId))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price, stock_by_size, sales_count")
    .in("id", productIds);

  if (productsError || !products || products.length !== productIds.length) {
    throw new Error("상품 정보를 확인할 수 없습니다.");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalProductPrice = 0;
  const orderItemsDraft: {
    product_id: string;
    quantity: number;
    size: string | null;
    price: number;
  }[] = [];

  for (const item of mergedItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error("존재하지 않는 상품이 포함되어 있습니다.");
    }

    const stockMap = product.stock_by_size as Record<string, number> | null;
    if (stockMap && item.size) {
      const availableStock = stockMap[item.size] ?? 0;
      if (availableStock < item.quantity) {
        throw new Error(
          `재고가 부족합니다 (${item.size} 사이즈, 남은 수량 ${availableStock}개).`,
        );
      }
    }

    totalProductPrice += product.price * item.quantity;
    orderItemsDraft.push({
      product_id: item.productId,
      quantity: item.quantity,
      size: item.size,
      price: product.price, // 서버가 조회한 실제 가격
    });
  }

  // 4. 쿠폰도 서버에서 다시 검증 - 할인액은 클라이언트 계산값을 쓰지 않고 직접 계산
  let masterCouponId: string | null = null;
  let discountAmount = 0;

  if (input.userCouponId) {
    const { data: userCoupon, error: userCouponError } = await supabase
      .from("user_coupons")
      .select(
        "id, coupon_id, is_used, coupon:coupons(discount_type, discount_value, max_discount_price, min_order_price)",
      )
      .eq("id", input.userCouponId)
      .eq("user_id", user.id)
      .single();

    if (userCouponError || !userCoupon) {
      throw new Error("쿠폰 정보를 확인할 수 없습니다.");
    }
    if (userCoupon.is_used) {
      throw new Error("이미 사용된 쿠폰입니다.");
    }

    const coupon = Array.isArray(userCoupon.coupon)
      ? userCoupon.coupon[0]
      : userCoupon.coupon;

    if (!coupon) {
      throw new Error("쿠폰 정보를 확인할 수 없습니다.");
    }

    if (coupon.min_order_price && totalProductPrice < coupon.min_order_price) {
      throw new Error(
        `이 쿠폰은 ${coupon.min_order_price.toLocaleString()}원 이상 주문 시 사용할 수 있습니다.`,
      );
    }

    discountAmount =
      coupon.discount_type === "percentage"
        ? (totalProductPrice * coupon.discount_value) / 100
        : coupon.discount_value;

    if (
      coupon.max_discount_price &&
      discountAmount > coupon.max_discount_price
    ) {
      discountAmount = coupon.max_discount_price;
    }
    discountAmount = Math.min(discountAmount, totalProductPrice);

    masterCouponId = userCoupon.coupon_id;
  }

  const expectedAmount = Math.max(
    0,
    Math.round(totalProductPrice - discountAmount),
  );

  // 5. Toss 결제 승인 - 클라이언트가 보낸 금액이 아니라 서버가 계산한 금액으로 요청.
  //    실제 결제된 금액과 다르면 Toss가 이 요청 자체를 실패시킨다.
  const secretKey = process.env.NEXT_PRIVATE_TOSS_SECRET_KEY!;
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  const tossRes = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: input.orderId,
        paymentKey: input.paymentKey,
        amount: expectedAmount,
      }),
    },
  );

  if (!tossRes.ok) {
    const errBody = await tossRes.json().catch(() => null);
    throw new Error(
      `결제 승인에 실패했습니다: ${errBody?.message ?? "알 수 없는 오류"}`,
    );
  }

  // 6. 주문 저장
  const { data: orderInsert, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      request: input.request,
      receiver: input.receiver,
      detail_address: input.detailAddress,
      coupon_id: masterCouponId,
      discount_amount: discountAmount,
    })
    .select("id")
    .single();

  if (orderError || !orderInsert) {
    throw new Error(`주문 저장에 실패하였습니다: ${orderError?.message ?? ""}`);
  }

  const orderId = orderInsert.id;

  // 7. 쿠폰 사용 처리
  if (input.userCouponId) {
    const { error: couponUpdateError } = await supabase.rpc("use_coupon", {
      p_user_coupon_id: input.userCouponId,
    });

    if (couponUpdateError) {
      throw new Error(
        couponUpdateError.message || "쿠폰 사용 처리에 실패했습니다.",
      );
    }
  }

  // 8. 주문 상품 저장 (서버가 조회한 실제 가격으로)
  const { error: itemError } = await supabase
    .from("order_items")
    .insert(orderItemsDraft.map((item) => ({ ...item, order_id: orderId })));

  if (itemError) {
    throw new Error("상품 정보 저장에 실패하였습니다.");
  }

  // 9. 재고 차감 (같은 상품의 여러 사이즈를 한 번에 처리)
  const deductionsByProduct = new Map<
    string,
    { size: string | null; quantity: number }[]
  >();
  for (const item of orderItemsDraft) {
    const list = deductionsByProduct.get(item.product_id) ?? [];
    list.push({ size: item.size, quantity: item.quantity });
    deductionsByProduct.set(item.product_id, list);
  }

  for (const [productId, deductions] of deductionsByProduct.entries()) {
    const product = productMap.get(productId)!;
    const stockMap = {
      ...((product.stock_by_size as Record<string, number> | null) ?? {}),
    };

    for (const { size, quantity } of deductions) {
      if (size && typeof stockMap[size] === "number") {
        stockMap[size] = Math.max(0, stockMap[size] - quantity);
      }
    }

    const purchasedQuantity = deductions.reduce(
      (sum, { quantity }) => sum + quantity,
      0,
    );

    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock_by_size: stockMap,
        total_stock: Object.values(stockMap).reduce((sum, qty) => sum + qty, 0),
        sales_count: (product.sales_count ?? 0) + purchasedQuantity,
      })
      .eq("id", productId);

    if (stockError) {
      throw new Error("재고 업데이트 중 오류가 발생했습니다.");
    }
  }

  // 10. 장바구니에서 결제한 경우, 구매한 항목을 장바구니에서 제거
  if (input.clearCartAfter) {
    for (const item of mergedItems) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", item.productId)
        .contains("options", { size: item.size });
    }
  }

  return { orderId };
}

// 주문 상품(order_item) 취소 + 재고/판매수량 롤백.
// 소유자 검증, 상태 변경, 재고 복원을 전부 DB의 cancel_order_item RPC 안에서 한 트랜잭션으로 처리한다 (RLS가 user_coupons처럼 테이블 직접 수정을 막고 있어서, 검증된 경로인 RPC로만 가능하게 함).
export async function cancelOrderItem(
  orderItemId: string,
): Promise<{ orderId: string }> {
  const supabase = await createActionSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("사용자 인증에 실패하였습니다.");
  }

  const { data: orderId, error } = await supabase.rpc("cancel_order_item", {
    p_order_item_id: orderItemId,
  });

  if (error || !orderId) {
    throw new Error(error?.message || "주문 취소 처리에 실패했습니다.");
  }

  return { orderId };
}
