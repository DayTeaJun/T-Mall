"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, X } from "lucide-react";
import Image from "next/image";

interface Props {
  variant?: "square" | "circle";
  editImage?: string;
  imageSrc: string;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  className?: string;
}

export default function ImagePreview({
  variant = "square",
  editImage,
  imageSrc,
  onUpload,
  onRemove,
  className = "",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (!file) {
      toast.error("파일이 없습니다.");
      return;
    }

    onUpload(file);
    setIsEdited(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    setIsEdited(true);
  };

  const hasImage = Boolean(imageSrc || (!isEdited && editImage));
  const isCircle = variant === "circle";

  return (
    <div className="space-y-2">
      {!isCircle && (
        <label className="block text-sm font-medium text-gray-700">
          상품 이미지
        </label>
      )}

      <div
        onClick={handleBoxClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        className={
          isCircle
            ? `relative w-32 h-32 sm:w-44 sm:h-44 ${className} rounded-full cursor-pointer flex gap-5 mt-2 transition-all duration-200 group ${
                isDragging
                  ? "border-blue-500 border-2 bg-blue-50"
                  : "border-gray-300"
              }`
            : `w-full h-80 cursor-pointer flex sm:flex-row flex-col gap-5 border p-4 py-3 mt-2 overflow-hidden transition-all duration-200 ${
                isDragging
                  ? "border-blue-500 border-2 bg-blue-50"
                  : "border-gray-300"
              }`
        }
      >
        {!isCircle && (
          <p className="mb-auto font-bold text-[14px]">대표 이미지</p>
        )}

        {hasImage ? (
          isCircle ? (
            <div className="flex flex-col items-center justify-center gap-2 object-cover m-auto">
              <Image
                width={176}
                height={176}
                className={`w-32 h-32 sm:w-44 sm:h-44 ${className} object-cover rounded-full`}
                src={isEdited ? imageSrc! : editImage!}
                alt="프로필 이미지"
              />
              <button
                className="absolute bottom-2 right-2 bg-gray-300 p-2 group-hover:bg-gray-400 rounded-full transition-all duration-300"
                type="button"
              >
                <Camera className="text-white" />
              </button>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center gap-2 object-cover m-auto">
              <Image
                width={240}
                height={240}
                className="w-60 h-60 object-cover m-auto"
                src={isEdited ? imageSrc! : editImage!}
                alt="상품 이미지"
              />
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                    setIsEdited(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md cursor-pointer border-gray-700 hover:bg-gray-200"
                >
                  <X size={14} className="font-bold" />
                </button>
              )}
            </div>
          )
        ) : isCircle ? (
          <div className="flex flex-col items-center justify-center gap-2 w-full h-full object-cover m-auto border-2 border-dashed rounded-full">
            <ImagePlus size={40} className="text-gray-300" />
            <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 text-center">
              프로필 이미지를 업로드 해주세요.
              <br /> (드래그 앤 드롭 또는 클릭)
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 w-60 h-60 object-cover m-auto border-2 border-dashed">
            <ImagePlus size={40} className="text-gray-300" />
            <p className="text-[12px] font-bold text-gray-500">
              이미지를 업로드 해주세요. (드래그 앤 드롭)
            </p>
          </div>
        )}
      </div>

      <input
        id="file"
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
