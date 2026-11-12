"use client";

import { useState } from "react";
import { useCreateProductMutation } from "@/lib/queries/admin";
import { uploadImageToStorage } from "@/lib/queries/storage";
import { toast } from "sonner";
import { ImgPreview, useDetailImagePreview } from "@/hooks/useImagePreview";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { SIZE_OPTIONS_MAP } from "@/lib/constants/categories";
import ProductFormFields from "@/app/(admin)/manage/_components/ProductFormFields";

function ProductForm() {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <ProductFormFields
        basicInfoHeading="기본 정보"
        imageSectionHeading="상품 이미지"
        name={name}
        onNameChange={setName}
        price={price}
        onPriceChange={setPrice}
        discountType={discountType}
        onDiscountTypeChange={setDiscountType}
        discountValue={discountValue}
        onDiscountValueChange={setDiscountValue}
        category={category}
        onCategoryClick={handleCategoryClick}
        subcategory={subcategory}
        onSubcategoryChange={setSubcategory}
        gender={gender}
        onGenderChange={setGender}
        color={color}
        onColorChange={setColor}
        tags={tags}
        onTagsChange={setTags}
        description={description}
        onDescriptionChange={setDescription}
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
