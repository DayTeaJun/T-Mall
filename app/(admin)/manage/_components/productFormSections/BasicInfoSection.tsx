"use client";

import { CATEGORY_MAP, GENDER_OPTIONS } from "@/lib/constants/categories";

interface Props {
  heading: string;
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
}

export default function BasicInfoSection({
  heading,
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
}: Props) {
  return (
    <div className="bg-white p-6 border border-gray-200 space-y-4">
      <h3 className="font-semibold text-gray-800 border-b pb-2">{heading}</h3>

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
  );
}
