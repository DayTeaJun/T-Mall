"use client";

import { useState } from "react";
import { Loader2, MailQuestion } from "lucide-react";
import ReactPaginate from "react-paginate";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  PRODUCT_INQUIRY_PAGE_SIZE,
  ProductInquiryRow,
  useMyProductInquiryQuery,
  useProductInquiryListQuery,
} from "@/lib/queries/products";
import InquiryCard from "./InquiryCard";
import InquiryPostBtn from "./InquiryPostBtn";

interface Props {
  productId: string;
  initialInquiries?: ProductInquiryRow[];
  initialTotalCount?: number;
}

function ProductInquiry({
  productId,
  initialInquiries,
  initialTotalCount,
}: Props) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [page, setPage] = useState(1);

  const { myInquiry, isLoading: isMyInquiryLoading } = useMyProductInquiryQuery(
    productId,
    userId,
  );

  const hasInitialData = initialTotalCount !== undefined;

  // 내 문의는 위의 "내 문의" 섹션에서 따로 보여주므로 목록에서는 제외
  const { inquiries, totalCount, isLoading } = useProductInquiryListQuery(
    productId,
    page,
    PRODUCT_INQUIRY_PAGE_SIZE,
    hasInitialData
      ? { inquiries: initialInquiries ?? [], totalCount: initialTotalCount }
      : undefined,
    userId,
  );

  const pageCount = Math.max(
    1,
    Math.ceil(totalCount / PRODUCT_INQUIRY_PAGE_SIZE),
  );

  return (
    <div
      className="min-h-20 border-b scroll-mt-[146px] w-full"
      id="product-qa-section"
    >
      <div className="flex flex-col gap-5 border border-gray-200 p-4 sm:p-5 mb-6 text-[12px] sm:text-sm text-gray-600 leading-relaxed">
        <div className="flex justify-between items-center -mb-1">
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-gray-800">
            상품 문의
          </h2>
          {!isMyInquiryLoading && !myInquiry && (
            <InquiryPostBtn productId={productId} />
          )}
        </div>

        <ul className="space-y-1.5 list-none pl-0 border-b border-gray-100 pb-4 text-gray-500 text-[12px] sm:text-[13px]">
          <li>
            <span className="font-medium text-gray-800">·</span> 구매한 상품의{" "}
            <span className="font-semibold text-gray-700">취소/반품/환불</span>{" "}
            은 마이쿠팡 구매내역에서 신청해 주세요. (본 게시판에서는 처리 불가)
          </li>
          <li>
            <span className="font-medium text-gray-800">·</span> 가격, 판매자,
            배송 등 상품 자체와 관련 없는 문의는 고객센터{" "}
            <span className="font-semibold text-gray-700">문의하기</span> 를
            이용해 주세요.
          </li>
          <li>
            <span className="font-medium text-gray-800">·</span> 상품과 관계없는
            글, 양도, 광고, 욕설, 비방성 글은 예고 없이{" "}
            <span className="font-semibold text-gray-700">
              노출 제한 및 삭제
            </span>{" "}
            조치될 수 있습니다.
          </li>
          <li>
            <span className="font-medium text-gray-800">·</span> 공개
            게시판이므로 전화번호, 이메일 등{" "}
            <span className="font-semibold text-gray-700">
              개인정보는 절대 남기지 마세요.
            </span>
          </li>
        </ul>

        <div className="w-full flex flex-col">
          {myInquiry && (
            <div className="border-b border-gray-100/60">
              <InquiryCard inquiry={myInquiry} productId={productId} isMyItem />
            </div>
          )}

          {isLoading ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            !myInquiry && (
              <ul className="space-y-4 pl-0">
                <li className="py-10 flex flex-col items-center gap-2 text-gray-500 text-[15px] sm:text-[18px] border-dashed border-2 border-gray-200 rounded-sm">
                  <MailQuestion
                    size={36}
                    className="text-gray-400 sm:w-10 sm:h-10"
                  />
                  아직 작성된 상품문의가 없습니다.
                </li>
              </ul>
            )
          ) : (
            <ul className="divide-y divide-gray-100/60">
              {inquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <InquiryCard inquiry={inquiry} productId={productId} />
                </li>
              ))}
            </ul>
          )}

          {!isLoading && pageCount > 1 && (
            <div className="flex justify-center mt-6 text-xs sm:text-sm">
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
        </div>
      </div>
    </div>
  );
}

export default ProductInquiry;
