"use client";

import { queryClient } from "@/components/providers/ReactQueryProvider";
import { updateDeliveryStatus } from "@/lib/actions/admin";
import { useGetOrders } from "@/lib/queries/orders";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { LoaderCircle, PackageX, RefreshCcw, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import ReactPaginate from "react-paginate";
import { toast } from "sonner";

export default function AdminOrderList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [recent6Months, setRecent6Months] = useState(true);

  const keyword = searchParams.get("query") ?? "";
  const [searchInput, setSearchInput] = useState(keyword);

  const currentPage = Number(searchParams.get("page") ?? 1);

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected.selected + 1;
    router.push(`/manage/orderList?query=${keyword}&page=${newPage}`);
  };

  const handleSearch = () => {
    router.push(`/manage/orderList?query=${searchInput}&page=1`);
  };

  const handleSearchRefresh = () => {
    setRecent6Months(true);
    setSelectedYear(null);
    setSearchInput("");
    router.push("/manage/orderList?query=&page=1");
  };

  const { data: orders, isLoading } = useGetOrders(
    user?.id ?? "",
    { searchKeyword: keyword, recent6Months, year: selectedYear ?? undefined },
    currentPage,
    5,
    user?.level ?? 0,
  );

  const totalCount = orders?.count ?? 0;
  const pageCount = Math.ceil(totalCount / 5);

  const handleYearClick = (year: number) => {
    setSelectedYear(year);
    setRecent6Months(false);
    router.push("/manage/orderList?query=&page=1");
  };

  const handleRecentClick = () => {
    setSelectedYear(null);
    setRecent6Months(true);
    router.push("/manage/orderList?query=&page=1");
  };

  const statusOptions = [
    "결제완료",
    "배송준비중",
    "배송중",
    "배송완료",
    "취소됨",
  ];

  const handleStatusChange = async (orderItemId: string, status: string) => {
    try {
      await updateDeliveryStatus(orderItemId, status);
      toast.success("배송 상태가 변경되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      toast.error("배송 상태 변경 실패");
      console.error(err);
    }
  };

  if (!user?.level || user.level < 2) {
    return (
      <div className="text-center py-20 text-gray-600">
        관리자 또는 판매자만 접근 가능한 페이지입니다.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-4">
      <h2 className="text-xl font-bold">주문 관리</h2>

      <div className="flex items-center gap-2 relative w-full">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="주문자 이름 또는 이메일 검색 가능"
          className="w-full px-3 py-2 pr-10 border rounded-md text-sm"
        />

        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
            }}
            className="absolute right-[52px] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}

        <button
          onClick={handleSearch}
          className="p-2 text-black border rounded-md cursor-pointer"
        >
          <Search size={20} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="hidden w-full sm:block sm:w-auto overflow-x-scroll sm:overflow-x-auto sm:pb-0 pb-1">
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
        <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-600">
          <LoaderCircle size={48} className="animate-spin mb-4" />
          <p className="text-sm">주문목록을 불러오는 중...</p>
        </div>
      ) : orders?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <PackageX size={48} className="mb-4" />
          <p>주문 내역이 없습니다.</p>
        </div>
      ) : (
        orders?.data?.map((order) => (
          <div
            key={order.id}
            className="border rounded-md p-3 sm:p-4 bg-white "
          >
            <div className="flex flex-col sm:flex-row items-start sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-[14px] sm:text-[16px]">
                  주문일:{" "}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("ko-KR")
                    : "날짜 정보 없음"}
                </p>
                <p className="text-[12px] sm:text-[14px] text-gray-500">
                  주문자: {order.user_name} ({order.email})
                </p>
              </div>
              <button
                onClick={() =>
                  router.push(
                    `/manage/orderList/orderDetail?orderId=${order.id}`,
                  )
                }
                className="text-sm hover:underline"
              >
                주문 상세보기 &gt;
              </button>
            </div>

            <ul className="flex flex-col gap-1">
              {order.order_items.map((item, i) => (
                <li
                  key={item.id}
                  className={`flex items-stretch py-4 gap-3 sm:p-4 ${
                    order.order_items.length - i !== 1 ? "border-b" : ""
                  }`}
                >
                  <Image
                    src={item.products.image_url ?? ""}
                    alt={item.products.name}
                    width={80}
                    height={80}
                    className="rounded border object-cover w-20 h-20"
                  />
                  <div className="flex flex-col sm:justify-center justify-start">
                    <p className="font-medium">{item.products.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.price.toLocaleString()}원 · {item.quantity}개 ·
                      사이즈: {item.size}
                    </p>

                    <select
                      value={item.delivery_status ?? "결제완료"}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value)
                      }
                      className="border p-1 rounded text-sm sm:hidden mt-auto block"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-col justify-center border-l pl-4 self-stretch hidden sm:flex ml-auto">
                    <select
                      value={item.delivery_status ?? "결제완료"}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value)
                      }
                      className="border p-1 rounded text-sm"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
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
    </div>
  );
}
