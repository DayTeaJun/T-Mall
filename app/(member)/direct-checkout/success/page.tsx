"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { CheckoutItem } from "@/types/product";
import { confirmOrder } from "@/lib/actions/checkout";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processOrder = async () => {
      try {
        const orderId = searchParams.get("orderId");
        const paymentKey = searchParams.get("paymentKey");

        if (!orderId || !paymentKey) {
          throw new Error("결제 정보가 유효하지 않습니다.");
        }

        const request = sessionStorage.getItem("request") ?? "";
        const receiver = sessionStorage.getItem("receiver") ?? "";
        const detailAddress = sessionStorage.getItem("detailAddress") ?? "";
        const rawUserCouponId = sessionStorage.getItem("couponId");
        const userCouponId =
          rawUserCouponId && rawUserCouponId !== "" ? rawUserCouponId : null;

        const items: CheckoutItem[] = JSON.parse(
          sessionStorage.getItem("checkoutItems") ?? "[]",
        );

        if (!Array.isArray(items) || items.length === 0) {
          throw new Error("상품 정보가 비어 있습니다.");
        }

        // 가격/할인 계산과 Toss 승인은 서버(confirmOrder)에서 다시 검증하며 처리됨.
        // 바로구매는 장바구니를 거치지 않으므로 clearCartAfter는 false.
        const { orderId: newOrderId } = await confirmOrder({
          orderId,
          paymentKey,
          request,
          receiver,
          detailAddress,
          userCouponId,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.options?.size ?? null,
          })),
          clearCartAfter: false,
        });

        router.refresh();
        sessionStorage.removeItem("checkoutItems");
        sessionStorage.removeItem("request");
        sessionStorage.removeItem("receiver");
        sessionStorage.removeItem("detailAddress");
        sessionStorage.removeItem("couponId");

        toast.success("주문이 완료되었습니다.");
        window.location.href = `/mypage/my-cart/checkout/success-done?orderId=${newOrderId}`;
      } catch (err) {
        console.error("주문 처리 중 오류 발생:", err);

        toast.error("주문 처리 중 오류가 발생했습니다. 장바구니로 이동합니다.");

        setTimeout(() => router.back(), 2500);
      }
    };

    processOrder();
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-[60vh] text-gray-700">
      <LoaderCircle size={48} className="animate-spin mb-4 text-blue-500" />
      <p className="text-lg font-semibold">결제가 완료되었습니다.</p>
      <p className="text-sm mt-2 text-gray-500">주문을 저장 중입니다...</p>
    </div>
  );
}
