import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getAllUsers,
  getCategorySalesAction,
  getDashboardStatus,
  getMyProducts,
  getUserProfile,
  getWeeklySalesAction,
  patchUserActive,
  updateProduct,
} from "../actions/admin";
import { queryClient } from "@/components/providers/ReactQueryProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreateProductType, ProductUpdateType } from "@/types/product";

// 상품 등록 mutation
export const useCreateProductMutation = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: async (productForm: CreateProductType) =>
      createProduct(productForm),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["products", data?.id] }),
        queryClient.invalidateQueries({
          queryKey: ["manageProducts"],
        }),
      ]);
      toast.success("상품 등록이 완료되었습니다.");
      router.push("/manage/productList");
    },
    onError: (error) => {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("알 수 없는 오류가 발생했습니다.");
      }
    },
  });

  return { data, isError, mutate, isSuccess, isPending, errorMessage };
};

// 상품 삭제
export const useDeleteProductMutation = (productId: string) => {
  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: async (imagePath: string) =>
      deleteProduct({ productId, imagePath }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["products", productId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["manageProducts"],
        }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
      toast.success("상품 삭제가 완료되었습니다.");
    },
    onError: (error) => {
      console.error("상품 삭제 실패:", error);
      toast.error("상품 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    },
  });

  return { data, isError, mutate, isSuccess, isPending };
};

// 상품 수정
export const useUpdateProductMutation = (productId: string) => {
  const router = useRouter();

  const { data, isError, isPending, isSuccess, mutate } = useMutation({
    mutationFn: async (product: ProductUpdateType) => updateProduct(product),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["products", productId],
        }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["searchProducts"] }),
        queryClient.invalidateQueries({ queryKey: ["manageProducts"] }),
        queryClient.invalidateQueries({ queryKey: ["cart_items"] }),
        queryClient.invalidateQueries({ queryKey: ["discount_products"] }),
      ]);

      toast.success("상품이 성공적으로 수정되었습니다.");
      router.replace(`/products/${productId}`);
    },

    onError: (error) => {
      console.error("상품 수정 실패:", error);
      toast.error("상품 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    },
  });

  return { data, isError, mutate, isPending, isSuccess };
};

// 내 등록 상품 조회
export const useMyProductsQuery = (
  userId: string,
  searchQuery: string,
  page: number,
  pageSize: number,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["manageProducts", searchQuery, page, pageSize],
    queryFn: () => getMyProducts(userId, searchQuery, page, pageSize),
    enabled: !!userId,
  });

  return {
    data: data?.products ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
  };
};

// 유저 전체 조회
export const useAllUsersQuery = (
  searchQuery: string,
  level: number | undefined,
  page: number,
  pageSize: number,
) => {
  const { data, isLoading } = useQuery({
    queryKey: ["allUsers", searchQuery, level, page, pageSize],
    queryFn: () => getAllUsers({ query: searchQuery, level, page, pageSize }),
    enabled: true,
  });

  return {
    data,
    isLoading,
  };
};

// 유저 프로필 조회
export function useGetProfileQuery(userId: string | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId || ""),
    enabled: !!userId,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 유저 계정 활동 제한 변경
export function usePatchUserActiveMutation(userId: string) {
  const { data, isError, isSuccess, mutate } = useMutation({
    mutationFn: async (status: "active" | "suspended" | "withdrawn") =>
      patchUserActive(userId || "", status),

    onSuccess: async (_, status) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["userProfile", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["allUsers"],
        }),
      ]);

      if (status === "suspended") {
        toast.success("유저 계정이 활동 제한되었습니다.");
      } else if (status === "active") {
        toast.success("유저 계정이 정상 상태로 복구되었습니다.");
      } else {
        toast.success("유저 계정 상태가 성공적으로 변경되었습니다.");
      }
    },

    onError: (error) => {
      console.error("유저 계정 상태 변경 실패:", error);
      toast.error(
        "유저 계정 상태 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
    },
  });

  return {
    data,
    isError,
    isSuccess,
    mutate,
  };
}

// 최근 24시간 주문 조회 대시보드
export function useGetDashboardStatusQuery() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboardStatus"],
    queryFn: () => getDashboardStatus(),
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 최근 7일 매출 조회 대시보드
export function useGetWeekSalesAction() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weeklySales"],
    queryFn: () => getWeeklySalesAction(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

export function useGetCategorySales() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categorySales"],
    queryFn: () => getCategorySalesAction(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    data,
    isLoading,
    isError,
  };
}
