"use server";

import { CreateProductType, ProductUpdateType } from "@/types/product";
import { createActionSupabaseClient } from "../config/supabase/server/server";
import { extractFilePathFromUrl } from "../utils/supabaseStorageUtils";
import { createClient } from "@supabase/supabase-js";

// 상품 등록
export async function createProduct({
  name,
  description,
  price,
  image_url,
  detailImages,
  tags,
  category,
  subcategory,
  gender,
  color,
  stock_by_size,
  total_stock,
}: CreateProductType) {
  const supabase = await createActionSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("로그인 후 사용해주세요.");
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert([
      {
        name,
        description,
        price,
        image_url,
        user_id: user.id,
        tags,
        category,
        subcategory,
        gender,
        color,
        stock_by_size,
        total_stock,
      },
    ])
    .select()
    .single();

  if (productError) {
    throw new Error(`상품 등록 실패: ${productError.message}`);
  }

  const imageRecords = detailImages.slice(0, 5).map((url, index) => ({
    product_id: product.id,
    image_url: url,
    sort_order: index,
  }));

  const { error: detailError } = await supabase
    .from("product_images")
    .insert(imageRecords);

  if (detailError) {
    throw new Error(`상세 이미지 등록 실패: ${detailError.message}`);
  }

  return product;
}

export async function deleteProduct({
  productId,
  imagePath,
}: {
  productId: string;
  imagePath: string;
}) {
  const supabase = await createActionSupabaseClient();
  const { error: imageDeleteError } = await supabase.storage
    .from("product-images")
    .remove([imagePath]);

  if (imageDeleteError) {
    throw new Error("이미지 삭제 실패: " + imageDeleteError.message);
  }

  const { error: productDeleteError } = await supabase.rpc(
    "delete_product",
    { target_product_id: productId },
  );

  if (productDeleteError) {
    throw new Error("상품 삭제 실패: " + productDeleteError.message);
  }
}

// 상품 수정
export async function updateProduct({
  id,
  name,
  description,
  price,
  image_url,
  oldImageUrl,
  oldDetailImageIds = [],
  detail_image_urls = [],
  tags,
  category,
  subcategory,
  gender,
  color,
  stock_by_size,
  total_stock,
  original_price,
  discount_type,
  discount_value,
  favorite_count,
}: ProductUpdateType) {
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET;
  const supabase = await createActionSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) throw new Error("로그인 후 사용해주세요.");
  if (!id) throw new Error("잘못된 접근입니다.");

  const { data: profile } = await supabase
    .from("user_table")
    .select("level")
    .eq("id", user.id)
    .single();

  const { data: foundProduct, error: findError } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", id)
    .single();

  const isOwner = foundProduct?.user_id === user.id;
  const isAdmin = profile?.level === 3;

  if (findError || (!isOwner && !isAdmin)) {
    throw new Error("수정 권한이 없습니다.");
  }

  // 대표 이미지 삭제
  if (oldImageUrl && oldImageUrl !== image_url) {
    const oldImagePath = extractFilePathFromUrl(oldImageUrl, bucket!);
    if (oldImagePath) {
      const { error: removeError } = await supabase.storage
        .from(bucket!)
        .remove([oldImagePath]);
      if (removeError) {
        console.warn("기존 대표 이미지 삭제 실패:", removeError.message);
      }
    }
  }

  // 기존 상세 이미지 목록 가져오기
  const { data: existingImagesData, error: existingImagesError } =
    await supabase
      .from("product_images")
      .select("id, image_url")
      .eq("product_id", id);

  if (existingImagesError) {
    throw new Error(
      "기존 상세 이미지 조회 실패: " + existingImagesError.message,
    );
  }

  const existingIds = new Set((existingImagesData ?? []).map((img) => img.id));
  const keptIds = new Set(oldDetailImageIds);

  // 삭제 대상 ID 계산
  const idsToDelete = [...existingIds].filter((id) => !keptIds.has(id));

  if (idsToDelete.length > 0) {
    const targets = (existingImagesData ?? []).filter((img) =>
      idsToDelete.includes(img.id),
    );

    const deletePaths = targets
      .map((img) => extractFilePathFromUrl(img.image_url, bucket!))
      .filter((path): path is string => typeof path === "string");

    if (deletePaths.length > 0) {
      const { error: removeDetailError } = await supabase.storage
        .from(bucket!)
        .remove(deletePaths);

      if (removeDetailError) {
        console.warn(
          "상세 이미지 Storage 삭제 실패:",
          removeDetailError.message,
        );
      }
    }

    const { error: deleteFromDbError } = await supabase
      .from("product_images")
      .delete()
      .in("id", idsToDelete);

    if (deleteFromDbError) {
      console.warn("상세 이미지 DB 삭제 실패:", deleteFromDbError.message);
    }
  }

  // 상품 정보 업데이트
  const { data, error } = await supabase
    .from("products")
    .update({
      name,
      description,
      price,
      image_url,
      tags,
      category,
      subcategory,
      gender,
      color,
      stock_by_size,
      total_stock,
      original_price,
      discount_type,
      discount_value,
      favorite_count,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("상품 수정 실패:", error.message);
    throw new Error(error.message);
  }

  // 기존 이미지 전체 삭제
  await supabase.from("product_images").delete().eq("product_id", id);

  // 새 이미지 전체 삽입
  const inserts = detail_image_urls.map((url, index) => ({
    product_id: id,
    image_url: url,
    sort_order: index,
  }));

  if (inserts.length > 0) {
    const { error: insertError } = await supabase
      .from("product_images")
      .insert(inserts);

    if (insertError) {
      throw new Error("상세 이미지 저장 실패: " + insertError.message);
    }
  }

  return data;
}

