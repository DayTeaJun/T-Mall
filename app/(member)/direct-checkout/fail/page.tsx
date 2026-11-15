"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutFailPage() {
  const searchParams = useSearchParams();
  const productIdFromParam = searchParams.get("productId") ?? "";

  const sizeParam = searchParams.get("size") ?? "";
  const quantity = searchParams.get("quantity") ?? "1";

  return (
    <div className="flex flex-col justify-center items-center h-[60vh] text-gray-700">
      <XCircle size={64} className="text-red-500 mb-4" />
      <p className="text-xl font-bold">결제가 실패하거나 취소되었습니다.</p>
      <p className="text-sm mt-2 text-gray-500">
        다시 시도하거나 장바구니를 확인해 주세요.
      </p>

      <div className="flex gap-4 mt-6">
        <Link
          href={`/direct-checkout?productId=${productIdFromParam}&size=${sizeParam}&quantity=${quantity}`}
          className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          다시 시도하기
        </Link>
        <Link
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
