"use client";

import { useState } from "react";
import { useCreateProductMutation } from "@/lib/queries/admin";
import { uploadImageToStorage } from "@/lib/queries/storage";
import { toast } from "sonner";
import { ImgPreview, useDetailImagePreview } from "@/hooks/useImagePreview";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { SIZE_OPTIONS_MAP } from "@/lib/constants/categories";
import ProductFormFields from "@/app/(admin)/manage/_components/ProductFormFields";
import { useProductFormFields } from "@/hooks/useProductFormFields";

function ProductForm() {
  const sizeOptionsMap = SIZE_OPTIONS_MAP;

  const {
    fields,
    onChange,
    category,
    handleCategoryClick,
    selectedSizes,
    handleSizeToggle,
    stockBySize,
    handleStockChange,
    singleStock,
    setSingleStock,
  } = useProductFormFields();
  const {
    name,
    description,
    price,
    discountType,
    discountValue,
    tags,
    subcategory,
    gender,
    color,
  } = fields;

  const [uploading, setUploading] = useState(false);

  const { imageSrc, imgUrl, onUpload, onRemove } = ImgPreview();
  const { detailFiles, detailPreviews, detailOnUpload, removeDetailImage } =
    useDetailImagePreview();
  const { user } = useAuthStore();

  const { mutate } = useCreateProductMutation();

  const handleSubmit = async () => {
    const hasSizes = sizeOptionsMap[category]?.length > 0;
    const rawPrice = Number(price);

    if (!user) {
      toast.info("로그인 정보를 확인할 수 없습니다.");
      return;
    }
    if (!name) {
      toast.info("상품 이름을 입력해 주세요.");
      return;
    }
    if (!description) {
      toast.info("상세 설명을 입력해 주세요.");
      return;
    }
    if (!price || Number.isNaN(rawPrice) || rawPrice <= 0) {
      toast.info("정가를 올바르게 입력해 주세요.");
      return;
    }
    if (!category) {
      toast.info("카테고리를 선택해 주세요.");
      return;
    }
    if (!subcategory) {
      toast.info("하위 카테고리를 선택해 주세요.");
      return;
    }
    if (!gender) {
      toast.info("성별을 선택해 주세요.");
      return;
    }
    if (!color) {
      toast.info("색상을 입력해 주세요.");
      return;
    }
    if (hasSizes ? selectedSizes.length === 0 : singleStock <= 0) {
      toast.info(
        hasSizes
          ? "사이즈를 1개 이상 선택해 주세요."
          : "재고 수량을 입력해 주세요.",
      );
      return;
    }
    if (!imgUrl) {
      toast.info("대표 이미지를 등록해 주세요.");
      return;
    }
    if (detailFiles.length === 0) {
      toast.info("상세 이미지를 1장 이상 등록해 주세요.");
      return;
    }

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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <ProductFormFields
        basicInfoHeading="기본 정보"
        imageSectionHeading="상품 이미지"
        fields={fields}
        onChange={onChange}
        category={category}
        onCategoryClick={handleCategoryClick}
        selectedSizes={selectedSizes}
        onSizeToggle={handleSizeToggle}
        stockBySize={stockBySize}
        onStockChange={handleStockChange}
        singleStock={singleStock}
        onSingleStockChange={setSingleStock}
        mainImageSrc={imageSrc || ""}
        onMainImageUpload={onUpload}
        onMainImageRemove={onRemove}
        detailImagePreviews={detailPreviews}
        onDetailImageUpload={detailOnUpload}
        onDetailImageRemove={removeDetailImage}
      />

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
