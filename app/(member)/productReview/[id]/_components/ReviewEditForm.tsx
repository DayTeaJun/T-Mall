"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import { uploadImageToStorage } from "@/lib/queries/storage";
import { ProductType } from "@/types/product";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useDetailImagePreview } from "@/hooks/useImagePreview";
import DetailImagePreview from "@/components/common/DetailImagePreview";
import { queryClient } from "@/components/providers/ReactQueryProvider";

function ReviewEditForm({
  product,
  userId,
}: {
  product: ProductType;
  userId: string;
}) {
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const { detailFiles, detailPreviews, detailOnUpload, removeDetailImage } =
    useDetailImagePreview();

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);

  const router = useRouter();

  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const supabase = createBrowserSupabaseClient();
  const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET!;

  const publicUrlToPath = (url: string) => {
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return "";
    return url.substring(idx + marker.length);
  };

  useEffect(() => {
    const fetchReview = async () => {
      const { data: review, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .single();

      if (error || !review) {
        toast.error(
          "리뷰 정보를 불러오지 못했습니다. 관리자에게 문의해주세요.",
        );
        return;
      }

      setRatingValue(review.rating);
      setReviewText(review.content);

      const imgs: string[] = Array.isArray(review.images) ? review.images : [];
      setExistingImages(imgs);
      setOriginalImages(imgs);
    };

    fetchReview();
  }, [product.id, userId]);

  const handleStarClick = (index: number) => setRatingValue(index + 1);

  const handleUpdate = async () => {
    if (!reviewText.trim() || ratingValue === 0) {
      toast.error("별점과 내용을 모두 입력해주세요.");
      return;
    }

    let uploadedUrls: string[] = [];
    try {
      uploadedUrls = await Promise.all(
        detailFiles.map((file) =>
          uploadImageToStorage("review", userId, file),
        ),
      );
    } catch {
      toast.error("이미지 업로드 실패");
      return;
    }

    const removed = originalImages.filter((u) => !existingImages.includes(u));

    if (removed.length > 0) {
      const deletePaths = removed
        .map(publicUrlToPath)
        .filter((p) => typeof p === "string" && p.length > 0);
      if (deletePaths.length > 0) {
        await supabase.storage.from(BUCKET).remove(deletePaths);
      }
    }

    const nextImages = [...existingImages, ...uploadedUrls];

    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        rating: ratingValue,
        content: reviewText,
        images: nextImages,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("product_id", product.id);

    if (updateError) {
      toast.error("리뷰 수정 실패");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["reviews", userId] });

    toast.success("리뷰가 수정되었습니다.");

    if (from === "mypage") {
      router.push("/mypage/review");
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-4 items-start">
        <Image
          src={product.image_url || ""}
          alt={product.name}
          width={80}
          height={80}
          className="rounded border w-20 h-20"
        />
        <div>
          <p className="text-sm font-medium">{product.name}</p>
          <div className="flex gap-1 items-center mt-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                onClick={() => handleStarClick(i)}
                onMouseEnter={() => setHoveredStar(i + 1)}
                onMouseLeave={() => setHoveredStar(null)}
                className={`text-[32px] cursor-pointer ${
                  (hoveredStar ?? ratingValue) > i
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      <textarea
        rows={5}
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        className="w-full border p-3 text-sm rounded mb-4"
        placeholder="수정할 리뷰 내용을 입력해주세요."
      />

      <DetailImagePreview
        previews={[...existingImages, ...detailPreviews]}
        onUpload={detailOnUpload}
        onRemove={(index) => {
          if (index < existingImages.length) {
            setExistingImages((prev) => prev.filter((_, i) => i !== index));
          } else {
            removeDetailImage(index - existingImages.length);
          }
        }}
      />

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button onClick={handleUpdate}>수정하기</Button>
      </div>
    </div>
  );
}

export default ReviewEditForm;
