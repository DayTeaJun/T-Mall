"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  Loader2,
  MailQuestion,
  Calendar,
  Package,
  CornerDownRight,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ReactPaginate from "react-paginate";
import {
  useDelProductInquiry,
  useGetProductInquiries,
} from "@/lib/queries/inquiry";

export interface ProductInquiry {
  id: number; //
  user_id: string;
  user_name: string;
  product_id: string;
  content: string;
  admin_id: string | null;
  answer_content: string | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;

  product_image?: string | null;
  product_name?: string | null;
}

export default function ProductInquiriesList() {
  const LIMIT = 5;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPage = Number(searchParams.get("page")) || 1;
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useGetProductInquiries(
    user?.id || "",
    currentPage,
    LIMIT,
  );
  const { mutate: deleteInquiry } = useDelProductInquiry(user?.id || "");

  const handleDelInquiry = (inquiryId: number) => {
    if (confirm("정말로 문의를 삭제하시겠습니까?")) {
      deleteInquiry(inquiryId);
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
        <Loader2 className="animate-spin text-gray-500" size={40} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-500 font-medium">
        문의 내역을 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  const inquiries = data?.inquiries || [];
  const totalCount = data?.count || 0;
  const pageCount = Math.ceil(totalCount / LIMIT);

  if (inquiries.length === 0) {
    return (
      <div className="py-20 text-center border-dashed border-2 border-gray-200 bg-gray-50/50 rounded-sm">
        <MailQuestion size={40} className="mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500 text-sm">작성하신 상품 문의가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 sm:py-2">
      {inquiries.map((inquiry: ProductInquiry) => (
        <div key={inquiry.id} className="border border-gray-200">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 border-b border-gray-200 gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 border border-gray-200 bg-white shrink-0">
                {inquiry.product_image ? (
                  <Image
                    src={inquiry.product_image}
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
              <div className="space-y-1 flex-1 flex flex-col gap-1 min-w-0">
                <button
                  onClick={() => router.push(`/products/${inquiry.product_id}`)}
                  className="text-xs sm:text-sm font-bold text-gray-950 hover:underline line-clamp-1 text-left w-full"
                >
                  {inquiry.product_name || "상품 정보 없음"}
                </button>
                <span className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-400">
                  <Calendar size={12} /> {inquiry.created_at?.split("T")[0]}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-2 sm:pt-0 sm:border-none">
              <button
                onClick={() =>
                  router.push(
                    `/products/${inquiry.product_id}#product-qa-section`,
                  )
                }
                className="hover:text-blue-600 px-2 py-1 border border-gray-300 bg-white rounded-xs"
              >
                바로가기
              </button>

              <span className="text-gray-300 hidden sm:inline">|</span>

              <button
                onClick={() => handleDelInquiry(inquiry.id)}
                className="hover:text-red-500 px-2.5 py-1 border border-gray-300 bg-white rounded-xs transition-colors font-medium text-gray-700"
              >
                삭제
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap pl-1">
              {inquiry.content}
            </div>

            {inquiry.answer_content ? (
              <div className="p-4 border-t flex gap-2 items-start mt-1 bg-gray-50 border-gray-200">
                <CornerDownRight
                  size={16}
                  className="text-gray-400 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-600 text-white font-bold px-1.5 py-0.5 text-[11px]">
                        답변
                      </span>
                      <span className="font-bold text-gray-700">판매자</span>
                    </div>
                    {inquiry.answered_at && (
                      <span className="text-gray-500">
                        {inquiry.answered_at.split("T")[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-line text-[13px] sm:text-sm leading-relaxed font-normal">
                    {inquiry.answer_content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="pl-1 text-xs sm:text-sm text-gray-400 font-medium flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                답변 대기 중
              </div>
            )}
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
