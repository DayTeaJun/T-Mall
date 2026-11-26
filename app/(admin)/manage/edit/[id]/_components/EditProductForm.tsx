"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ImgPreview, useMergedDetailImages } from "@/hooks/useImagePreview";
import { useUpdateProductMutation } from "@/lib/queries/admin";
import { uploadImageToStorage } from "@/lib/queries/storage";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Json } from "@/lib/config/supabase/types_db";
import { SIZE_OPTIONS_MAP } from "@/lib/constants/categories";
import ProductFormFields from "@/app/(admin)/manage/_components/ProductFormFields";
import { useProductFormFields } from "@/hooks/useProductFormFields";

interface ProductWithImages {
  category: string | null;
  color: string | null;
  created_at: string | null;
  deleted: boolean;
  deleted_at: string | null;
  description: string | null;
  gender: string | null;
  id: string;
  image_url: string | null;
  name: string;
  price: number;
  original_price?: number | null;
  discount_type?: string | null;
  discount_value?: number | null;
  stock_by_size: Json | null;
  subcategory: string | null;
  tags: string[] | null;
  total_stock: number | null;
  updated_at: string | null;
  user_id: string | null;
  product_images: {
    id: string;
    image_url: string;
  }[];
  rating_map: Json | null;
  sales_count: number | null;
  views: number | null;
}

export default function EditProductForm({
  product,
}: {
  product: ProductWithImages;
}) {
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
  } = useProductFormFields(product);
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

  const [mainImage, setMainImage] = useState(product.image_url || "");

  const [uploading, setUploading] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const {
    imageSrc,
    imgUrl,
    onUpload: rawUpload,
    onRemove: rawRemove,
  } = ImgPreview();

  const handleMainImageUpload = (file: File) => {
    const uploaded = rawUpload(file);
    if (uploaded) {
      setMainImage("");
    }
    return uploaded;
  };

  const handleMainImageRemove = () => {
    rawRemove();
    setMainImage("");
  };

  const {
    existingImages: existingDetailImages,
    detailFiles,
    previews: detailImagePreviews,
    detailOnUpload,
    removeAt: handleDetailImageRemove,
  } = useMergedDetailImages(
    product.product_images?.map((img) => ({
      id: img.id,
      url: img.image_url,
    })) ?? [],
    (img) => img.url,
  );

  const { mutate, isPending } = useUpdateProductMutation(product.id);

  const handleSubmit = async () => {
    const currentHasSizes = sizeOptionsMap[category]?.length > 0;
    const hasMainImage = !!(imgUrl || mainImage);
    const hasDetailImages =
      existingDetailImages.length > 0 || detailFiles.length > 0;
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
    if (currentHasSizes ? selectedSizes.length === 0 : singleStock <= 0) {
      toast.info(
        currentHasSizes
          ? "사이즈를 1개 이상 선택해 주세요."
          : "재고 수량을 입력해 주세요.",
      );
      return;
    }
    if (!hasMainImage) {
      toast.info("대표 이미지를 등록해 주세요.");
      return;
    }
    if (!hasDetailImages) {
      toast.info("상세 이미지를 1장 이상 등록해 주세요.");
      return;
    }

    let finalSalePrice = rawPrice;
    let originalPriceForDb: number | null = null;
    let finalDiscountType: string | null = null;
    let finalDiscountValue: number | null = null;

    if (discountType && discountValue !== "" && Number(discountValue) > 0) {
      const val = Number(discountValue);
      if (discountType === "percentage") {
        finalSalePrice = Math.floor(rawPrice * (1 - val / 100));
      } else if (discountType === "fixed") {
        finalSalePrice = Math.max(0, rawPrice - val);
      }
      originalPriceForDb = rawPrice;
      finalDiscountType = discountType;
      finalDiscountValue = val;
    } else {
      originalPriceForDb = null;
      finalDiscountType = null;
      finalDiscountValue = null;
    }

    const finalStockBySize = currentHasSizes
      ? stockBySize
      : { FREE: singleStock };
    const finalTotalStock = currentHasSizes
      ? Object.values(stockBySize).reduce((sum, val) => sum + val, 0)
      : singleStock;

    try {
      setUploading(true);
      const newMainImageUrl = imgUrl
        ? await uploadImageToStorage("product", user.id, imgUrl)
        : mainImage || null;

      const newDetailImageUrls = await Promise.all(
        detailFiles.map((file) =>
          uploadImageToStorage("product", user.id, file),
        ),
      );

      const finalDetailImages = [
        ...existingDetailImages.map((img) => img.url),
        ...newDetailImageUrls,
      ];

      const oldDetailImageIds = existingDetailImages.map((img) => img.id);

      mutate({
        id: product.id,
        name,
        description,
        price: finalSalePrice,
        original_price: originalPriceForDb,
        discount_type: finalDiscountType,
        discount_value: finalDiscountValue,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        category,
        subcategory,
        gender,
        color,
        stock_by_size: finalStockBySize,
        total_stock: finalTotalStock,
        image_url: newMainImageUrl,
        detail_image_urls: finalDetailImages,
        oldDetailImageIds,
        user_id: product.user_id,
        created_at: product.created_at,
        updated_at: new Date().toISOString(),
        deleted: product.deleted ?? false,
        deleted_at: product.deleted_at ?? null,
        rating_map: product.rating_map ?? null,
        sales_count: product.sales_count ?? 0,
        views: product.views ?? 0,
      });
    } catch (err) {
      toast.error("수정 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <ProductFormFields
        basicInfoHeading="기본 정보 수정"
        imageSectionHeading="상품 이미지 관리"
        name={name}
        onNameChange={(value) => onChange("name", value)}
        price={price}
        onPriceChange={(value) => onChange("price", value)}
        discountType={discountType}
        onDiscountTypeChange={(value) => onChange("discountType", value)}
        discountValue={discountValue}
        onDiscountValueChange={(value) => onChange("discountValue", value)}
        category={category}
        onCategoryClick={handleCategoryClick}
        subcategory={subcategory}
        onSubcategoryChange={(value) => onChange("subcategory", value)}
        gender={gender}
        onGenderChange={(value) => onChange("gender", value)}
        color={color}
        onColorChange={(value) => onChange("color", value)}
        tags={tags}
        onTagsChange={(value) => onChange("tags", value)}
        description={description}
        onDescriptionChange={(value) => onChange("description", value)}
        selectedSizes={selectedSizes}
        onSizeToggle={handleSizeToggle}
        stockBySize={stockBySize}
        onStockChange={handleStockChange}
        singleStock={singleStock}
        onSingleStockChange={setSingleStock}
        mainImageSrc={imageSrc || ""}
        mainImageEditImage={mainImage}
        onMainImageUpload={handleMainImageUpload}
        onMainImageRemove={handleMainImageRemove}
        detailImagePreviews={detailImagePreviews}
        onDetailImageUpload={detailOnUpload}
        onDetailImageRemove={handleDetailImageRemove}
      />

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3.5 transition-colors cursor-pointer shadow-sm"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={uploading || isPending}
          className="w-2/3 bg-black hover:bg-gray-800 text-white font-medium py-3.5 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
        >
          {uploading || isPending ? "상품 수정 중..." : "상품 수정 완료"}
        </button>
      </div>
    </div>
  );
}
