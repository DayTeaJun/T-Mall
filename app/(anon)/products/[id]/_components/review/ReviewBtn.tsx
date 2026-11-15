"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function ReviewBtn({ productId }: { productId: string }) {
  const { user } = useAuthStore();

  const [hasReview, setHasReview] = useState<boolean | null>(null);
  const [canReview, setCanReview] = useState<boolean | null>(null);

  const handleReviewWrite = () => {
    toast.warning("배송완료된 주문 고객만 리뷰를 작성할 수 있습니다.");
  };

  useEffect(() => {
    const checkReviewAndEligibility = async () => {
      if (!user?.id) return;

      const supabase = createBrowserSupabaseClient();

      const reviewPromise = supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("product_id", productId);

      const deliveredPromise = supabase
        .from("orders")
        .select("id, order_items!inner(product_id, delivery_status)", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("deleted", false)
        .eq("order_items.product_id", productId)
        .eq("order_items.delivery_status", "배송완료");

      const [
        { count: reviewCount, error: reviewErr },
        { count: deliveredCount, error: deliveredErr },
      ] = await Promise.all([reviewPromise, deliveredPromise]);

      setHasReview(!reviewErr && (reviewCount ?? 0) > 0);
      setCanReview(!deliveredErr && (deliveredCount ?? 0) > 0);
    };

    checkReviewAndEligibility();
  }, [user?.id, productId]);

  if (!user || hasReview === null || canReview === null) return null;

  if (!canReview && !hasReview) {
    return (
      <button
        type="button"
        className="text-sm text-gray-400 cursor-default"
        title="배송완료된 주문 고객만 리뷰를 작성할 수 있습니다."
        onClick={handleReviewWrite}
      >
        리뷰 작성하기
      </button>
    );
  }

  const label = hasReview ? "리뷰 수정하기" : "리뷰 작성하기";
  return (
    <Link href={`/product-review/${productId}`} className="cursor-pointer">
      <span className="text-sm text-blue-600 hover:underline">{label}</span>
    </Link>
  );
}

export default ReviewBtn;
