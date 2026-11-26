"use client";

import { CornerDownRight } from "lucide-react";
import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import { queryClient } from "@/components/providers/ReactQueryProvider";

interface Props {
  productId: string;
  sellerId: string | null;
  inquiry_id: number;
  answer_content: string | null;
  answered_at: string | null;
}

function ProductInquiryAnswer(inquiry: Props) {
  const { user } = useAuthStore();
  const isAdmin = user?.level === 3;
  const isSeller = !!user?.id && user.id === inquiry.sellerId;
  const canAnswer = isAdmin || isSeller;

  const [content, setContent] = useState("");

  const handleSendcontent = async () => {
    if (!content.trim()) {
      toast.warning("답변 내용을 입력해주세요.");
      return;
    }
    if (!user?.id) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    if (!canAnswer) {
      toast.error("판매자 또는 관리자만 답변을 작성할 수 있습니다.");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    try {
      const { error } = await supabase
        .from("product_inquiry")
        .update({
          admin_id: user.id,
          answer_content: content,
          answered_at: new Date().toISOString(),
        })
        .eq("id", inquiry.inquiry_id);

      if (error) throw error;

      toast.success("답변이 정상적으로 등록되었습니다.");
      setContent("");
      queryClient.invalidateQueries({
        queryKey: ["productInquiryList", inquiry.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["myProductInquiry", inquiry.productId],
      });
    } catch (err) {
      console.error(err);
      toast.error("답변 등록에 실패했습니다.");
    }
  };

  if (!inquiry.answer_content && !inquiry.answered_at && !canAnswer) {
    return null;
  }

  return (
    <div className="bg-gray-50/50 p-3 sm:p-4 rounded-sm border-t border-gray-100 flex gap-1.5 sm:gap-2 items-start mt-1">
      <CornerDownRight
        size={14}
        className="text-gray-400 shrink-0 mt-1 sm:size-[16px]"
      />

      <div className="flex flex-col gap-2 sm:gap-3 w-full">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
          <span className="bg-gray-600 text-white font-bold px-1.5 py-0.5 rounded-xs text-[10px] sm:text-[11px]">
            답변
          </span>
          <span className="font-bold text-gray-700">
            {inquiry.answer_content ? "판매자 답변" : "[판매자 답변 작성]"}
          </span>
        </div>

        {inquiry.answer_content ? (
          <div className="text-xs sm:text-sm text-gray-800 whitespace-pre-line pl-0.5 leading-relaxed">
            {inquiry.answer_content}
          </div>
        ) : (
          <div className="w-full flex flex-col sm:gap-0 gap-1 sm:flex-row border-0 sm:border border-gray-200 sm:items-stretch overflow-hidden rounded-xs">
            <div className="relative flex-1 h-[90px] sm:h-[100px] border sm:border-0 border-gray-200 bg-white">
              <textarea
                spellCheck={false}
                value={content}
                maxLength={200}
                placeholder="답변을 작성해주세요. (최대 200자)"
                onChange={(e) => setContent(e.target.value)}
                className="p-3 text-xs sm:text-sm w-full h-full outline-none resize-none leading-relaxed text-gray-800 disabled:bg-gray-50 pb-7"
              />
              <div className="absolute bottom-2 right-3 text-[10px] sm:text-xs text-gray-400 font-medium select-none">
                <span
                  className={
                    content.length >= 200 ? "text-amber-600 font-semibold" : ""
                  }
                >
                  {content.length}
                </span>
                <span> / 200자</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendcontent}
              className="w-full sm:w-[90px] h-9 sm:h-auto font-bold text-white text-xs sm:text-sm bg-gray-600 hover:bg-gray-700 duration-200 transition-all flex justify-center items-center shrink-0 disabled:bg-gray-400"
            >
              등록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductInquiryAnswer;
