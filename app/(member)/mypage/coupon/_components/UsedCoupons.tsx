"use client";

import { useGetMyUsedCoupons } from "@/lib/queries/coupon";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { formatWithoutYear } from "@/lib/utils";
import { useState } from "react";
import ReactPaginate from "react-paginate";

const PAGE_SIZE = 6;

export default function UsedCoupons() {
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();

  const {
    data: coupons,
    totalCount,
    isLoading,
  } = useGetMyUsedCoupons(user?.id || "", page, PAGE_SIZE);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const isEmpty = !isLoading && (!coupons || coupons.length === 0);

  return (
    <div className="flex flex-col justify-between gap-2 sm:min-h-[450px] min-h-[900px]">
      {isLoading ? (
        <div className="w-full flex-1 flex justify-center items-center gap-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
          <p className="text-gray-400 text-center py-10">
            쿠폰을 불러오는 중입니다
          </p>
        </div>
      ) : isEmpty ? (
        <div className="w-full flex-1 flex justify-center items-center">
          <p className="text-gray-400 text-center py-10">
            사용한 쿠폰이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {coupons?.map((item) => {
            const coupon = item.coupon;
            if (!coupon) return null;

            return (
              <div
                key={item.id}
                className="border border-gray-200 p-2 py-4 sm:p-6 sm:py-8 flex items-center justify-between bg-gray-50 opacity-80 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-gray-400 text-white text-[10px] font-bold px-3 py-1">
                  사용완료
                </div>

                <div className="w-[38%] text-center border-r border-dashed border-gray-300 pr-4">
                  <span className="text-3xl sm:text-5xl font-black tracking-tight text-gray-400">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `${coupon.discount_value.toLocaleString()}`}
                  </span>
                </div>

                <div className="w-[62%] pl-4 flex flex-col items-start gap-1.5 relative">
                  <div className="relative mb-1">
                    <p className="text-[11px] px-2 py-1 bg-gray-200 text-gray-600 w-fit font-medium">
                      {formatWithoutYear(coupon.created_at)}
                      {" ~ "}
                      {formatWithoutYear(coupon.expires_at)}
                    </p>
                  </div>

                  <h3 className="font-bold text-12 sm:text-base text-gray-600 line-through">
                    {coupon.name}
                  </h3>

                  <p className="text-xs text-gray-400">
                    최소주문{" "}
                    {coupon.min_order_price
                      ? coupon.min_order_price.toLocaleString() + "원 이상"
                      : "없음"}
                  </p>

                  {item.used_at && (
                    <p className="text-[11px] text-gray-400">
                      사용일:{" "}
                      {new Date(item.used_at).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center mt-6 mb-2 text-xs sm:text-sm">
        <ReactPaginate
          onPageChange={(e) => setPage(e.selected + 1)}
          pageRangeDisplayed={3}
          pageCount={pageCount}
          forcePage={page - 1}
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
    </div>
  );
}
