"use client";

import { CornerDownRight } from "lucide-react";
import InquiryDelBtn from "./InquiryDelBtn";
import ProductInquiryAnswer from "./ProductInquiryAnswer";
import { ProductInquiryRow } from "@/lib/queries/products";

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

interface InquiryCardProps {
  inquiry: ProductInquiryRow;
  productId: string;
  sellerId: string | null;
  isMyItem?: boolean;
}

export default function InquiryCard({
  inquiry,
  productId,
  sellerId,
  isMyItem = false,
}: InquiryCardProps) {
  return (
    <div
      className={`py-4 sm:py-5 flex flex-col gap-3 transition-colors ${
        isMyItem
          ? "bg-gray-50/70 -mx-4 px-4 sm:-mx-5 sm:px-5 my-1 first:mt-0 relative"
          : ""
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-[11px] sm:text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold px-1.5 py-0.5 rounded-xs text-[10px] sm:text-[11px] tracking-tight text-white ${
                isMyItem ? "bg-gray-900" : "bg-gray-500"
              }`}
            >
              {isMyItem ? "내 문의" : "질문"}
            </span>
            <span
              className={`font-medium ${isMyItem ? "text-gray-900 font-semibold" : "text-gray-600"}`}
            >
              {inquiry.user_name}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-gray-400">
            <span>{formatDate(inquiry.created_at)}</span>
            {isMyItem && (
              <InquiryDelBtn productId={productId} myInquiryId={inquiry.id} />
            )}
          </div>
        </div>

        <p
          className={`whitespace-pre-line pl-0.5 text-[13px] sm:text-sm leading-relaxed ${
            isMyItem ? "text-gray-950 font-medium" : "text-gray-800"
          }`}
        >
          {inquiry.content}
        </p>
      </div>

      {inquiry.answer_content ? (
        <div className="p-3.5 sm:p-4 rounded-sm border-t flex gap-2 items-start mt-1 bg-gray-50/50 border-gray-100">
          <CornerDownRight
            size={14}
            className="text-gray-400 shrink-0 mt-1 sm:w-4 sm:h-4"
          />

          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-[11px] sm:text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="bg-green-600 text-white font-bold px-1.5 py-0.5 rounded-xs text-[10px] sm:text-[11px]">
                  답변
                </span>
                <span className="font-bold text-gray-700">판매자</span>
              </div>
              {inquiry.answered_at && (
                <span>{formatDate(inquiry.answered_at)}</span>
              )}
            </div>

            <p className="text-gray-700 whitespace-pre-line text-[13px] sm:text-sm leading-relaxed pl-0.5">
              {inquiry.answer_content}
            </p>
          </div>
        </div>
      ) : (
        <ProductInquiryAnswer
          productId={productId}
          sellerId={sellerId}
          inquiry_id={inquiry.id}
          answer_content={inquiry.answer_content}
          answered_at={inquiry.answered_at}
        />
      )}
    </div>
  );
}
