"use client";

import BasicInfoSection from "./productFormSections/BasicInfoSection";
import DescriptionSection from "./productFormSections/DescriptionSection";
import StockSection from "./productFormSections/StockSection";
import ImageSection from "./productFormSections/ImageSection";
import { Fields, FieldsOnChange } from "@/hooks/useProductFormFields";

interface Props {
  basicInfoHeading: string;
  imageSectionHeading: string;
  fields: Fields;
  onChange: FieldsOnChange;
  category: string;
  onCategoryClick: (category: string) => void;

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
  fields,
  onChange,
  category,
  onCategoryClick,
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
          fields={fields}
          onChange={onChange}
          category={category}
          onCategoryClick={onCategoryClick}
        />

        <DescriptionSection fields={fields} onChange={onChange} />
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
