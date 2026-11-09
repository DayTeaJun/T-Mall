"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  useGetAvailableReviews,
  usePostHiddenReview,
} from "@/lib/queries/reviews";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Loader2, Package } from "lucide-react";
import ReactPaginate from "react-paginate";
import Modal from "@/components/common/modal/Modal";
import { toast } from "sonner";

export default function AvailableReviewsList() {
  const LIMIT = 5;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const currentPage = Number(searchParams.get("page")) || 1;

  const { mutate: delOrderItemMutate } = usePostHiddenReview(
    user?.id || "",
    currentPage,
  );

  const [isModal, setIsModal] = useState({ isOpen: false, orderId: "" });

  const { data, isLoading, isError } = useGetAvailableReviews(
    user?.id || "",
    currentPage,
    LIMIT,
  );

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected.selected + 1;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelOrderItem = (orderId: string) => {
    if (!orderId || !user?.id) {
      toast.error("주문 정보를 찾을 수 없습니다.");
      return;
    }

    delOrderItemMutate(orderId);
    setIsModal({ isOpen: false, orderId: "" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-500 font-medium">
        작성 가능한 리뷰를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  const items = data?.items || [];
  const totalCount = data?.count || 0;
  const pageCount = Math.ceil(totalCount / LIMIT);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center border border-gray-200 bg-gray-50">
        <Package size={40} className="mx-auto text-gray-200 mb-2" />
        <p className="text-gray-500 text-sm">작성 가능한 리뷰가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="divide-y divide-gray-200 border-b border-gray-200">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
              <div className="relative w-20 h-20 sm:w-[120px] sm:h-[120px] bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                {item.product_image ? (
                  <Image
                    src={item.product_image}
                    alt={item.product_name || "상품 이미지"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-sm" />
                )}
              </div>

              <div className="space-y-1 pt-0.5 flex-1 min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-snug truncate">
                  {item.product_name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 sm:line-clamp-1">
                  {item.product_description}
                </p>
                <div className="text-[11px] sm:text-xs text-gray-400 pt-1.5 sm:pt-3">
                  {item.delivered_at}
                </div>
              </div>
            </div>

            <div className="flex flex-row-reverse sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-4 shrink-0 w-full sm:w-[120px] pt-3 sm:pt-0 border-t border-dashed border-gray-100 sm:border-none self-stretch sm:self-center">
              <button
                onClick={() => router.push(`/productReview/${item.product_id}`)}
                className="flex-1 sm:flex-none w-full py-2 border border-blue-500 text-blue-600 text-xs sm:text-sm font-semibold rounded-sm hover:bg-blue-50/50 transition-colors text-center"
              >
                리뷰 작성하기
              </button>
              <button
                onClick={() =>
                  setIsModal({ isOpen: true, orderId: item.id || "" })
                }
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 tracking-wide px-2 py-1"
              >
                숨기기
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center text-xs sm:text-sm">
        <ReactPaginate
          onPageChange={handlePageChange}
          pageRangeDisplayed={3}
          pageCount={pageCount}
          forcePage={currentPage - 1}
          marginPagesDisplayed={1}
          previousLabel={"<"}
          nextLabel={">"}
          breakLabel={"..."}
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

      <Modal
        isOpen={isModal.isOpen}
        onClose={() => setIsModal({ isOpen: false, orderId: "" })}
        title="리뷰 내역을 숨기시겠습니까?"
        description={`(* 해당 주문은 목록에서 숨겨지며, 삭제 후 2개월간 복구할 수 있습니다.)`}
      >
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsModal({ isOpen: false, orderId: "" })}
            className="px-4 py-2 text-gray-600 hover:underline"
          >
            취소
          </button>
          <button
            onClick={() => handleDelOrderItem(isModal.orderId)}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            확인
          </button>
        </div>
      </Modal>
    </div>
  );
}
