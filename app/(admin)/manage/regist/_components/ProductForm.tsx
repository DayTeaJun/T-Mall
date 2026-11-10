"use client";

import { useState } from "react";
import { useCreateProductMutation } from "@/lib/queries/admin";
import { uploadImageToStorage } from "@/lib/queries/storage";
import { toast } from "sonner";
import { ImgPreview, useDetailImagePreview } from "@/hooks/useImagePreview";
import ImagePreviews from "./ImagePreview";
import { useAuthStore } from "@/lib/store/useAuthStore";
import DetailImagePreview from "@/components/common/DetailImagePreview";
import {
  CATEGORY_MAP,
  GENDER_OPTIONS,
  SIZE_OPTIONS_MAP,
} from "@/lib/constants/categories";

function ProductForm() {
  const categoryMap = CATEGORY_MAP;
  const sizeOptionsMap = SIZE_OPTIONS_MAP;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [discountType, setDiscountType] = useState<"" | "percentage" | "fixed">(
    "",
  );
  const [discountValue, setDiscountValue] = useState("");

  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [gender, setGender] = useState("");
  const [color, setColor] = useState("");

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({});
  const [singleStock, setSingleStock] = useState<number>(0);

  const [uploading, setUploading] = useState(false);

  const { imageSrc, imgUrl, onUpload, onRemove } = ImgPreview();
  const { detailFiles, detailPreviews, detailOnUpload, removeDetailImage } =
    useDetailImagePreview();
  const { user } = useAuthStore();

  const { mutate } = useCreateProductMutation();

  const handleCategoryClick = (newCategory: string) => {
    setCategory(newCategory);
    setSubcategory("");
    setSelectedSizes([]);
    setStockBySize({});
    setSingleStock(0);
  };

  const handleSubmit = async () => {
    const hasSizes = sizeOptionsMap[category]?.length > 0;

    if (
      !name ||
      !description ||
      !imgUrl ||
      !user ||
      !category ||
      !subcategory ||
      !gender ||
      !color ||
      !price ||
      detailFiles.length === 0 ||
      (hasSizes ? selectedSizes.length === 0 : singleStock <= 0)
    ) {
      toast.info("필수 항목 및 정가를 모두 입력해 주세요.");
      return;
    }

    const rawPrice = Number(price);
    let finalSalePrice = rawPrice;
    let originalPriceForDb: number | null = null;

    if (discountType && discountValue && Number(discountValue) > 0) {
      const val = Number(discountValue);
      if (discountType === "percentage") {
        finalSalePrice = Math.floor(rawPrice * (1 - val / 100));
      } else if (discountType === "fixed") {
        finalSalePrice = Math.max(0, rawPrice - val);
      }
      originalPriceForDb = rawPrice;
    }

    const finalStockBySize = hasSizes ? stockBySize : { FREE: singleStock };
    const finalTotalStock = hasSizes
      ? Object.values(stockBySize).reduce((sum, val) => sum + val, 0)
      : singleStock;

    try {
      setUploading(true);
      const imageUrl = await uploadImageToStorage("product", user.id, imgUrl);
      const detailImageUrls = await Promise.all(
        detailFiles.map((file) =>
          uploadImageToStorage("product", user.id, file),
        ),
      );

      mutate({
        name,
        description,
        price: finalSalePrice,
        discount_type: discountType || null,
        discount_value: discountValue ? Number(discountValue) : null,
        original_price: originalPriceForDb,
        tags: tags.split(",").map((tag) => tag.trim()),
        category,
        subcategory,
        gender,
        color,
        stock_by_size: finalStockBySize,
        total_stock: finalTotalStock,
        image_url: imageUrl,
        detailImages: detailImageUrls,
      });
    } catch (err) {
      if (err instanceof Error) {
        console.error("상품 등록 실패:", err.message);
        toast.error("등록 중 오류: " + err.message);
      } else {
        console.error("상품 등록 실패:", err);
        toast.error("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
      const newStock = { ...stockBySize };
      delete newStock[size];
      setStockBySize(newStock);
    } else {
      setSelectedSizes([...selectedSizes, size]);
      setStockBySize({ ...stockBySize, [size]: 0 });
    }
  };

  const handleStockChange = (size: string, value: number) => {
    setStockBySize({ ...stockBySize, [size]: value });
  };

  const currentSizeOptions = sizeOptionsMap[category] || [];
  const hasSizeOptions = currentSizeOptions.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col h-full gap-6">
          <div className="bg-white p-6 border border-gray-200 space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">
              기본 정보
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                상품 이름
                <span className="text-red-500 pl-1">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setPrice(e.target.value)}
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
                    setDiscountType(
                      e.target.value as "" | "percentage" | "fixed",
                    );
                    if (!e.target.value) setDiscountValue("");
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
                  onChange={(e) => setDiscountValue(e.target.value)}
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
                {Object.keys(categoryMap).map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
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
                  {categoryMap[category].map((sub) => (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => setSubcategory(sub)}
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
                  onChange={(e) => setGender(e.target.value)}
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
                  onChange={(e) => setColor(e.target.value)}
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
                onChange={(e) => setTags(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
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
                        onClick={() => handleSizeToggle(size)}
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
                          <span className="w-12 text-sm font-medium text-gray-700">
                            {size}
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={stockBySize[size] || 0}
                            onChange={(e) =>
                              handleStockChange(size, Number(e.target.value))
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
                  onChange={(e) => setSingleStock(Number(e.target.value))}
                  className="w-full border border-gray-300 p-2.5 text-sm focus:outline-none"
                  placeholder="재고 수량을 입력하세요"
                />
              </div>
            )}
          </div>

          <div className="bg-white p-6 border border-gray-200 flex flex-col flex-1 space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">
              상품 이미지
            </h3>

            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <span className="block text-xs font-semibold text-gray-600 mb-2">
                  대표 이미지
                  <span className="text-red-500 pl-1">*</span>
                </span>
                <ImagePreviews
                  imageSrc={imageSrc || ""}
                  onUpload={onUpload}
                  onRemove={onRemove}
                />
              </div>

              <div className="pt-2 border-t">
                <span className="block text-xs font-semibold text-gray-600 mb-2">
                  상세 이미지
                  <span className="text-red-500 pl-1">*</span>
                </span>
                <DetailImagePreview
                  previews={detailPreviews}
                  onUpload={detailOnUpload}
                  onRemove={removeDetailImage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3.5 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
        >
          {uploading ? "상품 등록 중..." : "상품 등록 완료"}
        </button>
      </div>
    </div>
  );
}

export default ProductForm;
