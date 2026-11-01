"use client";

import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProductAllCart } from "@/lib/queries/products";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Modal from "@/components/common/modal/Modal";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import AddressListModal from "@/components/common/modal/delivery/AddressModal";
import { useGetDefaultAddress } from "@/lib/queries/auth";
import { useGetMyCoupon } from "@/lib/queries/coupon";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

export default function CheckoutPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemIds = searchParams.getAll("itemIds");
  const couponId = searchParams.get("couponId") ?? undefined;

  const { data: selectedUserCoupon } = useGetMyCoupon(
    user?.id || "",
    couponId || "",
  );
  const selectedCoupon = selectedUserCoupon?.coupon;

  const { data: defaultAddress } = useGetDefaultAddress(user?.id || "");

  const { data: cartItems, isLoading } = useProductAllCart(user?.id ?? "");

  const selectedCartItems = useMemo(() => {
    return cartItems?.filter((item) => itemIds.includes(item.id)) ?? [];
  }, [cartItems, itemIds]);

  const totalPrice = selectedCartItems.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

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

  const [request, setRequest] = useState(
    defaultAddress?.delivery_instruction || "",
  );

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && selectedCartItems.length === 0) {
      router.replace("/not-found");
    }
  }, [isLoading, selectedCartItems, router]);

  useEffect(() => {
    if (defaultAddress?.delivery_instruction) {
      setRequest(defaultAddress?.delivery_instruction);
    }
  }, [defaultAddress?.delivery_instruction]);

  const handlePayment = async () => {
    if (!user?.phone) {
      return toast.info("전화번호가 입력이 되지 않았습니다.");
    }

    if (!user?.address) {
      return toast.info("배송지가 없습니다. 배송지를 추가해 주세요");
    }

    if (!defaultAddress) {
      return toast.info("기본 배송지가 설정이 되지않았습니다.");
    }

    sessionStorage.setItem("checkoutItems", JSON.stringify(selectedCartItems));
    sessionStorage.setItem("request", request);
    sessionStorage.setItem("receiver", defaultAddress?.receiver_name);
    sessionStorage.setItem("detailAddress", user.address);
    sessionStorage.setItem("couponId", couponId ?? "");

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
        orderName: `${selectedCartItems[0]?.product?.name ?? "상품"} 외 ${
          selectedCartItems.length - 1
        }건`,
        successUrl: `${window.location.origin}/mypage/myCart/checkout/success`,
        failUrl: `${window.location.origin}/mypage/myCart/checkout/fail`,
        customerName: defaultAddress?.receiver_name ?? "",
        customerEmail: user?.email ?? "",
        customerMobilePhone:
          (user?.phone ?? "").replace(/-/g, "") ?? "01000000000",
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

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-600">
        <LoaderCircle size={48} className="animate-spin mb-4" />
        <p className="text-sm">장바구니 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
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

              {user?.phone ? (
                <p className="text-sm text-gray-700">전화번호: {user?.phone}</p>
              ) : (
                <div className="flex sm:flex-row sm:gap-0 gap-2 flex-col justify-between sm:items-center">
                  <p className="text-sm text-gray-500">
                    전화번호가 등록이 되지 않았습니다.
                  </p>

                  <button
                    className="text-sm underline text-gray-500 sm:ml-0 ml-auto"
                    onClick={() =>
                      router.push(
                        `/mypage/profile/edit?from=mypage/myCart/checkout?itemIds=${itemIds}`,
                      )
                    }
                  >
                    전화번호 등록하기
                  </button>
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
            <span className="font-bold">{selectedCartItems.length} </span>개
            품목
          </p>
          <ul className="flex flex-col gap-2">
            {selectedCartItems.map((item) => (
              <li key={item.id} className="flex gap-4 border rounded p-4">
                <Image
                  src={item.product?.image_url ?? "/default-product.jpg"}
                  alt={item.product?.name ?? "상품 이미지"}
                  width={80}
                  height={80}
                  className="rounded border object-cover w-20 h-20"
                />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{item.product?.name}</p>
                  {item.options && (
                    <p className="text-sm text-gray-500">
                      {Object.entries(item.options)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" / ")}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    수량: {item.quantity}개 · 가격: ₩
                    {(item.product?.price ?? 0).toLocaleString()} · 총 가격 :{" "}
                    {(item.product?.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
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
        className="rounded-none max-h-[85vh] flex flex-col"
      >
        <AddressListModal
          userId={user?.id}
          onClose={() => setIsAddressModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
