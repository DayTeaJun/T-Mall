"use client";

import { useState } from "react";
import { useDeleteProductMutation } from "@/lib/queries/admin";
import Modal from "@/components/common/modal/Modal";

export default function ProductDelBtn({
  productId,
  imageUrl,
}: {
  productId: string;
  imageUrl: string;
}) {
  const { mutate } = useDeleteProductMutation(productId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmDelete = () => {
    setIsConfirmOpen(false);
    mutate(imageUrl);
  };

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="border p-2 cursor-pointer hover:bg-gray-100 duration-200 transition-all"
      >
        삭제
      </button>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="정말로 이 상품을 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        confirmText="삭제"
      />
    </>
  );
}
