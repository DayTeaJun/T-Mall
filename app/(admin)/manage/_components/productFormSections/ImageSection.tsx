"use client";

import ImagePreviews from "@/components/common/ImagePreview";
import DetailImagePreview from "@/components/common/DetailImagePreview";

interface Props {
  heading: string;
  mainImageSrc: string;
  mainImageEditImage?: string;
  onMainImageUpload: (file: File) => boolean;
  onMainImageRemove: () => void;
  detailImagePreviews: string[];
  onDetailImageUpload: (files: FileList | null) => void;
  onDetailImageRemove: (index: number) => void;
}

export default function ImageSection({
  heading,
  mainImageSrc,
  mainImageEditImage,
  onMainImageUpload,
  onMainImageRemove,
  detailImagePreviews,
  onDetailImageUpload,
  onDetailImageRemove,
}: Props) {
  return (
    <div className="bg-white p-6 border border-gray-200 flex flex-col flex-1 space-y-4">
      <h3 className="font-semibold text-gray-800 border-b pb-2">{heading}</h3>

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
  );
}
