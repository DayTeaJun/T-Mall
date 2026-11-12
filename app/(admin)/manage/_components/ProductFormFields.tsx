"use client";

import ImagePreviews from "@/components/common/ImagePreview";
import DetailImagePreview from "@/components/common/DetailImagePreview";
import {
  CATEGORY_MAP,
  GENDER_OPTIONS,
  SIZE_OPTIONS_MAP,
} from "@/lib/constants/categories";

interface Props {
  basicInfoHeading: string;
  imageSectionHeading: string;
  name: string;
  onNameChange: (value: string) => void;
  price: string;
  onPriceChange: (value: string) => void;
  discountType: "" | "percentage" | "fixed";
  onDiscountTypeChange: (value: "" | "percentage" | "fixed") => void;
  discountValue: string;
  onDiscountValueChange: (value: string) => void;
  category: string;
  onCategoryClick: (category: string) => void;
  subcategory: string;
  onSubcategoryChange: (subcategory: string) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  tags: string;
  onTagsChange: (value: string) => void;

  description: string;
  onDescriptionChange: (value: string) => void;

  selectedSizes: string[];
  onSizeToggle: (size: string) => void;
  stockBySize: Record<string, number>;
  onStockChange: (size: string, value: number) => void;
  singleStock: number;
  onSingleStockChange: (value: number) => void;

  mainImageSrc: string;
  mainImageEditImage?: string;
  onMainImageUpload: (file: File) => boolean;
  onMainImageRemove: () => void;

  detailImagePreviews: string[];
  onDetailImageUpload: (files: FileList | null) => void;
  onDetailImageRemove: (index: number) => void;
}

export default function ProductFormFields({
  basicInfoHeading,
  imageSectionHeading,
  name,
  onNameChange,
  price,
  onPriceChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  category,
  onCategoryClick,
  subcategory,
  onSubcategoryChange,
  gender,
  onGenderChange,
  color,
  onColorChange,
  tags,
  onTagsChange,
  description,
  onDescriptionChange,
  selectedSizes,
  onSizeToggle,
  stockBySize,
  onStockChange,
  singleStock,
  onSingleStockChange,
  mainImageSrc,
  mainImageEditImage,
  onMainImageUpload,
  onMainImageRemove,
  detailImagePreviews,
  onDetailImageUpload,
  onDetailImageRemove,
}: Props) {
  const currentSizeOptions = SIZE_OPTIONS_MAP[category] || [];
  const hasSizeOptions = currentSizeOptions.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <div className="flex flex-col h-full gap-6">
        <div className="bg-white p-6 border border-gray-200 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-2">
            {basicInfoHeading}
          </h3>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              상품 이름
              <span className="text-red-500 pl-1">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full border border-gray-300 p-2.5 text-sm focus:outline-none"
              placeholder="상품 이름을 입력하세요"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              정가 (원)
              <span className="text-red-500 pl-1">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className="w-full border border-gray-300 p-2.5 text-sm focus:outline-none"
              placeholder="정가를 입력하세요"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-600">
              특가 / 할인 설정 (선택)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={discountType}
                onChange={(e) => {
                  onDiscountTypeChange(
                    e.target.value as "" | "percentage" | "fixed",
                  );
                  if (!e.target.value) onDiscountValueChange("");
                }}
                className="w-full border border-gray-300 p-2.5 text-sm bg-white focus:outline-none"
              >
                <option value="">할인 없음</option>
                <option value="percentage">할인율 (%)</option>
                <option value="fixed">할인 금액 (원)</option>
              </select>

              <input
                type="number"
                value={discountValue}
                onChange={(e) => onDiscountValueChange(e.target.value)}
                disabled={!discountType}
                className="w-full border border-gray-300 p-2.5 text-sm focus:outline-none disabled:bg-gray-100"
                placeholder={
                  discountType === "percentage"
                    ? "예: 10 (10%)"
                    : discountType === "fixed"
                      ? "예: 5000 (5천원)"
                      : "할인 유형 선택"
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              카테고리
              <span className="text-red-500 pl-1">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CATEGORY_MAP).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => onCategoryClick(cat)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    category === cat
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {category && (
            <div className="space-y-1 pt-2 border-t">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                하위 카테고리
                <span className="text-red-500 pl-1">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(CATEGORY_MAP[category] || []).map((sub) => (
                  <button
                    type="button"
                    key={sub}
                    onClick={() => onSubcategoryChange(sub)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                      subcategory === sub
                        ? "bg-black text-white border-black"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                성별
                <span className="text-red-500 pl-1">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => onGenderChange(e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm bg-white focus:outline-none"
              >
                <option value="">선택</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                색상
                <span className="text-red-500 pl-1">*</span>
              </label>
              <input
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm focus:outline-none"
                placeholder="예: 블랙, 화이트"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              태그
            </label>
            <input
              value={tags}
              onChange={(e) => onTagsChange(e.target.value)}
              className="w-full border border-gray-300 p-2.5 text-sm focus:outline-none"
              placeholder="쉼표(,)로 구분 (예: 여름, 캐주얼, 신상품)"
            />
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 flex flex-col flex-1 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-2">
            상세 설명
            <span className="text-red-500 pl-1">*</span>
          </h3>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full flex-1 border border-gray-300 p-3 text-sm focus:outline-none resize-none"
            placeholder="상품 상세 설명을 입력하세요."
          />
        </div>
      </div>

      <div className="flex flex-col h-full gap-6">
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
                  {Object.values(stockBySize).reduce(
                    (sum, val) => sum + val,
                    0,
                  )}{" "}
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

        <div className="bg-white p-6 border border-gray-200 flex flex-col flex-1 space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-2">
            {imageSectionHeading}
          </h3>

          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <span className="block text-xs font-semibold text-gray-600 mb-2">
                대표 이미지
                <span className="text-red-500 pl-1">*</span>
              </span>
              <ImagePreviews
                editImage={mainImageEditImage}
                imageSrc={mainImageSrc}
                onUpload={onMainImageUpload}
                onRemove={onMainImageRemove}
              />
            </div>

            <div className="pt-2 border-t">
              <span className="block text-xs font-semibold text-gray-600 mb-2">
                상세 이미지
                <span className="text-red-500 pl-1">*</span>
              </span>
              <DetailImagePreview
                previews={detailImagePreviews}
                onUpload={onDetailImageUpload}
                onRemove={onDetailImageRemove}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
