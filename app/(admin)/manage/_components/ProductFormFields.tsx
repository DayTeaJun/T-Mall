"use client";

import BasicInfoSection from "./productFormSections/BasicInfoSection";
import DescriptionSection from "./productFormSections/DescriptionSection";
import StockSection from "./productFormSections/StockSection";
import ImageSection from "./productFormSections/ImageSection";

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

        <ImageSection
          heading={imageSectionHeading}
          mainImageSrc={mainImageSrc}
          mainImageEditImage={mainImageEditImage}
          onMainImageUpload={onMainImageUpload}
          onMainImageRemove={onMainImageRemove}
          detailImagePreviews={detailImagePreviews}
          onDetailImageUpload={onDetailImageUpload}
          onDetailImageRemove={onDetailImageRemove}
        />
      </div>
    </div>
  );
}
