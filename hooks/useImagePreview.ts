import { useState } from "react";
import { toast } from "sonner";

export function ImgPreview() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<File | null>(null);

  const onUpload = (file: File): boolean => {
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "jfif"];
    const fileExt = file?.name.split(".").pop()?.toLowerCase();

    if (!file || !fileExt || !allowedExtensions.includes(fileExt)) {
      toast.error("이미지만 등록할 수 있습니다!");
      return false;
    }

    setImgUrl(file);

    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setImageSrc(result);
      } else {
        setImageSrc(null);
      }
    };

    return true;
  };

  const onRemove = () => {
    setImageSrc(null);
    setImgUrl(null);
  };

  return { imageSrc, imgUrl, onUpload, onRemove };
}

// 이미지 상세 보기 (최대 5개)
export function useDetailImagePreview() {
  const [detailFiles, setDetailFiles] = useState<File[]>([]);
  const [detailPreviews, setDetailPreviews] = useState<string[]>([]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_COUNT = 5;
  const allowedExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "jfif"];

  const detailOnUpload = (files: FileList | null) => {
    if (!files) return;

    const filesArray = Array.from(files);

    const currentFileKeys = detailFiles.map(
      (file) => `${file.name}-${file.size}`,
    );

    const newFiles: File[] = [];

    for (const file of filesArray) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const fileKey = `${file.name}-${file.size}`;

      if (!allowedExtensions.includes(ext!)) {
        toast.error("이미지 파일만 업로드 가능합니다.");
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.warning(`파일 크기가 너무 큽니다: ${file.name} (최대 10MB)`);
        continue;
      }

      if (currentFileKeys.includes(fileKey)) {
        toast.warning(`이미 추가된 이미지입니다: ${file.name}`);
        continue;
      }

      newFiles.push(file);
    }

    const availableSlots = MAX_COUNT - detailFiles.length;
    const filesToAdd = newFiles.slice(0, availableSlots);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setDetailPreviews((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    setDetailFiles((prev) => [...prev, ...filesToAdd]);
  };

  const removeDetailImage = (index: number) => {
    setDetailFiles((prev) => prev.filter((_, i) => i !== index));
    setDetailPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return { detailFiles, detailPreviews, detailOnUpload, removeDetailImage };
}
