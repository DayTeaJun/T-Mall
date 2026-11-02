"use client";

import ReactPaginate from "react-paginate";
import CartBtn from "@/components/common/buttons/CartBtn";
import Modal from "@/components/common/modal/Modal";
import {
  useGetOrders,
  useUpdateCancelOrderItem,
} from "@/lib/queries/orders";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  LoaderCircle,
  PackageX,
  RefreshCcw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function OrderList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [recent6Months, setRecent6Months] = useState(false);

  const keyword = searchParams.get("query") ?? "";
  const [searchInput, setSearchInput] = useState(keyword);

  const currentPage = Number(searchParams.get("page") ?? 1);

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected.selected + 1;
    router.push(`/mypage/orderList?query=${keyword}&page=${newPage}`);
  };

  const handleSearch = () => {
    router.push(`/mypage/orderList?query=${searchInput}&page=1`);
  };

  const handleSearchRefresh = () => {
    setRecent6Months(false);
    setSelectedYear(null);
    setSearchInput("");
    router.push("/mypage/orderList?query=&page=1");
  };

  const { data: orders, isLoading } = useGetOrders(
    user?.id ?? "",
    {
      searchKeyword: keyword,
      recent6Months,
      year: selectedYear ?? undefined,
    },
    currentPage,
    5,
  );

  const totalCount = orders?.count ?? 0;
  const pageCount = Math.ceil(totalCount / 5);

  const { mutate: cancelOrderItem } = useUpdateCancelOrderItem(user?.id ?? "");

  const [isCancelOrderModal, setIsCancelOrderModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{
    orderItemId: string;
    deliveryStatus: string;
  } | null>(null);

  const handleYearClick = (year: number) => {
    setSelectedYear(year);
    setRecent6Months(false);
    router.push("/mypage/orderList?query=&page=1");
  };

  const handleRecentClick = () => {
    setSelectedYear(null);
    setRecent6Months(true);
    router.push("/mypage/orderList?query=&page=1");
  };

  const handleCancelOrder = () => {
    if (!cancelTarget || !user?.id) {
      toast.error("주문 정보를 찾을 수 없습니다.");
      return;
    }

    const { orderItemId } = cancelTarget;

    cancelOrderItem(orderItemId);
    setIsCancelOrderModal(false);
    setCancelTarget(null);
  };

  const statusColors: Record<string, string> = {
    결제완료: "text-gray-700",
    배송준비중: "text-blue-700",
    배송중: "text-yellow-700",
    배송완료: "text-green-700",
    취소됨: "text-red-700",
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-4">
      <h2 className="text-lg sm:text-xl font-bold">주문 내역</h2>

      <div className="flex items-center gap-2 relative w-full">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="상품 이름을 검색해보세요!"
          className="w-full px-3 py-2 pr-10 border rounded-md text-sm"
        />

        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
            }}
            className="absolute right-12 sm:right-[52px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="검색어 지우기"
          >
            <X size={18} />
          </button>
        )}

        <button
          onClick={handleSearch}
          className="p-2 text-black border rounded-md cursor-pointer active:scale-[0.98]"
          aria-label="검색"
        >
          <Search size={20} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="sm:block hidden w-full sm:w-auto overflow-x-scroll sm:overflow-x-auto sm:pb-0 pb-1">
          <div className="flex gap-2 pb-2">
            <button
              type="button"
              className={`px-3 py-2 rounded-md text-sm shrink-0 border ${
                recent6Months
                  ? "bg-gray-500 text-white"
                  : "text-gray-700 hover:bg-gray-300 hover:text-white"
              }`}
              onClick={handleRecentClick}
            >
              최근 6개월
            </button>
            {Array.from({ length: 6 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <button
                  key={year}
                  onClick={() => handleYearClick(year)}
                  className={`px-3 py-2 rounded-md text-sm cursor-pointer shrink-0 border ${
                    selectedYear === year
                      ? "bg-gray-500 text-white"
                      : "text-gray-700 hover:bg-gray-300 hover:text-white"
                  }`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSearchRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm self-end sm:self-auto w-full sm:w-auto justify-center sm:justify-start"
        >
          <RefreshCcw size={16} />
          검색 초기화
        </button>
      </div>

      {isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center py-16 text-gray-600">
          <LoaderCircle size={40} className="animate-spin mb-3" />
          <p className="text-sm">주문목록 정보를 불러오고 있습니다...</p>
        </div>
      ) : orders?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-600">
          <PackageX size={44} className="mb-3" />
          <h3 className="text-base sm:text-lg font-semibold mb-1">
            주문 내역이 없습니다
          </h3>
          <p className="text-sm mb-5">
            아직 상품을 구매하신 이력이 없습니다. 쇼핑을 시작해보세요!
          </p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-100 transition"
          >
            <ShoppingCart size={16} />
            쇼핑하러 가기
          </button>
        </div>
      ) : (
        orders?.data?.map((order) => (
          <div key={order.id} className="border rounded-md p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2">
              <h3 className="font-semibold text-sm text-gray-800">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "알 수 없음"}{" "}
                주문
              </h3>
              <button
                onClick={() =>
                  router.push(
                    `/mypage/orderList/orderDetail?orderId=${order.id}`,
                  )
                }
                type="button"
                className="text-sm p-0 h-auto hover:underline cursor-pointer self-start sm:self-auto"
              >
                주문 상세보기 &gt;
              </button>
            </div>

            <ul className="flex flex-col">
              {order.order_items.map((item, i) => (
                <li
                  key={i}
                  className={`py-3 sm:p-4 bg-white ${
                    order.order_items.length - i !== 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-3 sm:gap-4">
                    <div
                      className="flex flex-col gap-2 cursor-pointer sm:flex-1"
                      onClick={() =>
                        router.push(`/products/${item.product_id}`)
                      }
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                          <Image
                            src={item.products.image_url ?? ""}
                            alt={item.products.name}
                            width={80}
                            height={80}
                            className="rounded border object-cover w-16 h-16 sm:w-20 sm:h-20"
                          />
                          <div className="flex flex-col gap-1 justify-center">
                            <p className="text-sm font-medium flex flex-wrap gap-1 items-center">
                              {item.products.name}
                              <span
                                className={`text-xs font-bold rounded-full w-fit ${
                                  statusColors[
                                    item.delivery_status ?? "결제완료"
                                  ]
                                }`}
                              >
                                · {item.delivery_status ?? "결제완료"}
                              </span>
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {item.price.toLocaleString()}원 · {item.quantity}
                              개 · 사이즈: {item.size}
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:block">
                          <CartBtn
                            className="w-30 h-fit border my-auto rounded-md px-2 py-1 text-[14px] text-gray-700 hover:bg-gray-200 cursor-pointer"
                            productId={item.product_id}
                            quantity={1}
                            selectedSize={item.size || ""}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="sm:flex sm:flex-col sm:items-end sm:justify-center sm:gap-2 sm:border-l sm:pl-4">
                      <div className="sm:hidden">
                        <CartBtn
                          className="w-full border rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
                          productId={item.product_id}
                          quantity={1}
                          selectedSize={item.size || ""}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2 mt-2 sm:mt-0">
                        {item.delivery_status === "배송중" && (
                          <button
                            onClick={() =>
                              toast.info("배송 현황은 준비중 입니다.")
                            }
                            className="border rounded-md px-2 sm:py-1 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
                          >
                            배송 현황 보기
                          </button>
                        )}

                        {item.delivery_status !== "배송완료" && (
                          <button
                            onClick={() => {
                              if (item.delivery_status === "취소됨") {
                                toast.error("이미 취소된 주문입니다.");
                                return;
                              }
                              setCancelTarget({
                                orderItemId: item.id,
                                deliveryStatus: item.delivery_status || "",
                              });
                              setIsCancelOrderModal(true);
                            }}
                            className={`border rounded-md px-2 sm:py-1 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer w-auto sm:w-30 ${
                              item.delivery_status === "배송중"
                                ? "col-span-1"
                                : "col-span-2 sm:col-span-1"
                            }`}
                          >
                            주문 취소
                          </button>
                        )}

                        {item.delivery_status === "배송완료" && (
                          <>
                            <button
                              onClick={() =>
                                toast.info("교환, 반품 신청은 준비중 입니다.")
                              }
                              className="border rounded-md px-2 sm:py-1 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
                            >
                              교환, 반품 신청
                            </button>
                            <button
                              onClick={() =>
                                router.push(`/productReview/${item.product_id}`)
                              }
                              className="border rounded-md px-2 sm:py-1 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
                            >
                              리뷰 작성하기
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {pageCount > 1 && (
        <div className="mt-6 flex justify-center">
          <ReactPaginate
            onPageChange={handlePageChange}
            pageRangeDisplayed={3}
            pageCount={pageCount}
            forcePage={currentPage - 1}
            marginPagesDisplayed={1}
            previousLabel={"<"}
            nextLabel={">"}
            breakLabel={"..."}
            breakClassName={"break-me"}
            containerClassName={"pagination"}
            activeClassName={"active"}
            pageClassName={"page-item"}
            pageLinkClassName={"page-link"}
            previousClassName={"page-item"}
            previousLinkClassName={"page-link"}
            nextClassName={"page-item"}
            nextLinkClassName={"page-link"}
          />
        </div>
      )}

      <Modal
        isOpen={isCancelOrderModal}
        onClose={() => {
          setIsCancelOrderModal(false);
          setCancelTarget(null);
        }}
        title="정말 주문을 취소하시겠습니까?"
        description={`결제완료 이후의 주문만 취소할 수 있으며,\n취소 후 복구는 불가능합니다.`}
      >
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setIsCancelOrderModal(false);
              setCancelTarget(null);
            }}
            className="px-4 py-2 text-gray-600 hover:underline"
          >
            아니요
          </button>
          <button
            onClick={handleCancelOrder}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            주문 취소
          </button>
        </div>
      </Modal>
    </div>
  );
}
