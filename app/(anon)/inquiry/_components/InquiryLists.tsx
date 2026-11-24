import { createServerSupabaseClient } from "@/lib/config/supabase/server/server";
import React from "react";
import Pagination from "./Pagination";
import SearchInput from "./SearchInput";
import InquiryRow from "./InquiryRow";
import Createbtn from "./Createbtn";
import { InquiryListItem } from "@/lib/queries/inquiry";

const INQUIRY_TYPE_MAP: Record<string, string> = {
  DELIVERY: "배송",
  PRODUCT: "상품",
  CANCEL: "취소/반품",
  ORDER: "주문/결제",
  OTHER: "기타",
  AUTH: "계정",
};

async function InquiryLists({
  query,
  page,
  type,
}: {
  query: string;
  page: number;
  type: string;
}) {
  const supabase = await createServerSupabaseClient();

  const LIMIT = 10;
  const from = (page - 1) * LIMIT;

  const { data: inqueries } = await supabase.rpc("list_inquiries", {
    p_query: query?.trim() || "",
    p_type: type || "",
    p_limit: LIMIT,
    p_offset: from,
  });

  const count = inqueries?.[0]?.total_count ?? 0;
  const currentLength = inqueries?.length || 0;
  const emptyRowsCount = LIMIT - currentLength;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <SearchInput />

        <div className="sm:block hidden">
          <Createbtn />
        </div>
      </div>

      <table className="w-full text-left border-t border-gray-400 table-fixed sm:table hidden">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 text-sm">
            <th className="py-3 px-2 font-medium w-[8%] text-center">No.</th>
            <th className="py-3 px-2 font-medium w-[15%] text-center">
              문의유형
            </th>
            <th className="py-3 px-2 font-medium w-[47%]">제목</th>
            <th className="py-3 px-2 font-medium w-[15%] text-center">
              작성자
            </th>
            <th className="py-3 px-2 font-medium w-[15%] text-center">
              문의상태
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {inqueries?.length !== 0 &&
            inqueries?.map((inquiry: InquiryListItem, index: number) => {
              const inquiryTypeLabel =
                INQUIRY_TYPE_MAP[inquiry.inquiry_type] || inquiry.inquiry_type;
              const displayIndex = (count || 0) - (page - 1) * LIMIT - index;

              return (
                <InquiryRow
                  key={inquiry.id}
                  inquiry={inquiry}
                  displayIndex={displayIndex}
                  inquiryTypeLabel={inquiryTypeLabel}
                />
              );
            })}

          {emptyRowsCount > 0 &&
            emptyRowsCount !== 10 &&
            Array.from({ length: emptyRowsCount }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-[53px]">
                <td colSpan={5} className="py-4 px-2">
                  &nbsp;
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="block sm:hidden border-t border-gray-400 divide-y divide-gray-100 text-sm">
        {inqueries?.length !== 0
          ? inqueries?.map((inquiry: InquiryListItem, index: number) => {
              const inquiryTypeLabel =
                INQUIRY_TYPE_MAP[inquiry.inquiry_type] || inquiry.inquiry_type;
              const displayIndex = (count || 0) - (page - 1) * LIMIT - index;

              return (
                <InquiryRow
                  key={inquiry.id}
                  inquiry={inquiry}
                  displayIndex={displayIndex}
                  inquiryTypeLabel={inquiryTypeLabel}
                  isMobileContainer={true}
                />
              );
            })
          : null}
      </div>

      {emptyRowsCount === 10 && (
        <div className="w-full h-[350px] sm:h-[530px] flex items-center justify-center text-center text-gray-500 text-sm">
          검색 결과가 없습니다.
        </div>
      )}

      <div className="block sm:hidden fixed bottom-6 right-6 z-50">
        <Createbtn />
      </div>

      <Pagination
        currentPage={page}
        query={query}
        pageCount={Math.ceil((count || 1) / LIMIT)}
      />
    </div>
  );
}

export default InquiryLists;
