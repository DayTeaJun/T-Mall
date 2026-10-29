"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Loader2, MessageSquare, Star, Calendar, Package } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ReactPaginate from "react-paginate";
import { useDelReview, useGetReviews } from "@/lib/queries/reviews";

export interface Review {
  id: string;
  content: string;
  rating: number;
  images: string[] | null;
  user_name: string;
  user_id: string;
  product_id: string;
  created_at: string | null;
  updated_at: string | null;
  product_image?: string | null;
  product_name?: string | null;
}

export default function MyReviewsList() {
  const LIMIT = 5;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPage = Number(searchParams.get("page")) || 1;

  const { user } = useAuthStore();

  const { data, isLoading, isError } = useGetReviews(
    user?.id || "",
    currentPage,
    LIMIT,
  );
  const { mutate: deleteReview } = useDelReview(user?.id || "");

  const handleDelReview = (reviewId: string) => {
    if (confirm("정말로 리뷰를 삭제하시겠습니까?")) {
      deleteReview(reviewId);
    }
  };

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected.selected + 1;

    const params = new URLSearchParams(searchParams.toString());

    params.set("page", newPage.toString());

    router.push(`${pathname}?${params.toString()}`);
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
        리뷰를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const totalCount = data?.count || 0;
  const pageCount = Math.ceil(totalCount / LIMIT);

  if (reviews.length === 0) {
    return (
      <div className="py-20 text-center border border-gray-200 bg-gray-50">
        <MessageSquare size={40} className="mx-auto text-gray-200 mb-2" />
        <p className="text-gray-500 text-sm">작성하신 리뷰가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 sm:py-2">
      {reviews.map((review: Review) => (
        <div key={review.id} className="border border-gray-200">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 border-b border-gray-200 gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 border border-gray-200 bg-white shrink-0">
                {review.product_image ? (
                  <Image
                    src={review.product_image}
                    alt="상품"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={18} />
                  </div>
                )}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <button
                  onClick={() => router.push(`/products/${review.product_id}`)}
                  className="text-xs sm:text-sm font-bold text-gray-800 hover:underline line-clamp-1 text-left w-full"
                >
                  {review.product_name || "상품 정보 없음"}
                </button>
                <div className="flex items-center gap-3 text-[11px] sm:text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {review.created_at?.split("T")[0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-2 sm:pt-0 sm:border-none">
              <button
                onClick={() =>
                  router.push(`/productReview/${review.product_id}?from=mypage`)
                }
                className="hover:text-blue-600 px-2 py-1 border border-gray-300 bg-white rounded-xs"
              >
                수정
              </button>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <button
                onClick={() => handleDelReview(review.id)}
                className="hover:text-red-500 px-2 py-1 border border-gray-300 bg-white rounded-xs"
              >
                삭제
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < review.rating
                        ? "text-orange-500 fill-orange-500"
                        : "text-gray-200"
                    }
                  />
                ))}
              </div>
              {review.updated_at && review.updated_at !== review.created_at && (
                <span className="text-[10px] sm:text-[11px] text-blue-500 bg-blue-50 Bash-1.5 p-0.5 rounded-sm font-medium">
                  수정됨
                </span>
              )}
            </div>
            <div className="text-sm sm:text-[15px] text-gray-800 leading-relaxed min-h-[40px] whitespace-pre-wrap">
              {review.content}
            </div>
          </div>
        </div>
      ))}

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
    </div>
  );
}
