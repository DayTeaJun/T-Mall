"use client";

import { queryClient } from "@/components/providers/ReactQueryProvider";
import {
  delDeliveryAddress,
  getMyAddressList,
  getMyDefaultAddress,
  getMyProfile,
  patchDeliveryAddress,
  postDefaultDeliveryAddress,
  postDeliveryAddress,
  signInUser,
  signUpOAuth,
  signUpUser,
  updateMyProfile,
} from "@/lib/actions/auth";
import { cancelOrderItem } from "@/lib/actions/checkout";
import {
  SignInFormData,
  SignUpFormData,
  UserProfileType,
  UserType,
} from "@/types/user";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "../config/supabase/client";
import { OrderDetailsType } from "@/types/product";
import { useAuthStore } from "../store/useAuthStore";
import { DeliveryAddressForm } from "@/app/(member)/mypage/delivery/regist/page";

// 로그인
export const useSignInMutation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (formData: SignInFormData) => signInUser(formData),
    onSuccess: () => {
      toast.success("로그인에 성공하였습니다.");

      const redirectTo = searchParams.get("redirectTo");
      const destination = redirectTo || "/";

      router.push(destination);
      router.refresh();
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === "INVALID_CREDENTIALS") {
          setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setErrorMessage("오류가 발생했습니다. 관리자에게 문의해주세요.");
        }
      } else {
        setErrorMessage(
          "예기치 못한 오류가 발생했습니다. 관리자에게 문의해주세요.",
        );
      }
    },
  });

  return { data, isError, mutate, isSuccess, isPending, errorMessage };
};

// 회원가입
export const useSignUpMutation = () => {
  const router = useRouter();

  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (formData: SignUpFormData) => signUpUser(formData),

    onSuccess: () => {
      toast.success("회원가입에 성공하였습니다.");
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        const message = (error as { message: string }).message;

        if (status === 400) {
          toast.error("잘못된 로그인 정보입니다.");
        } else if (status === 500) {
          toast.error("서버 에러입니다.");
        } else {
          toast.error(`알 수 없는 오류: ${message}`);
        }
      } else {
        toast.error("예상치 못한 오류가 발생했습니다.");
      }
    },
  });

  return { data, isError, mutate, isSuccess, isPending };
};

// 소셜 로그인 (회원가입)
export const useSignUpOAuthMutation = () => {
  const router = useRouter();

  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (formData: SignUpFormData) => signUpOAuth(formData),

    onSuccess: () => {
      toast.success("회원가입에 성공하였습니다.");
      router.push("/");
      router.refresh();
    },
    onError: (error) => {
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        const message = (error as { message: string }).message;

        if (status === 400) {
          toast.error("잘못된 로그인 정보입니다.");
        } else if (status === 500) {
          toast.error("서버 에러입니다.");
        } else {
          toast.error(`알 수 없는 오류: ${message}`);
        }
      } else {
        toast.error("예상치 못한 오류가 발생했습니다.");
      }
    },
  });

  return { data, isError, mutate, isSuccess, isPending };
};

