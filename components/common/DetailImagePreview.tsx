"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

interface Props {
  previews: string[];
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

export default function DetailImagePreview({
  previews,
  onUpload,
  onRemove,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    if (previews.length < 5) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex gap-2 items-center">
        상세 이미지
        <span className="text-xs text-gray-500">
          (* 최대 5개까지 업로드 가능합니다.)
        </span>
      </label>

      <div className="w-full border border-gray-300 p-4  overflow-x-auto">
        <div className="flex gap-4 w-fit">
          {previews.slice(0, 5).map((src, idx) => (
            <div
              key={idx}
              className="relative w-24 h-24 sm:w-32 sm:h-32 border flex-shrink-0 overflow-hidden rounded-md"
            >
              <Image
                width={128}
                height={128}
                src={src}
                alt={`상세 이미지 ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(idx);
                }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md cursor-pointer border-gray-700 hover:bg-gray-200"
              >
                <X size={14} className="font-bold" />
              </button>
            </div>
          ))}

          {previews.length < 5 && (
            <div
              onClick={handleClick}
              className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer flex-shrink-0 gap-2"
            >
              <ImagePlus size={32} className="text-gray-300" />
              <p className="text-[12px] font-bold text-gray-500">이미지 추가</p>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          onUpload(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
