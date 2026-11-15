"use client";

import { useDeleteProductMutation } from "@/lib/queries/admin";

export default function ProductDelBtn({
  productId,
  imageUrl,
}: {
  productId: string;
  imageUrl: string;
}) {
  const { mutate } = useDeleteProductMutation(productId);

  const handleDelete = async () => {
    const confirmDelete = window.confirm("정말로 이 상품을 삭제하시겠습니까?");
    if (!confirmDelete) return;

    mutate(imageUrl);
  };

  return (
    <button
      onClick={handleDelete}
      className="border p-2 cursor-pointer hover:bg-gray-100 duration-200 transition-all"
    >
      삭제
    </button>
  );
}
