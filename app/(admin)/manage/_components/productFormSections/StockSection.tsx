"use client";

import { SIZE_OPTIONS_MAP } from "@/lib/constants/categories";

interface Props {
  category: string;
  selectedSizes: string[];
  onSizeToggle: (size: string) => void;
  stockBySize: Record<string, number>;
  onStockChange: (size: string, value: number) => void;
  singleStock: number;
  onSingleStockChange: (value: number) => void;
}

export default function StockSection({
  category,
  selectedSizes,
  onSizeToggle,
  stockBySize,
  onStockChange,
  singleStock,
  onSingleStockChange,
}: Props) {
  const currentSizeOptions = SIZE_OPTIONS_MAP[category] || [];
  const hasSizeOptions = currentSizeOptions.length > 0;

  return (
    <div className="bg-white p-6 border border-gray-200 space-y-4">
      <h3 className="font-semibold text-gray-800 border-b pb-2">
        {hasSizeOptions ? "옵션 및 재고 관리" : "재고 관리"}
      </h3>

      {!category ? (
        <p className="text-xs text-gray-400 py-4 text-center">
          카테고리를 먼저 선택해 주세요.
        </p>
      ) : hasSizeOptions ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              사이즈 선택
              <span className="text-red-500 pl-1">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {currentSizeOptions.map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => onSizeToggle(size)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    selectedSizes.includes(size)
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {selectedSizes.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <label className="block text-xs font-semibold text-gray-600">
                선택된 사이즈별 재고 수량
              </label>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {selectedSizes.map((size) => (
                  <div key={size} className="flex items-center gap-3">
                    <span className="w-12 text-[12px] sm:text-sm font-medium text-gray-700">
                      {size}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={stockBySize[size] || 0}
                      onChange={(e) =>
                        onStockChange(size, Number(e.target.value))
                      }
                      className="flex-1 border border-gray-300 p-2 text-sm focus:outline-none"
                      placeholder="수량"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t flex justify-between items-center text-sm font-bold text-gray-900">
            <span>총 재고량</span>
            <span className="text-green-600">
              {Object.values(stockBySize).reduce((sum, val) => sum + val, 0)}{" "}
              개
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600">
            총 재고 수량
            <span className="text-red-500 pl-1">*</span>
          </label>
          <input
            type="number"
            min={0}
            value={singleStock}
            onChange={(e) => onSingleStockChange(Number(e.target.value))}
            className="w-full border border-gray-300 p-2.5 text-sm focus:outline-none"
            placeholder="재고 수량을 입력하세요"
          />
        </div>
      )}
    </div>
  );
}
