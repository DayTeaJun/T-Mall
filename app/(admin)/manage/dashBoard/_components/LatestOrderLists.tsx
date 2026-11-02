"use client";

import { useGetOrders } from "@/lib/queries/orders";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { ArrowRight, Loader2, Package, PackageX } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Product {
  name: string;
  image_url: string | null;
}
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string | null;
  delivery_status: string | null;
  products: Product | null;
}

function LatestOrderLists() {
  const router = useRouter();
  const { user } = useAuthStore();
  const LIMIT = 10;

  const { data: orders, isLoading } = useGetOrders(
    user?.id ?? "",
    {},
    1,
    LIMIT,
    3,
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "배송중":
        return "text-blue-600";
      case "결제완료":
        return "text-green-600";
      case "배송완료":
        return "text-gray-600";
      case "취소됨":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="w-full bg-white p-2 sm:p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-[16px] font-bold text-gray-800 p-2 sm:p-0">
          최근 주문 목록
        </p>
        <button
          onClick={() => router.push("/manage/orderList?query=&page=1")}
          className="group flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-all duration-300"
        >
          <span className="transition-all duration-300">전체 보기</span>
          <ArrowRight
            size={14}
            className="transform transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
          />
        </button>
      </div>

      {!user?.id || isLoading ? (
        <div className="h-full flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-300" size={32} />
        </div>
      ) : orders?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <PackageX size={48} className="mb-4" />
          <p>주문 내역이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="w-full flex sm:hidden flex-col gap-4 px-1">
            {orders?.data?.map((order) => {
              const firstItem = order.order_items?.[0];
              const itemCount = order.order_items?.length || 0;
              const totalPrice = order.order_items?.reduce(
                (acc: number, item: OrderItem) =>
                  acc + item.price * item.quantity,
                0,
              );

              return (
                <div
                  key={order.id}
                  className="w-full flex flex-col rounded border border-gray-100 bg-white p-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-50 mb-3">
                    <span className="font-bold text-xs sm:text-sm text-gray-900 tracking-tight">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )
                        : "알 수 없음"}
                    </span>
                    <button
                      onClick={() =>
                        router.push(
                          `/manage/orderList/orderDetail?orderId=${order.id}`,
                        )
                      }
                      type="button"
                      className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-0.5 font-medium transition-colors cursor-pointer"
                    >
                      주문상세 &gt;
                    </button>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="relative w-18 h-18 border border-gray-100 rounded-lg overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                      {firstItem?.products?.image_url ? (
                        <Image
                          src={firstItem.products.image_url}
                          alt={firstItem.products.name || "상품 이미지"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="text-gray-300">
                          <Package size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-1 min-w-0 h-18 justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-gray-900 truncate flex-1 leading-snug">
                          {firstItem?.products?.name || "상품 정보 없음"}
                        </h4>
                        {itemCount > 1 && (
                          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-sm shrink-0">
                            + {itemCount - 1}건
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex w-fit items-center text-[11px] font-bold my-0.5 ${getStatusStyle(firstItem?.delivery_status || "결제완료")}`}
                      >
                        {firstItem?.delivery_status ?? "결제완료"}
                      </span>

                      <p className="text-12 text-gray-500 tracking-tight">
                        {totalPrice?.toLocaleString()}원
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-3.5 pt-3 border-t border-dashed border-gray-100 text-[11px] text-gray-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 font-sans">주문자</span>
                      <span className="font-sans font-semibold text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded-xs">
                        {order.user_name || "비회원"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-300">ID:</span>
                      <span className="truncate max-w-[120px] text-gray-400 select-all">
                        {order.user_id || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <table className="sm:table hidden w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-sm">
                <th className="py-3 px-2 font-medium w-[22%]">상품정보</th>
                <th className="py-3 px-2 font-medium w-[13%]">고객명</th>
                <th className="py-3 px-2 font-medium w-[30%]">주문번호</th>
                <th className="py-3 px-2 font-medium w-[15%]">주문일자</th>
                <th className="py-3 px-2 font-medium w-[10%]">결제금액</th>
                <th className="py-3 px-2 font-medium text-center w-[10%]">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {orders?.data?.map((order) => {
                const firstItem = order.order_items?.[0];
                const itemCount = order.order_items?.length || 0;
                const totalPrice = order.order_items?.reduce(
                  (acc: number, item: OrderItem) =>
                    acc + item.price * item.quantity,
                  0,
                );
                return (
                  <tr
                    key={order.id}
                    onClick={() =>
                      router.push(
                        `/manage/orderList/orderDetail?orderId=${order.id}`,
                      )
                    }
                    className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-2 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-white border border-gray-200 flex-shrink-0">
                          {firstItem?.products?.image_url ? (
                            <Image
                              fill
                              src={firstItem.products.image_url}
                              alt="product"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package size={18} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-900 truncate group-hover:underline">
                            {firstItem?.products?.name || "상품 정보 없음"}
                          </span>
                          {itemCount > 1 && (
                            <span className="text-[11px] text-gray-400 mt-0.5">
                              외 {itemCount - 1}건의 상품
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 font-semibold">
                      {order.user_name}
                    </td>
                    <td className="py-4 px-2 font-mono text-gray-600">
                      {order.id}
                    </td>
                    <td className="py-4 text-gray-500 font-mono text-[13px]">
                      {order.created_at &&
                        new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-2 font-medium">
                      {totalPrice.toLocaleString()}원
                    </td>
                    <td className="py-4 px-2">
                      <span
                        className={`px-2 py-1 rounded-md text-12 font-medium flex justify-center ${getStatusStyle(firstItem?.delivery_status || "결제완료")}`}
                      >
                        {firstItem?.delivery_status || "결제완료"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default LatestOrderLists;
