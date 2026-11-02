"use client";

import { queryClient } from "@/components/providers/ReactQueryProvider";
import {
  delDeliveryAddress,
  getMyAddressList,
  getMyDefaultAddress,
  patchDeliveryAddress,
  postDefaultDeliveryAddress,
  postDeliveryAddress,
} from "@/lib/actions/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DeliveryAddressForm } from "@/app/(member)/mypage/delivery/regist/page";

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
