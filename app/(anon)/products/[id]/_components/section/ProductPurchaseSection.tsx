"use client";

import { useEffect, useState } from "react";
import CartBtn from "../../../../../../components/common/buttons/CartBtn";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { SIZE_OPTIONS_MAP } from "@/lib/constants/categories";

export default function ProductPurchaseSection({
  productId,
  stockBySize = {},
  category,
}: {
  productId: string;
  stockBySize: Record<string, number>;
  category?: string | null;
}) {
  const { user } = useAuthStore();
  const router = useRouter();
  // 가방/액세서리처럼 사이즈 구분이 없는 카테고리는 빈 배열 -> 사이즈 선택 UI 자체를 숨김
  const sizeOptions = SIZE_OPTIONS_MAP[category ?? ""] ?? [];
  const hasSizeOptions = sizeOptions.length > 0;

  // 가용 사이즈 중 기본 선택값(L 우선, 없으면 첫 가용). 사이즈 구분이 없으면 FREE 고정
  const pickFirstAvailable = (stock: Record<string, number>) => {
    if (!hasSizeOptions) return "FREE";
    if ((stock["L"] ?? 0) > 0) return "L";
    const first = sizeOptions.find((s) => (stock[s] ?? 0) > 0);
    return first ?? "";
  };

  const [selectedSize, setSelectedSize] = useState<string>(() =>
    pickFirstAvailable(stockBySize),
  );
  const [quantity, setQuantity] = useState<number>(1);

  const currentStock = stockBySize[selectedSize] ?? 0;

  useEffect(() => {
    // 현재 선택이 없거나 품절이면 재선택
    if (!selectedSize || currentStock === 0) {
      const next = pickFirstAvailable(stockBySize);
      setSelectedSize(next);
      setQuantity(1);
    }
  }, [stockBySize, selectedSize, currentStock]);

  const validateQuantity = () => {
    if (!selectedSize) {
      toast.error("사이즈를 선택해주세요.");
      return false;
    }
    if (currentStock === 0) {
      toast.error("선택하신 사이즈는 품절입니다.");
      return false;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error("수량은 1 이상으로 입력해주세요.");
      return false;
    }
    if (quantity > currentStock) {
      toast.error(
        `현재 선택하신 재고는 최대 ${currentStock}개입니다.\n수량을 조정해주세요.`,
      );
      return false;
    }
    return true;
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!validateQuantity()) return;

    router.push(
      `/direct-checkout?productId=${productId}&size=${selectedSize}&quantity=${quantity}`,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {hasSizeOptions ? (
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            사이즈 선택
          </label>
          <select
            value={selectedSize}
            onChange={(e) => {
              setSelectedSize(e.target.value);
              setQuantity(1);
            }}
            className="w-full border px-3 py-2 rounded"
          >
            {!selectedSize && (
              <option value="" disabled>
                사이즈 선택
              </option>
            )}

            {sizeOptions.map((size) => {
              const stock = stockBySize[size] ?? 0;

              return (
                <option key={size} value={size} disabled={stock === 0}>
                  {size} ({stock}개 남음)
                </option>
              );
            })}
          </select>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          재고 {stockBySize["FREE"] ?? 0}개 남음
        </p>
      )}

      <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row justify-between items-end">
        <div className="w-full sm:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            수량
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => {
              const raw = e.target.value;
              if (/^\d*$/.test(raw)) {
                setQuantity(raw === "" ? 0 : Number(raw));
              }
            }}
            onBlur={() => {
              const val = Number(quantity);
              if (!Number.isFinite(val) || val < 1) {
                setQuantity(0);
              } else {
                setQuantity(val);
              }
            }}
            className="border px-3 py-2 w-full sm:w-20"
            disabled={!selectedSize || currentStock === 0}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-2/3">
          <div
            className="flex-1"
            onClickCapture={(e) => {
              if (!validateQuantity()) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <CartBtn
              className="w-full text-green-600 hover:text-green-900 border-2 hover:border-green-900 cursor-pointer p-2 duration-300 transition-colors"
              productId={productId}
              quantity={quantity}
              selectedSize={selectedSize}
            />
          </div>

          <button
            type="button"
            onClick={handleBuyNow}
            className={`flex-1 flex items-center justify-center p-2 duration-300 transition-colors ${
              !selectedSize || currentStock === 0
                ? "bg-green-600/50 text-white/70"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            <span>바로 구매</span>
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
