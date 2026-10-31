"use client";

import { queryClient } from "@/components/providers/ReactQueryProvider";
import { deleteInquiry } from "@/lib/actions/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "../config/supabase/client";

// 내 상품 문의 내역 조회
async function getProductInquiries(
  userId: string,
  page: number,
  limit: number,
) {
  const supabase = createBrowserSupabaseClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from("product_inquiry")
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

  const formattedInquiries = (data || []).map((inquiry) => ({
    ...inquiry,
    product_image: inquiry.products?.image_url || null,
    product_name: inquiry.products?.name || "상품 정보 없음",
  }));

  return {
    inquiries: formattedInquiries,
    count: count || 0,
  };
}

export function useGetProductInquiries(
  userId: string,
  page: number,
  limit: number,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productInquiries", userId, page],
    queryFn: () => getProductInquiries(userId, page, limit),
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 내 상품 문의 삭제
async function deleteProductInquiry(inquiryId: number) {
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase
    .from("product_inquiry")
    .delete()
    .eq("id", inquiryId);

  if (error) throw new Error(error.message);

  return inquiryId;
}

export function useDelProductInquiry(userId: string) {
  return useMutation({
    mutationFn: (inquiryId: number) => deleteProductInquiry(inquiryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productInquiries", userId] });
    },
    onError: (error) => {
      alert(`상품 문의 삭제에 실패했습니다: ${error.message}`);
    },
  });
}

export interface InquiryPostType {
  title: string;
  content: string;
  guest_name: string | null;
  phone_number: string | null;
  email: string | null;
  password?: string | null;
  is_public: boolean;
  is_privacy_agreed: boolean;
  user_id: string | null;
  status: string;
  inquiry_type: string;
  image_urls: string[] | null;
}

// 문의등록
export const postInquiry = async (inquiryData: InquiryPostType) => {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("inquiries")
    .insert([
      {
        title: inquiryData.title,
        content: inquiryData.content,
        guest_name: inquiryData.guest_name,
        phone_number: inquiryData.phone_number,
        email: inquiryData.email,
        password: inquiryData.password || null,
        is_public: inquiryData.is_public,
        is_privacy_agreed: inquiryData.is_privacy_agreed,
        user_id: inquiryData.user_id || null,
        status: "PENDING",
        inquiry_type: inquiryData.inquiry_type,
        image_urls: inquiryData.image_urls,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const usePostInquiryMutation = () => {
  return useMutation({
    mutationFn: (newInquiry: InquiryPostType) => postInquiry(newInquiry),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      await queryClient.invalidateQueries({ queryKey: ["customerInquiries"] });

      toast.success("문의가 성공적으로 등록되었습니다.");
    },
    onError: (error) => {
      console.error("문의 등록 실패:", error);
      toast.error(
        `등록에 실패했습니다: ${error.message || "다시 시도해주세요."}`,
      );
    },
  });
};

export const postInquiryComment = async (
  userId: string,
  inquiryId: number,
  comment: string,
) => {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("inquiries")
    .update({
      answer_content: comment.trim(),
      answered_at: new Date().toISOString(),
      admin_id: userId || null,
      status: "ANSWERED",
    })
    .eq("id", inquiryId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const usePostInquiryCommentMutation = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: ({
      userId,
      inquiryId,
      comment,
    }: {
      userId: string;
      inquiryId: number;
      comment: string;
    }) => postInquiryComment(userId, inquiryId, comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("답변이 성공적으로 등록되었습니다.");
    },
    onError: (error) => {
      console.error("답변 등록 실패:", error);
      toast.error(
        `등록에 실패했습니다: ${error.message || "다시 시도해주세요."}`,
      );
    },
  });

  return { mutate, isPending };
};

// 문의 답변 수정
export const updateInquiryComment = async (
  inquiryId: number,
  comment: string,
) => {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("inquiries")
    .update({
      answer_content: comment.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", inquiryId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useUpdateInquiryCommentMutation = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: ({
      inquiryId,
      comment,
    }: {
      inquiryId: number;
      comment: string;
    }) => updateInquiryComment(inquiryId, comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("답변이 수정되었습니다.");
    },
    onError: (error) => {
      console.error("답변 수정 실패:", error);
      toast.error(
        `수정에 실패했습니다: ${error.message || "다시 시도해주세요."}`,
      );
    },
  });

  return { mutate, isPending };
};

// 답변 삭제
export const deleteInquiryComment = async (inquiryId: number) => {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("inquiries")
    .update({
      answer_content: null,
      answered_at: null,
      admin_id: null,
      status: "WAITING",
    })
    .eq("id", inquiryId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useDeleteInquiryCommentMutation = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: (inquiryId: number) => deleteInquiryComment(inquiryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("답변이 삭제되었습니다.");
    },
    onError: (error) => {
      console.error("답변 삭제 실패:", error);
      toast.error(
        `삭제에 실패했습니다: ${error.message || "다시 시도해주세요."}`,
      );
    },
  });

  return { mutate, isPending };
};

// 고객센터 문의 상세 조회
export const getInquiryDetail = async (
  inquiryId: number,
  password?: string,
) => {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .rpc("get_inquiry_detail", { p_inquiry_id: inquiryId })
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("존재하지 않는 게시글입니다.");

  if (data.is_locked && password) {
    const unlocked = await unlockInquirySecret(inquiryId, password);
    if (unlocked) return { ...data, ...unlocked, is_locked: false };
  }

  return data;
};

export function useGetInquiryDetail(inquiryId: number, password?: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["inquiries", inquiryId, password ?? null],
    queryFn: () => getInquiryDetail(inquiryId, password),
    enabled: !!inquiryId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 잠긴 문의 열기 (패스워드 입력)
export const unlockInquirySecret = async (
  inquiryId: number,
  password: string,
) => {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .rpc("get_inquiry_secret", {
      p_inquiry_id: inquiryId,
      p_password: password,
    })
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

// 문의 삭제
interface DeleteVariables {
  inquiryId: number;
  guestPassword?: string;
}

export const useDeleteInquiry = (isAdmin: boolean, prePage?: string) => {
  const router = useRouter();
  const { mutate, isPending } = useMutation({
    mutationFn: ({ inquiryId, guestPassword }: DeleteVariables) =>
      deleteInquiry(inquiryId, guestPassword, isAdmin),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("문의가 삭제되었습니다.");
      if (prePage === "mypage") {
        router.replace("/mypage/inquiry");
      } else {
        router.replace("/inquiry");
      }
    },

    onError: (error) => {
      console.error("문의 삭제 실패:", error);
      toast.error(
        `삭제에 실패했습니다: ${error.message || "다시 시도해주세요."}`,
      );
    },
  });

  return { mutate, isPending };
};

// 내 문의 조회
export async function getCustomerInquiries(
  userId: string,
  page: number,
  limit: number,
) {
  const supabase = createBrowserSupabaseClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from("inquiries")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const formattedInquiries = (data || []).map((inquiry) => ({
    ...inquiry,
    category: inquiry.inquiry_type || "일반문의",
  }));

  return {
    inquiries: formattedInquiries,
    count: count || 0,
  };
}

export function useGetCustomerInquiries(
  userId: string,
  page: number,
  limit: number,
) {
  return useQuery({
    queryKey: ["inquiries", userId, page],
    queryFn: () => getCustomerInquiries(userId, page, limit),
    enabled: !!userId,
  });
}
