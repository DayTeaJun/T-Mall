"use client";

import { queryClient } from "@/components/providers/ReactQueryProvider";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "../config/supabase/client";

// 리뷰 전체 조회
async function getReviews(userId: string, page: number, limit: number) {
  const supabase = createBrowserSupabaseClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      products (
        image_url,
        name
      )
    `,
      { count: "exact" },
    )
    .eq("user_id", userId)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const formattedReviews = data.map((review) => ({
    ...review,
    product_image: review.products?.image_url,
    product_name: review.products?.name,
  }));

  return {
    reviews: formattedReviews,
    count: count || 0,
  };
}

export function useGetReviews(userId: string, page: number, limit: number) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reviews", userId, page],
    queryFn: () => getReviews(userId, page, limit),
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 작성가능한 리뷰 조회
export async function getAvailableReviews(
  userId: string,
  page: number,
  limit: number,
) {
  const supabase = createBrowserSupabaseClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from("available_review_products")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .range(from, to);

  if (error) throw new Error(error.message);

  const formattedItems = (data || []).map((item) => ({
    id: item.order_item_id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_description: item.product_description,
    product_image: item.product_image,
    delivered_at: "배송완료",
  }));

  return {
    items: formattedItems,
    count: count || 0,
  };
}

export function useGetAvailableReviews(
  userId: string,
  page: number,
  limit: number,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["availableReviews", userId, page],
    queryFn: () => getAvailableReviews(userId, page, limit),
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 리뷰 삭제
async function delReview(userId: string, reviewId: string) {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("user_id", userId)
    .eq("id", reviewId);

  if (error) throw new Error(error.message);

  return data;
}

export const useDelReview = (userId: string) => {
  const { mutate, isPending } = useMutation({
    mutationFn: (reviewId: string) => delReview(userId, reviewId),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", userId] });
      toast.success("리뷰가 삭제되었습니다.");
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error("오류가 발생했습니다. 관리자에게 문의해주세요.");
        console.error(`오류 발생: ${error.message}`);
      } else {
        toast.error("예상치 못한 오류가 발생했습니다.");
      }
    },
  });

  return { mutate, isPending };
};

// 작성가능한 리뷰 숨기기 (소유자 검증은 hide_order_item_review RPC 안에서 처리)
export async function postHiddenReview(orderItemId: string) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.rpc("hide_order_item_review", {
    p_order_item_id: orderItemId,
  });

  if (error) throw new Error(error.message);
  return data;
}

export function usePostHiddenReview(userId: string, page: number) {
  const { mutate, isPending } = useMutation({
    mutationFn: (orderItemId: string) => postHiddenReview(orderItemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["availableReviews", userId, page],
      });
      toast.success("숨김 처리되었습니다.");
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error("오류가 발생했습니다. 관리자에게 문의해주세요.");
        console.error(`오류 발생: ${error.message}`);
      } else {
        toast.error("예상치 못한 오류가 발생했습니다.");
      }
    },
  });

  return { mutate, isPending };
}
