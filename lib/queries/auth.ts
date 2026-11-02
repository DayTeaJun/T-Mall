"use client";

import { queryClient } from "@/components/providers/ReactQueryProvider";
import {
  getMyProfile,
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