// 내 프로필 조회
export function useMyProfileQuery(userId: string | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myProfile", userId],
    queryFn: () => getMyProfile(userId || ""),
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 내 배송지 조회
export function useGetAddressList(userId: string | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myAddressList", userId],
    queryFn: () => getMyAddressList(userId || ""),
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 내 기본 배송지 조회
export function useGetDefaultAddress(userId: string | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myDefaultAddress", userId],
    queryFn: () => getMyDefaultAddress(userId || ""),
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 내 배송지 기본 배송지로 설정
export function usePostDefaultDeliveryAddressMutation(userId: string) {
  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (addressId: string) =>
      postDefaultDeliveryAddress(addressId, userId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["myAddressList", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["myDefaultAddress", userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["myProfile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
      ]);

      toast.success("기본 배송지로 적용되었습니다.");
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

  return { data, isError, mutate, isSuccess, isPending };
}

// 내 배송지 등록
export function usePostDeliveryAddressMutation(
  userId: string,
  isModal: boolean = false,
) {
  const router = useRouter();

  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (formData: DeliveryAddressForm) =>
      postDeliveryAddress(formData),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["myAddressList", userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["myProfile", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["myDefaultAddress", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["userProfile", userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
      ]);
      toast.success("배송지가 등록되었습니다.");

      if (!isModal) {
        router.push("/mypage/delivery");
      }
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

  return { data, isError, mutate, isSuccess, isPending };
}

// 내 배송지 수정
export function usePatchDeliveryAddressMutation(
  userId: string,
  addressId: string,
  isModal: boolean = false,
) {
  const router = useRouter();

  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (formData: DeliveryAddressForm) =>
      patchDeliveryAddress(addressId, formData),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["myAddressList", userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["myProfile", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["myDefaultAddress", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["userProfile", userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
      ]);

      toast.success("배송지가 수정되었습니다.");

      if (!isModal) {
        router.push("/mypage/delivery");
      }
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

  return { data, isError, mutate, isSuccess, isPending };
}

// 내 배송지 삭제
export function useDelDeliveryAddressMutation(userId: string) {
  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (addressId: string) => delDeliveryAddress(addressId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["myAddressList", userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["myProfile", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["myDefaultAddress", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["userProfile", userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["allUsers"] }),
      ]);
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

  return { data, isError, mutate, isSuccess, isPending };
}

// 내 프로필 수정
export function useUpdateMyProfileMutation(userId: string | undefined) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (formData: UserProfileType) => updateMyProfile(formData),
    onSuccess: async (_data, formData) => {
      await queryClient.invalidateQueries({ queryKey: ["myProfile", userId] });
      toast.success("프로필 수정에 성공하였습니다.");

      if (user) {
        const updatedUser: UserType = {
          ...user,
          user_name: formData.user_name ?? user.user_name,
          phone: formData.phone ?? user.phone,
        };

        router.push("/mypage/profile");
        setUser(updatedUser);
      }
    },
    onError: (error) => {
      const errorMessage = error?.message || "";

      if (
        errorMessage.includes("중복") ||
        errorMessage.includes("사용 중인 이름")
      ) {
        toast.error("이미 사용 중인 이름입니다. 다른 이름을 입력해 주세요.");
        return;
      }

      if (error && typeof error === "object" && "status" in error) {
        const status = error.status;
        if (status === 400) {
          toast.error("잘못된 정보입니다.");
        } else if (status === 500) {
          toast.error("서버 에러가 발생했습니다.");
        } else {
          toast.error(`오류 발생: ${errorMessage}`);
        }
      } else {
        toast.error(errorMessage || "예상치 못한 오류가 발생했습니다.");
      }
    },
  });

  return { data, isError, mutate, isSuccess, isPending };
}

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

// 주문목록 조회 (사용자 및 관리자용)
export async function getOrders(
  userId: string,
  filter: { searchKeyword?: string; year?: number; recent6Months?: boolean },
  page = 1,
  limit = 10,
  userLevel?: number,
) {
  const supabase = createBrowserSupabaseClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 판매자(레벨2)는 "본인이 등록한 상품이 포함된 주문"만 봐야 해서,
  // order_items -> products를 inner join으로 걸어 해당 상품이 없는 주문은 아예 제외하고
  // 주문 안의 order_items도 본인 상품인 것만 남도록 필터링한다.
  const isSeller = userLevel === 2;
  const joinHint = isSeller ? "!inner" : "";

  let query = supabase
    .from("orders_with_user_info")
    .select(
      `
      id,
      created_at,
      user_id,
      user_name,
      email,
      order_items${joinHint} (
        id,
        product_id,
        quantity,
        price,
        size,
        delivery_status,
        products${joinHint} (
          name,
          image_url,
          user_id
        )
      )
    `,
      { count: "exact" },
    )
    .range(from, to)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (isSeller) {
    // 판매자: 주문을 한 사람이 아니라, 주문에 포함된 상품의 등록자로 필터링
    query = query.eq("order_items.products.user_id", userId);
  } else if (userLevel !== 3) {
    // 일반 사용자(관리자 아님): 본인이 주문한 내역만
    query = query.eq("user_id", userId);
  }

  if (filter.searchKeyword && filter.searchKeyword.trim() !== "") {
    if (userLevel === 3) {
      query = query.or(
        `user_name.ilike.%${filter.searchKeyword}%,email.ilike.%${filter.searchKeyword}%`,
      );
    } else {
      const kw = `%${filter.searchKeyword.trim()}%`;
      query = query.ilike("product_names", kw);
    }
  }

  // 날짜 필터
  if (filter.recent6Months) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    query = query.gte("created_at", sixMonthsAgo.toISOString());
  } else if (filter.year) {
    const start = new Date(filter.year, 0, 1).toISOString();
    const end = new Date(filter.year + 1, 0, 1).toISOString();
    query = query.gte("created_at", start).lt("created_at", end);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { data, count };
}

export function useGetOrders(
  userId: string,
  filter: { searchKeyword?: string; year?: number; recent6Months?: boolean },
  page?: number,
  limit?: number,
  userLevel?: number,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", userId, filter, page, limit, userLevel],
    queryFn: () => getOrders(userId, filter, page, limit, userLevel),
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 주문 상세 조회
export async function getOrderDetails(orderId: string) {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
          id, created_at, request, receiver, detail_address, coupon_id, discount_amount,
          user: user_table (user_name, email),
          coupon: coupons (name, discount_type, discount_value),
          order_items (
            id,
            quantity,
            price,
            size,
            delivery_status,
            products (
              name,
              image_url,
              id
            )
          )`,
    )
    .eq("id", orderId)
    .order("created_at", { ascending: false })
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function useGetOrderDetails(orderId: string) {
  const { data, isLoading, isError } = useQuery<OrderDetailsType>({
    queryKey: ["orderDetails", orderId],
    queryFn: () => getOrderDetails(orderId || ""),
    enabled: !!orderId,
    refetchOnMount: "always",
    retry: false,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 주문 내역 삭제 (소유자 검증은 delete_order RPC 안에서 처리)
export async function deleteOrder(orderId: string) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.rpc("delete_order", {
    p_order_id: orderId,
  });

  if (error) throw new Error(error.message);
  return true;
}

export function useDeleteOrderMutation(userId: string, page?: string) {
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: async (_, orderId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orderDetails", orderId] }),
        queryClient.invalidateQueries({ queryKey: ["orders", userId] }),
      ]);
      toast.success("주문 내역이 삭제되었습니다.");
      if (page === "manage") {
        router.replace("/manage/orderList");
      } else {
        router.replace("/mypage/orderList?page=1");
      }
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

export const useUpdateCancelOrderItem = (userId: string) => {
  const { mutate, isPending } = useMutation({
    mutationFn: (orderItemId: string) => cancelOrderItem(orderItemId),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["orderDetails", data?.orderId],
        }),
      ]);
      toast.success("주문이 취소되었습니다.");
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


