"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import { toast } from "sonner";
import { queryClient } from "@/components/providers/ReactQueryProvider";
import InquiryModal from "./InquiryModal";
import Modal from "@/components/common/modal/Modal";

interface Props {
  productId: string;
  myInquiryId: number | null;
}

function InquiryDelBtn({ productId, myInquiryId }: Props) {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleInquiryClick = () => {
    if (!myInquiryId) {
      return toast.error(
        "문의 ID가 존재하지 않습니다. 문의 작성 후 다시 시도해주세요.",
      );
    }

    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!myInquiryId) return;

    setIsDeleteConfirmOpen(false);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("product_inquiry")
      .delete()
      .eq("id", myInquiryId);

    if (error) {
      toast.error("문의 삭제에 실패했습니다.");
    } else {
      toast.success("문의가 삭제되었습니다.");
      queryClient.invalidateQueries({
        queryKey: ["productInquiryList", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["myProductInquiry", productId],
      });
    }
  };

  return (
    <>
      <button
        onClick={handleInquiryClick}
        type="button"
        className="border border-gray-300 rounded px-3 text-11 text-gray-700 hover:bg-gray-100 transition"
      >
        삭제
      </button>

      {user && isModalOpen && (
        <InquiryModal
          user={user}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={productId}
        />
      )}

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="작성하신 상품 문의를 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        confirmText="삭제"
      />
    </>
  );
}

export default InquiryDelBtn;
