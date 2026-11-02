"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  LoaderCircle,
  UserRound,
  StickyNote,
  Package,
  PackageX,
  Ticket,
} from "lucide-react";
import { useGetOrderDetails } from "@/lib/queries/orders";
import { toast } from "sonner";
import { OrderItemType } from "@/types/product";

export default function CheckoutDonePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { data: order, isLoading } = useGetOrderDetails(orderId || "");
  const router = useRouter();

  const totalAmount = order?.order_items.reduce(
    (total: number, item: OrderItemType) => total + item.price * item.quantity,
    0,
  );

  if (!orderId) {
    toast.error("잘못된 접근입니다.");
    router.push("/");
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-600">
        <LoaderCircle size={48} className="animate-spin mb-4" />
        <p className="text-sm">주문 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-600">
        <PackageX size={48} className="mb-4" />
        <p className="text-sm">해당 주문 정보를 찾을 수 없습니다.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={() => router.push("/")}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold -mb-2">주문 완료</h1>
      <p className="text-sm text-gray-500">
        주문일: {new Date(order.created_at!).toLocaleString()}
      </p>

      <ul className="flex flex-col border p-5 gap-5">
        {order.order_items.map((item: OrderItemType, idx: number) => (
          <li
            key={idx}
            className={`flex gap-4 items-center ${
              idx < order.order_items.length - 1 ? "border-b" : ""
            } pb-4`}
          >
            <Image
              width={200}
              height={200}
              src={item.products?.image_url ?? "/default.jpg"}
              alt={item.products?.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex flex-col justify-center">
              <p className="text-sm font-medium">{item.products.name}</p>
              <p className="text-sm text-gray-500">
                {item.price.toLocaleString()}원 · {item.quantity}개 · 사이즈:{" "}
                {item.size}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="border rounded p-4 mb-6 bg-gray-50 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <UserRound size={16} />
          <span className="font-bold">
            수령인 :{" "}
            <span className="font-normal">{order.receiver || "정보 없음"}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Package size={16} />
          <span className="font-bold">
            배송지 :{" "}
            <span className="font-normal">
              {order.detail_address || "정보 없음"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <StickyNote size={16} />
          <span className="font-bold">
            배송 요청사항 :{" "}
            <span className="font-normal">{order.request || "없음"}</span>
          </span>
        </div>

        {order.coupon && (
          <div className="flex items-center gap-2 text-gray-700 pt-2 border-t">
            <Ticket size={16} className="text-gray-600" />
            <span className="font-bold">
              사용한 쿠폰 :{" "}
              <span className="font-normal text-gray-600">
                {order.coupon.name} (
                {order.discount_amount
                  ? `-${order.discount_amount.toLocaleString()}원 할인`
                  : ""}
                )
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 border-t border-gray-200 py-4 border-b bg-white flex flex-col gap-3">
        <div className="flex justify-between items-center text-gray-500">
          <span className="text-sm sm:text-base font-medium">총 상품 금액</span>
          <span className="text-sm sm:text-base">
            {totalAmount?.toLocaleString()}원
          </span>
        </div>

        {order?.discount_amount ? (
          <div className="flex justify-between items-center text-red-500">
            <span className="text-sm sm:text-base font-medium">쿠폰 할인</span>
            <span className="text-sm sm:text-base">
              -{order.discount_amount.toLocaleString()}원
            </span>
          </div>
        ) : null}

        <div className="border-t border-gray-100 my-1"></div>

        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-800 text-base sm:text-lg">
            총 결제 금액
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-gray-600 tracking-tight">
            {(
              Number(totalAmount) - (order?.discount_amount || 0)
            ).toLocaleString()}
            <span className="text-base font-bold ml-1">원</span>
          </span>
        </div>
      </div>

      <div className="flex justify-end mt-2 mb-10">
        <button
          className="text-sm sm:text-14 font-semibold px-6 py-2 text-white bg-gray-700"
          onClick={() => router.push("/mypage/orderList?page=1")}
        >
          주문 내역 보기
        </button>
      </div>
    </div>
  );
}
