"use client";

import { useState } from "react";
import { Loader2, MessageCircleQuestion } from "lucide-react";
import ReactPaginate from "react-paginate";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  PRODUCT_REVIEWS_PAGE_SIZE,
  ProductReviewRow,
  useMyProductReviewQuery,
  useProductReviewsQuery,
} from "@/lib/queries/products";
import ReviewBtn from "./ReviewBtn";
import ReviewCard from "./ReviewCard";

interface Props {
  productId: string;
  initialReviews?: ProductReviewRow[];
  initialTotalCount?: number;
}

function withIsLiked(comment: ProductReviewRow, userId?: string) {
  const isLiked = userId
    ? (comment.review_helpfuls?.some(
        (h: { user_id: string }) => h.user_id === userId,
      ) ?? false)
    : false;

  return { ...comment, isLiked };
}

export default function ReviewsSection({
  productId,
  initialReviews,
  initialTotalCount,
}: Props) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [page, setPage] = useState(1);

  const { myReview, isLoading: isMyReviewLoading } = useMyProductReviewQuery(
    productId,
    userId,
  );

  // 서버 컴포넌트에서 1페이지를 미리 받아온 경우, 그 데이터를 그대로
  // react-query의 초기 데이터로 써서 첫 진입 시 로딩 깜빡임 없이 바로 보여줌
  const hasInitialData = initialTotalCount !== undefined;

  // 내 리뷰는 위의 "내가 남긴 리뷰" 섹션에서 따로 보여주므로 목록에서는 제외
  const { reviews, totalCount, isLoading } = useProductReviewsQuery(
    productId,
    page,
    PRODUCT_REVIEWS_PAGE_SIZE,
    hasInitialData
      ? { reviews: initialReviews ?? [], totalCount: initialTotalCount }
      : undefined,
    userId,
  );

  const comments = reviews.map((comment) => withIsLiked(comment, userId));
  const myReviewWithIsLiked = myReview ? withIsLiked(myReview, userId) : null;

  const pageCount = Math.max(
    1,
    Math.ceil(totalCount / PRODUCT_REVIEWS_PAGE_SIZE),
  );

  return (
    <section
      id="product-comments-section"
      className="border-t scroll-mt-[146px] w-full"
    >
      <div className="flex justify-between items-center px-4 sm:px-0">
        <h2 className="text-[18px] sm:text-[20px] font-semibold my-4">
          상품 리뷰
        </h2>

        {!isMyReviewLoading && !myReviewWithIsLiked && (
          <ReviewBtn productId={productId} />
        )}
      </div>

      {myReviewWithIsLiked && (
        <ReviewCard
          comment={myReviewWithIsLiked}
          productId={productId}
          isMyItem
        />
      )}

      <ul className="list-none pl-0 divide-y divide-gray-100">
        {isLoading ? (
          <li className="py-10 flex flex-col items-center gap-2 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
          </li>
        ) : comments.length === 0 ? (
          !myReviewWithIsLiked && (
            <li className="py-10 mx-4 sm:mx-0 flex flex-col items-center gap-2 text-gray-500 text-[16px] sm:text-[18px] border-dashed border-2 border-gray-200 rounded-sm">
              <MessageCircleQuestion size={36} className="sm:w-10 sm:h-10" />
              아직 작성된 리뷰가 없습니다.
            </li>
          )
        ) : (
          comments.map((comment) => (
            <li key={comment.id}>
              <ReviewCard comment={comment} productId={productId} />
            </li>
          ))
        )}
      </ul>

      {!isLoading && pageCount > 1 && (
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
      )}
    </section>
  );
}
