"use client";

import { queryClient } from "@/components/providers/ReactQueryProvider";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "../config/supabase/client";

interface UserCoupon {
  id: string;
  is_used: boolean;
  used_at?: string;
  coupon: {
    id: string;
    name: string;
    discount_type: string;
    discount_value: number;
    min_order_price: number | null;
    max_discount_price: number | null;
    created_at: string;
    expires_at: string;
  };
}

// 쿠폰 다운로드 확인
export async function checkCouponDownload(userId: string, couponCode: string) {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("user_coupons")
    .select(
      `
    coupon_id,
    coupons!inner (
      coupon_code
    )
  `,
    )
    .eq("user_id", userId)
    .eq("coupons.coupon_code", couponCode)
    .maybeSingle();

  if (error) {
    console.error("쿠폰 조회 실패:", error.message);
    throw new Error("쿠폰 조회에 실패했습니다.");
  }

  return data;
}

export function useGetIsCouponDownloaded(userId: string, couponCode: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["isCouponDownloaded", userId, couponCode],
    queryFn: () => checkCouponDownload(userId, couponCode),
    enabled: !!userId && !!couponCode,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 내 쿠폰 ID로 쿠폰 정보 조회
export async function getMyCoupon(userId: string, userCouponId: string) {
  const supabase = createBrowserSupabaseClient();

  if (!userCouponId || userCouponId.trim() === "") {
    return null;
  }

  if (!userId || userId.trim() === "") {
    return null;
  }

  const { data, error } = await supabase
    .from("user_coupons")
    .select(
      `
      id,
      is_used,
      coupon:coupons (
        id,
        name,
        discount_type,
        discount_value,
        min_order_price,
        max_discount_price,
        created_at,
        expires_at
      )
    `,
    )
    .eq("id", userCouponId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("쿠폰 조회 실패:", error.message);
    throw new Error("쿠폰 조회에 실패했습니다.");
  }

  return data as UserCoupon;
}

export function useGetMyCoupon(userId: string, userCouponId: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myCoupon", userId, userCouponId],
    queryFn: () => getMyCoupon(userId, userCouponId),
    enabled: !!userCouponId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 내 사용가능(다운로드 된) 쿠폰 조회
export async function getMyAvailableCoupons(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
) {
  const supabase = createBrowserSupabaseClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("user_coupons")
    .select(
      `
        id,
        is_used,
        coupon:coupons!inner (
          id,
          name,
          discount_type,
          discount_value,
          min_order_price,
          max_discount_price,
          created_at,
          expires_at
        )
      `,
      { count: "exact" },
    )
    .eq("user_id", userId)
    .eq("is_used", false)
    .order("expires_at", { referencedTable: "coupon", ascending: true })
    .order("id", { referencedTable: "coupon", ascending: true })
    .range(from, to);

  if (error) {
    console.error("쿠폰 조회 실패:", error.message);
    throw new Error("쿠폰 조회에 실패했습니다.");
  }

  return { data: data as UserCoupon[], count: count ?? 0 };
}

export function useGetMyAvailableCoupons(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myAvailableCoupons", userId, page, pageSize],
    queryFn: () => getMyAvailableCoupons(userId, page, pageSize),
    enabled: !!userId,
  });

  return {
    data: data?.data,
    totalCount: data?.count ?? 0,
    isLoading,
    isError,
  };
}

// 내 사용한 쿠폰 조회
export async function getMyUsedCoupons(
  userId: string,
  page: number,
  pageSize: number,
) {
  const supabase = createBrowserSupabaseClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("user_coupons")
    .select(
      `
        id,
        is_used,
        used_at,
        coupon:coupons (
          id,
          name,
          discount_type,
          discount_value,
          min_order_price,
          max_discount_price,
          created_at,
          expires_at
        )
      `,
      { count: "exact" },
    )
    .eq("user_id", userId)
    .eq("is_used", true)
    .range(from, to)
    .order("used_at", { ascending: false });

  if (error) {
    console.error("쿠폰 조회 실패:", error.message);
    throw new Error("쿠폰 조회에 실패했습니다.");
  }

  return { data: data as UserCoupon[], count: count ?? 0 };
}

export function useGetMyUsedCoupons(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myUsedCoupons", userId, page, pageSize],
    queryFn: () => getMyUsedCoupons(userId, page, pageSize),
    enabled: !!userId,
  });

  return {
    data: data?.data,
    totalCount: data?.count ?? 0,
    isLoading,
    isError,
  };
}

interface CouponResponse {
  success: boolean;
  message: string;
}

const postDownloadCoupon = async (couponCode: string) => {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.rpc("download_coupon", {
    p_coupon_code: couponCode.trim(),
  });

  if (error) {
    console.error("통신 실패:", error.message);
    throw new Error("서버와 통신 중 오류가 발생했습니다.");
  }

  const response = data as unknown as CouponResponse;

  if (response && !response.success) {
    throw new Error(response.message);
  }

  return response;
};

export function usePostDownloadCouponMutation(userId: string) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (couponCode: string) => postDownloadCoupon(couponCode),
    onSuccess: async (_response, couponCode) => {
      await queryClient.invalidateQueries({
        queryKey: ["myAvailableCoupons", userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["isCouponDownloaded", userId, couponCode],
      });
      toast.success("쿠폰이 성공적으로 등록되었습니다.");
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message || "오류가 발생했습니다.");
        console.error(`오류 발생: ${error.message}`);
      } else {
        toast.error("예상치 못한 오류가 발생했습니다.");
      }
    },
  });

  return { mutateAsync, isPending };
}
