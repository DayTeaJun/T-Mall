"use client";

import ImagePreviews from "@/components/common/ImagePreview";
import DetailImagePreview from "@/components/common/DetailImagePreview";
import BasicInfoSection from "./productFormSections/BasicInfoSection";
import DescriptionSection from "./productFormSections/DescriptionSection";
import StockSection from "./productFormSections/StockSection";

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <div className="flex flex-col h-full gap-6">
        <BasicInfoSection
          heading={basicInfoHeading}
          name={name}
          onNameChange={onNameChange}
          price={price}
          onPriceChange={onPriceChange}
          discountType={discountType}
          onDiscountTypeChange={onDiscountTypeChange}
          discountValue={discountValue}
          onDiscountValueChange={onDiscountValueChange}
          category={category}
          onCategoryClick={onCategoryClick}
          subcategory={subcategory}
          onSubcategoryChange={onSubcategoryChange}
          gender={gender}
          onGenderChange={onGenderChange}
          color={color}
          onColorChange={onColorChange}
          tags={tags}
          onTagsChange={onTagsChange}
        />

        <DescriptionSection
          description={description}
          onDescriptionChange={onDescriptionChange}
        />
      </div>

      <div className="flex flex-col h-full gap-6">
        <StockSection
          category={category}
          selectedSizes={selectedSizes}
          onSizeToggle={onSizeToggle}
          stockBySize={stockBySize}
          onStockChange={onStockChange}
          singleStock={singleStock}
          onSingleStockChange={onSingleStockChange}
        />

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