// 등록 상품 조회 (관리자는 전체, 판매자는 본인 등록 상품만)
export async function getMyProducts(
  userId: string,
  query: string,
  page: number = 0,
  pageSize: number = 10,
) {
  const supabase = await createActionSupabaseClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data: profile } = await supabase
    .from("user_table")
    .select("level")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.level === 3;

  let request = supabase
    .from("products")
    .select(
      "*, public_profiles!products_user_id_user_table_fkey(user_name)",
      { count: "exact" },
    )
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!isAdmin) {
    request = request.eq("user_id", userId);
  }

  if (query.trim()) {
    request = request.ilike("name", `%${query}%`);
  }

  const { data, count, error } = await request;

  if (error) throw error;
  return { products: data ?? [], totalCount: count ?? 0 };
}

// 주문 배송상태 변경
export async function updateDeliveryStatus(
  orderItemId: string,
  status: string,
) {
  const supabase = await createActionSupabaseClient();

  const { error } = await supabase
    .from("order_items")
    .update({ delivery_status: status })
    .eq("id", orderItemId);

  if (error) throw new Error(error.message);
  return true;
}

// 유저 전체 조회
export async function getAllUsers({
  query = "",
  level = 1,
  page = 0,
  pageSize = 5,
}: {
  query?: string;
  level?: number;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createActionSupabaseClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (!sessionUser) throw new Error("인증이 필요합니다.");

  const { data: profile } = await supabase
    .from("user_table")
    .select("level")
    .eq("id", sessionUser.id)
    .single();

  if (!profile || profile.level !== 3) {
    throw new Error("관리자 권한이 없습니다.");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE!,
  );

  const from = page * pageSize;
  const to = from + pageSize - 1;

  let request = supabaseAdmin
    .from("user_table")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query.trim()) {
    request = request.or(`user_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  if (level) {
    request = request.eq("level", level);
  }

  const { data, error, count } = await request;

  if (error) {
    console.error("조회 에러:", error);
    throw new Error("목록을 불러오지 못했습니다.");
  }

  return {
    users: data ?? [],
    totalCount: count ?? 0,
  };
}

// 유저 프로필 조회
export async function getUserProfile(userId: string) {
  const supabase = await createActionSupabaseClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (!sessionUser) throw new Error("인증이 필요합니다.");

  const { data: profile } = await supabase
    .from("user_table")
    .select("level")
    .eq("id", sessionUser.id)
    .single();

  if (!profile || profile.level !== 3) {
    throw new Error("관리자 권한이 없습니다.");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE!,
  );

  const { data, error } = await supabaseAdmin
    .from("user_table")
    .select(
      `
    id, email, user_name, level, phone, profile_image_url, 
    created_at, updated_at, status, last_login_at, address
  `,
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase 에러", error);
    throw new Error("프로필 조회 실패");
  }

  return data;
}

// 유저 계정 활동 제한 변경
export async function patchUserActive(
  userId: string,
  newStatus: "active" | "suspended" | "withdrawn",
) {
  const supabase = await createActionSupabaseClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (!sessionUser) throw new Error("인증이 필요합니다.");

  const { data: profile } = await supabase
    .from("user_table")
    .select("level")
    .eq("id", sessionUser.id)
    .single();

  if (!profile || profile.level !== 3) {
    throw new Error("관리자 권한이 없습니다.");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE!,
  );

  const { error } = await supabaseAdmin
    .from("user_table")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("상태 변경 실패:", error.message);
    return { success: false, message: error.message };
  }

  return { success: true };
}

// 대시보드 통계 조회 (최근 24시간 주문, 재고 부족 상품, 신규 고객 수)
interface DashboardOrderItemJoin {
  price: number;
  quantity: number;
  products: { user_id: string | null } | null;
}

interface DashboardOrderRow {
  created_at: string | null;
  order_items: DashboardOrderItemJoin[];
}

export async function getDashboardStatus() {
  const supabase = await createActionSupabaseClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (!sessionUser) throw new Error("인증이 필요합니다.");

  const { data: profile } = await supabase
    .from("user_table")
    .select("level")
    .eq("id", sessionUser.id)
    .single();

  if (!profile?.level || profile.level < 2) {
    throw new Error("권한이 없습니다.");
  }

  const isAdmin = profile.level === 3;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_ROLE!,
  );

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: ordersRaw } = await supabaseAdmin
    .from("orders_with_user_info")
    .select("created_at, order_items(price, quantity, products(user_id))")
    .eq("deleted", false);

  const orders = ordersRaw as unknown as DashboardOrderRow[] | null;

  let lowStockQuery = supabaseAdmin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("deleted", false)
    .lt("total_stock", 5);

  if (!isAdmin) {
    lowStockQuery = lowStockQuery.eq("user_id", sessionUser.id);
  }

  const { count: lowStockCount } = await lowStockQuery;

  const { count: newUserCount, error: userError } = await supabaseAdmin
    .from("user_table")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneDayAgo);

  if (userError) console.error("신규 유저 조회 에러:", userError);

  if (!orders)
    return { totalSales: 0, orderCount: 0, lowStockCount: 0, newUserCount: 0 };

  let totalSales = 0;
  let orderCount = 0;

  orders.forEach((order) => {
    const myItems = isAdmin
      ? order.order_items
      : order.order_items.filter(
          (item) => item.products?.user_id === sessionUser.id,
        );

    if (myItems.length === 0) return;

    orderCount += 1;
    totalSales += myItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  });

  return {
    totalSales,
    orderCount,
    lowStockCount: lowStockCount || 0,
    newUserCount: newUserCount || 0,
  };
}

// 최근 7건 매출 조회
export async function getWeeklySalesAction() {
  const supabase = await createActionSupabaseClient();

  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();
  if (!sessionUser) throw new Error("인증이 필요합니다.");

  const { data: profile } = await supabase
    .from("user_table")
    .select("level")
    .eq("id", sessionUser.id)
    .single();

  if (!profile?.level || profile.level < 2) throw new Error("권한이 없습니다.");

  const isAdmin = profile.level === 3;

  // 관리자는 최근 주문 50건 안에서 "데이터 있는 최근 7개 날짜"를 뽑고,
  // 판매자도 같은 방식이되 본인 상품이 섞인 주문이 적을 수 있어서 풀을
  // 더 넉넉하게(300건) 가져온 뒤 같은 방식으로 7개 날짜를 뽑음. 실제
  // 캘린더 기준 "최근 7일"로 자르면 주문이 뜨문뜨문 있는 판매자는
  // 그래프가 거의 비어 보일 수 있어서 날짜로 자르지 않음.
  const { data: ordersRaw, error } = await supabase
    .from("orders_with_user_info")
    .select("created_at, order_items(price, quantity, products(user_id))")
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(isAdmin ? 50 : 300);
  const orders = ordersRaw as unknown as DashboardOrderRow[] | null;

  if (error) throw new Error(error.message);

  const salesMap = new Map<string, number>();

  orders?.forEach((order) => {
    if (!order.created_at) return;

    const items = isAdmin
      ? order.order_items
      : order.order_items.filter(
          (item) => item.products?.user_id === sessionUser.id,
        );

    if (items.length === 0) return;

    const dateKey = order.created_at.split("T")[0];
    const orderTotal = items.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
      0,
    );

    salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + orderTotal);
  });

  const sortedDates = Array.from(salesMap.keys()).sort().reverse();
  const recent7Dates = sortedDates.slice(0, 7).reverse();

  return recent7Dates.map((date) => {
    const d = new Date(date);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      value: salesMap.get(date) || 0,
    };
  });
}

interface CategoryStat {
  label: string;
  value: number;
}

// 카테고리별 매출 조회
interface OrderItemJoin {
  price: number | null;
  quantity: number | null;
  products: {
    category: string | null;
    user_id: string | null;
  } | null;
}

interface RawOrderData {
  order_items: OrderItemJoin[];
}

interface CategoryStat {
  label: string;
  value: number;
}

export async function getCategorySalesAction(): Promise<CategoryStat[]> {
  const supabase = await createActionSupabaseClient();

  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();
  if (!sessionUser) throw new Error("인증이 필요합니다.");

  const { data: profile } = await supabase
    .from("user_table")
    .select("level")
    .eq("id", sessionUser.id)
    .single();

  if (!profile?.level || profile.level < 2) throw new Error("권한이 없습니다.");

  const isAdmin = profile.level === 3;

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      order_items (
        price,
        quantity,
        products (
          category,
          user_id
        )
      )
    `,
    )
    .eq("deleted", false);

  if (error) throw new Error(error.message);

  // 3. 데이터 합산 (Map 사용)
  const categoryMap = new Map<string, number>();

  const typedOrders = orders as unknown as RawOrderData[];

  typedOrders?.forEach((order) => {
    order.order_items.forEach((item) => {
      if (!isAdmin && item.products?.user_id !== sessionUser.id) return;

      const category = item.products?.category || "미지정";
      const itemTotal = (item.price || 0) * (item.quantity || 0);

      categoryMap.set(category, (categoryMap.get(category) || 0) + itemTotal);
    });
  });

  // 4. 결과 반환 (매출액 높은 순 정렬)
  return Array.from(categoryMap.entries())
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}
