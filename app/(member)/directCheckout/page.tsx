"use client";

import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Modal from "@/components/common/modal/Modal";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useGetProductDetail } from "@/lib/queries/products";
import { useGetDefaultAddress } from "@/lib/queries/delivery";
import { useGetMyAvailableCoupons } from "@/lib/queries/coupon";
import AddressListModal from "@/components/common/modal/delivery/AddressModal";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

type SelectedItem = {
  id: string;
  quantity: number | string;
  options?: Record<string, string>;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
  };
};

export default function CheckoutPage() {
  const { user } = useAuthStore();

  const searchParams = useSearchParams();

  const productIdFromParam = searchParams.get("productId") ?? "";

  const sizeParam = searchParams.get("size") ?? "";
  const quantity = searchParams.get("quantity") ?? "1";

  const { data: defaultAddress } = useGetDefaultAddress(user?.id || "");

  const { data: product, isLoading } = useGetProductDetail(productIdFromParam);

  const { data: coupons } = useGetMyAvailableCoupons(user?.id || "");

  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  const selectedUserCoupon = coupons?.find(
    (item) => item.id === selectedCouponId,
  );
  const rawSelectedCoupon = selectedUserCoupon?.coupon;

  const selectedItem: SelectedItem | null = useMemo(() => {
    if (!product) return null;
    return {
      id: productIdFromParam,
      quantity,
      options: { size: sizeParam },
      product: {
        id: product.id,
        name: product.name,
        price: product.price ?? 0,
        image_url: product.image_url ?? null,
      },
    };
  }, [product, productIdFromParam, sizeParam, quantity]);

  const totalPrice = useMemo(() => {
    if (!selectedItem?.product) return 0;
    return (
      (selectedItem.product.price ?? 0) *
      (typeof selectedItem.quantity === "string"
        ? parseInt(selectedItem.quantity)
        : selectedItem.quantity)
    );
  }, [selectedItem]);

  const isSelectedCouponInvalid =
    rawSelectedCoupon &&
    rawSelectedCoupon.min_order_price &&
    rawSelectedCoupon.min_order_price > 0 &&
    totalPrice < rawSelectedCoupon.min_order_price;

  const selectedCoupon = isSelectedCouponInvalid ? null : rawSelectedCoupon;
  const effectiveCouponId = isSelectedCouponInvalid ? null : selectedCouponId;

  const calculateDiscount = () => {
    if (!selectedCoupon) return 0;

    if (
      selectedCoupon.min_order_price &&
      selectedCoupon.min_order_price > 0 &&
      totalPrice < selectedCoupon.min_order_price
    ) {
      return 0;
    }

    let discount = 0;
    if (selectedCoupon.discount_type === "percentage") {
      discount = (totalPrice * selectedCoupon.discount_value) / 100;
      // 최대 할인 금액 제한 적용
      if (
        selectedCoupon.max_discount_price &&
        discount > selectedCoupon.max_discount_price
      ) {
        discount = selectedCoupon.max_discount_price;
      }
    } else {
      discount = selectedCoupon.discount_value;
    }

    return Math.min(discount, totalPrice);
  };

  const discountAmount = calculateDiscount();
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const orderName = useMemo(() => {
    if (!selectedItem?.product) return "상품";
    const base = selectedItem.product.name;
    return sizeParam ? `${base} (${sizeParam})` : base;
  }, [selectedItem, sizeParam]);

  const [request, setRequest] = useState(
    defaultAddress?.delivery_instruction || "",
  );

  useEffect(() => {
    if (defaultAddress?.delivery_instruction) {
      setRequest(defaultAddress?.delivery_instruction);
    }
  }, [defaultAddress?.delivery_instruction]);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    if (!selectedItem?.product) {
      toast.error("주문 정보가 올바르지 않습니다.");
      return;
    }

    if (!user?.address) {
      return toast.info("배송지가 없습니다. 배송지를 추가해 주세요");
    }

    if (!defaultAddress) {
      return toast.info("기본 배송지가 설정이 되지않았습니다.");
    }

    sessionStorage.setItem("checkoutItems", JSON.stringify([selectedItem]));
    sessionStorage.setItem("request", request);
    sessionStorage.setItem("receiver", defaultAddress.receiver_name);
    sessionStorage.setItem("detailAddress", user.address);

    if (effectiveCouponId) {
      sessionStorage.setItem("couponId", effectiveCouponId);
    }

    const customerMobile = (
      defaultAddress.receiver_phone ?? "01000000000"
    ).replace(/-/g, "");

    try {
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: user?.id ?? ANONYMOUS,
      });

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: finalPrice,
        },
        orderId: `order-${Date.now()}`,
        orderName,
        successUrl: `${window.location.origin}/directCheckout/success`,
        failUrl: `${window.location.origin}/directCheckout/fail?productId=${productIdFromParam}&size=${sizeParam}&quantity=${quantity}`,
        customerName: user?.user_name,
        customerEmail: user?.email ?? "",
        customerMobilePhone: customerMobile,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch {
      toast.error("결제 취소되었습니다. 다시 시도해주세요.");
    }
  };

  if (isLoading || !selectedItem?.product) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-600">
        <LoaderCircle size={48} className="animate-spin mb-4" />
        <p className="text-sm">주문 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto sm:p-8 p-4">
      <h1 className="text-xl font-bold mb-4">주문 / 결제</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-8">
        <div className="flex flex-col gap-8 col-span-2">
          <section className="border rounded">
            <div className="flex justify-between items-center bg-gray-50 p-4">
              <h2 className="font-bold text-lg">
                배송지
                <span className="ml-2 pl-2 border-l-[3px] border-gray-200">
                  {defaultAddress?.address_name}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="text-sm underline text-gray-500"
              >
                {user?.address ? "배송지 변경" : "배송지 추가"}
              </button>
            </div>
            <div className="bg-white p-4 flex flex-col gap-2">
              {user?.address ? (
                <p className="text-sm text-gray-700">{user?.address}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  배송지가 등록이 되지 않았습니다.{" "}
                  <span className="text-[12px] text-gray-400">
                    (위 배송지 추가를 통해 등록해주세요.)
                  </span>
                </p>
              )}

              {defaultAddress?.receiver_phone ? (
                <p className="text-sm text-gray-700">
                  전화번호: {defaultAddress?.receiver_phone}
                </p>
              ) : (
                <div className="flex sm:flex-row sm:gap-0 gap-2 flex-col justify-between sm:items-center">
                  <p className="text-sm text-gray-500">
                    전화번호가 등록이 되지 않았습니다.
                  </p>
                </div>
              )}

              <div className="flex gap-2 items-center mt-2">
                {defaultAddress?.receiver_name && (
                  <p className="text-sm text-gray-700">
                    수령인: {defaultAddress?.receiver_name}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2">배송 요청사항</h2>
            <input
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="요청사항 입력 (선택)"
            />
          </section>

          <p className="text-sm -mb-6">
            <span className="font-bold">1 </span>개 품목
          </p>
          <ul className="flex flex-col gap-2">
            <li className="flex gap-4 border rounded p-4">
              <Image
                src={selectedItem.product?.image_url ?? "/default-product.jpg"}
                alt={selectedItem.product?.name ?? "상품 이미지"}
                width={80}
                height={80}
                className="rounded border object-cover w-20 h-20"
              />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{selectedItem.product?.name}</p>
                <p className="text-sm text-gray-500">
                  사이즈: {sizeParam} / 수량: {selectedItem.quantity}개
                </p>
                <p className="text-sm text-gray-500">
                  가격: ₩{(selectedItem.product?.price ?? 0).toLocaleString()} ·
                  총 가격:{" "}
                  {(
                    (selectedItem.product?.price ?? 0) *
                    (typeof selectedItem.quantity === "string"
                      ? parseInt(selectedItem.quantity)
                      : selectedItem.quantity)
                  ).toLocaleString()}
                </p>
              </div>
            </li>
          </ul>

          <section>
            <h2 className="font-bold text-lg mb-4">
              결제수단{" "}
              <span className="text-[11px] text-gray-400">
                (* 토스페이먼츠 테스트 결제입니다)
              </span>
            </h2>
            <div className="text-sm text-gray-600">카드 결제 (테스트용)</div>
          </section>

          <div className="flex flex-col">
            <div className="border-t p-3 flex items-center justify-between">
              <h2 className="font-bold">할인쿠폰 적용</h2>
              <Link
                href="/mypage/coupon"
                className="text-[12px] sm:text-sm font-medium text-gray-900 underline underline-offset-4 whitespace-nowrap"
              >
                쿠폰함 바로가기 &rarr;
              </Link>
            </div>

            <ul className="flex flex-col">
              {(!coupons || coupons.length === 0) && (
                <li>
                  <p className="p-4 border-b border-t border-gray-200 text-sm text-gray-500">
                    사용 가능한 쿠폰이 없습니다
                  </p>
                </li>
              )}

              {coupons?.map((item) => {
                const coupon = item.coupon;
                if (!coupon) return null;

                const isMinPriceNotMet =
                  coupon.min_order_price &&
                  coupon.min_order_price > 0 &&
                  totalPrice < coupon.min_order_price;

                return (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between p-4 border-b border-gray-200 transition ${
                      isMinPriceNotMet
                        ? "opacity-50 cursor-not-allowed"
                        : `cursor-pointer hover:bg-gray-50 ${
                            effectiveCouponId === item.id
                              ? "bg-gray-50"
                              : "bg-white"
                          }`
                    } first:border-t`}
                  >
                    <div className="w-full flex items-center gap-4">
                      <input
                        type="radio"
                        name="selectedCoupon"
                        value={item.id}
                        checked={effectiveCouponId === item.id}
                        onChange={() => {
                          if (isMinPriceNotMet) {
                            toast.error(
                              `최소 주문 금액(${coupon.min_order_price?.toLocaleString()}원)을 채워야 사용 가능합니다.`,
                            );
                            return;
                          }
                          setSelectedCouponId(item.id);
                        }}
                        disabled={Boolean(isMinPriceNotMet)}
                        className="accent-black"
                      />
                      <div className="w-full flex flex-col gap-1.5">
                        <div className="w-full flex flex-col gap-2">
                          <span className="font-bold text-xl text-gray-900">
                            {coupon.discount_type === "percentage"
                              ? `${coupon.discount_value}% 할인`
                              : `${coupon.discount_value.toLocaleString()}원 할인`}
                          </span>

                          <span className="text-sm text-gray-500">
                            {coupon.name}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 justify-between">
                          <div className="flex items-center gap-2">
                            {coupon.min_order_price &&
                              coupon.min_order_price > 0 && (
                                <span>
                                  {coupon.min_order_price.toLocaleString()}원
                                  이상
                                </span>
                              )}
                            {coupon.max_discount_price && (
                              <span>
                                (최대{" "}
                                {coupon.max_discount_price.toLocaleString()}원
                                할인)
                              </span>
                            )}
                          </div>
                          {coupon.expires_at && (
                            <span className="text-gray-400">
                              ~{" "}
                              {new Date(coupon.expires_at).toLocaleDateString()}{" "}
                              까지
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}

              <label
                className={`flex items-center gap-4 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${effectiveCouponId === null ? "bg-gray-50" : "bg-white"}`}
              >
                <input
                  type="radio"
                  name="selectedCoupon"
                  checked={effectiveCouponId === null}
                  onChange={() => setSelectedCouponId(null)}
                  className="accent-black"
                />
                <span className="text-sm text-gray-700 font-medium">
                  쿠폰 사용 안 함
                </span>
              </label>
            </ul>
          </div>
        </div>

        <div className="border p-6 bg-white h-fit sm:mt-0 mt-4">
          <h2 className="text-lg font-bold mb-4">최종 결제 금액</h2>
          <div className="flex justify-between mb-2 text-sm">
            <span>총 상품 가격</span>
            <span>{totalPrice.toLocaleString()}원</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between mb-2 text-sm text-red-500">
              <span>쿠폰 할인 금액</span>
              <span>- {discountAmount.toLocaleString()}원</span>
            </div>
          )}

          <div className="h-[1px] bg-gray-300 my-4" />
          <div className="flex flex-col text-sm font-bold mb-6">
            <span>총 결제 금액</span>
            <p className="ml-auto text-xl">
              {finalPrice.toLocaleString()} <span className="text-sm">원</span>
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mb-2">
            실제 결제는 이루어지지 않습니다. 테스트 환경입니다.
          </p>
          <button
            onClick={handlePayment}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            결제하기
          </button>
        </div>
      </div>

      <Modal
        title={user?.address ? "배송지 변경" : "배송지 추가"}
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        className="rounded-none h-[85vh] flex flex-col"
      >
        <AddressListModal
          userId={user?.id}
          onClose={() => setIsAddressModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
