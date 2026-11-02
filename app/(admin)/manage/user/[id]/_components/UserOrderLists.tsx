"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Package, Loader2, ChevronRight } from "lucide-react";
import ReactPaginate from "react-paginate";
import { useGetOrders } from "@/lib/queries/orders";
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

interface OrderData {
  id: string;
  created_at: string;
  user_id: string;
  user_name: string | null;
  email: string | null;
  order_items: OrderItem[];
}

interface UserOrderListsProps {
  userId: string;
}

function UserOrderLists({ userId }: UserOrderListsProps) {
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const router = useRouter();

  const { data, isLoading } = useGetOrders(userId, {}, page, LIMIT, 1);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  const orders = (data?.data as OrderData[]) || [];
  const totalCount = data?.count || 0;
  const pageCount = Math.ceil(totalCount / LIMIT);

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
    <section className="col-span-2 flex flex-col p-4 sm:pl-2">
      <div className="h-full border bg-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">
            최근 주문 목록
          </h2>
          <span className="text-xs sm:text-sm text-gray-500 font-medium">
            총 {totalCount}건
          </span>
        </div>

        <div className="flex flex-col justify-between h-full">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[350px] w-full text-gray-400 bg-white">
              <div className="p-2 bg-gray-50 rounded-full mb-3">
                <Package size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">
                주문 내역이 존재하지 않습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-left border-collapse border-t border-gray-200">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[12px] text-gray-500 uppercase">
                      <th className="py-3 px-4 font-bold w-[35%]">상품 정보</th>
                      <th className="py-3 px-4 font-bold text-center">
                        주문일자
                      </th>
                      <th className="py-3 px-4 font-bold text-center">
                        결제금액
                      </th>
                      <th className="py-3 px-4 font-bold text-center">
                        배송상태
                      </th>
                      <th className="py-3 px-4 font-bold text-center">
                        주문 상세
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {orders.map((order) => {
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
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="py-4 px-4">
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
                                <span className="font-bold text-gray-900 truncate">
                                  {firstItem?.products?.name ||
                                    "상품 정보 없음"}
                                </span>
                                {itemCount > 1 && (
                                  <span className="text-[11px] text-gray-400 mt-0.5">
                                    외 {itemCount - 1}건의 상품
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-500 font-mono text-[13px]">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-gray-900">
                            {totalPrice.toLocaleString()}원
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`text-[11px] font-semibold ${getStatusStyle(firstItem?.delivery_status || "결제완료")}`}
                            >
                              {firstItem?.delivery_status || "결제완료"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() =>
                                router.push(
                                  `/manage/orderList/orderDetail?orderId=${order.id}`,
                                )
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex sm:hidden flex-col gap-3">
                {orders.map((order) => {
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
                      className="w-full flex flex-col rounded border border-gray-100 bg-white p-4 cursor-pointer"
                    >
                      <div className="flex items-center justify-between pb-2.5 border-b border-gray-50 mb-3">
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
                            className={`inline-flex w-fit items-center text-[11px] font-bold text-blue-600 my-0.5 ${getStatusStyle(firstItem?.delivery_status || "결제완료")}`}
                          >
                            {firstItem?.delivery_status ?? "결제완료"}
                          </span>

                          <p className="text-12 text-gray-500 tracking-tight">
                            {totalPrice?.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {pageCount > 1 && (
            <div className="mt-6 flex justify-center border-t border-gray-100 pt-5 text-xs sm:text-sm">
              <ReactPaginate
                breakLabel="..."
                nextLabel=">"
                onPageChange={(e) => setPage(e.selected + 1)}
                pageRangeDisplayed={3}
                pageCount={pageCount}
                forcePage={page - 1}
                previousLabel="<"
                containerClassName="flex items-center gap-1"
                pageLinkClassName="px-2.5 sm:px-3 py-1 text-xs sm:text-[13px] border border-gray-200 text-gray-600 rounded-sm"
                activeLinkClassName="bg-black text-white border-black font-bold cursor-default"
                previousLinkClassName="px-2.5 sm:px-3 py-1 text-xs sm:text-[13px] border border-gray-200 rounded-sm"
                nextLinkClassName="px-2.5 sm:px-3 py-1 text-xs sm:text-[13px] border border-gray-200 rounded-sm"
                disabledLinkClassName="opacity-30 cursor-default"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default UserOrderLists;
