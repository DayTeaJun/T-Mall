"use client";

import { CartItemType, ProductType } from "@/types/product";
import { createBrowserSupabaseClient } from "../config/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/components/providers/ReactQueryProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const supabase = createBrowserSupabaseClient();

// 상품 전체 조회 (메인 페이지 "추천 상품" 섹션용, 더보기 방식 페이지네이션)
export async function getProductAllToMain(
  page: number = 1,
  pageSize: number = 10,
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("v_products_with_favorites")
    .select("*", { count: "exact" })
    .eq("deleted", false)
    .gt("total_stock", 0)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as unknown as ProductType[],
    count: count ?? 0,
  };
}

export function useProductAllToMainQuery(
  page: number = 1,
  pageSize: number = 10,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", page, pageSize],
    queryFn: () => getProductAllToMain(page, pageSize),
  });

  return {
    data: data?.data,
    totalCount: data?.count ?? 0,
    isLoading,
    isError,
  };
}

// 베스트 상품 조회 8개 (메인 페이지용)
export async function getBestProductList() {
  const { data, error } = await supabase
    .from("v_products_with_favorites")
    .select("*")
    .eq("deleted", false)
    .gt("total_stock", 0)
    .order("sales_count", { ascending: false })
    .limit(8);

  if (error) throw error;

  return (data ?? []) as unknown as ProductType[];
}

export function useBestProductListQuery() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["best_products"],
    queryFn: getBestProductList,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 베스트셀러 상품 전체 조회 (/best-sellers 페이지용, 더보기 방식 페이지네이션)
export async function getBestSellersList(
  page: number = 1,
  pageSize: number = 10,
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("v_products_with_favorites")
    .select("*", { count: "exact" })
    .eq("deleted", false)
    .gt("total_stock", 0)
    .order("sales_count", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data ?? []) as unknown as ProductType[],
    count: count ?? 0,
  };
}

export function useBestSellersListQuery(
  page: number = 1,
  pageSize: number = 10,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["best_sellers", page, pageSize],
    queryFn: () => getBestSellersList(page, pageSize),
  });

  return {
    data: data?.data,
    totalCount: data?.count ?? 0,
    isLoading,
    isError,
  };
}

// 실제 할인율(%) 계산 - discount_type이 fixed(정액)인 경우 discount_value가
// 원 단위라서 percentage 상품과 그대로 비교/정렬할 수 없어 정가 대비 비율로 환산
export function getDiscountPercent(product: ProductType) {
  if (!product.original_price || product.original_price <= product.price) {
    return 0;
  }
  return Math.round(
    ((product.original_price - product.price) / product.original_price) * 100,
  );
}

// 특가 섹션 카테고리 그룹 (DiscountProductList.tsx와 동일한 구성 공유)
const DISCOUNT_COLUMN_GROUPS: { label: string; categories: string[] }[] = [
  { label: "의류", categories: ["의류"] },
  { label: "신발", categories: ["신발"] },
  { label: "가방·액세서리", categories: ["가방", "액세서리"] },
];
// 그룹별로 넉넉히 후보를 가져온 뒤 실제 할인율(getDiscountPercent)로 다시 정렬 -
// discount_value만으로는 fixed(원 단위)/percentage(%)가 섞여있어 정확한 정렬이 안 됨
const DISCOUNT_CANDIDATE_POOL = 10;
const DISCOUNT_ITEMS_PER_COLUMN = 2;

// 할인 상품을 카테고리 그룹별로 최대 2개씩 조회 (메인 페이지 특가 섹션용)
export async function getDiscountProductList() {
  const results = await Promise.all(
    DISCOUNT_COLUMN_GROUPS.map(async (group) => {
      const { data, error } = await supabase
        .from("v_products_with_favorites")
        .select("*")
        .eq("deleted", false)
        .gt("total_stock", 0)
        .in("category", group.categories)
        .not("discount_value", "is", null)
        .order("discount_value", { ascending: false })
        .limit(DISCOUNT_CANDIDATE_POOL);

      if (error) throw error;

      const products = ((data ?? []) as unknown as ProductType[])
        .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
        .slice(0, DISCOUNT_ITEMS_PER_COLUMN);

      return { label: group.label, products };
    }),
  );

  return results.filter((col) => col.products.length > 0);
}

export function useDiscountProductListQuery() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["discount_products"],
    queryFn: getDiscountProductList,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 추천 상품 조회
export async function getRelatedProducts(
  currentProductId: string,
  category: string | null,
): Promise<ProductType[]> {
  if (!currentProductId || !category) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("deleted", false)
    .eq("category", category)
    .neq("id", currentProductId)
    .gt("total_stock", 0)
    .order("sales_count", { ascending: false })
    .limit(8);

  if (error) throw error;
  return data ?? [];
}

export function useRelatedProductsQuery(
  currentProductId: string,
  category: string | null,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", "related", currentProductId],
    queryFn: () => getRelatedProducts(currentProductId, category),
    enabled: !!currentProductId && !!category,
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 상품 상세 조회
export async function getProductDetail(
  id: string,
): Promise<ProductType | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("deleted", false)
    .single();

  if (error) throw error;
  return data ?? null;
}

export function useGetProductDetail(id: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", id],
    queryFn: () => getProductDetail(id),
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 상품 상세 리뷰 조회 (상품 상세 페이지 "상품 리뷰" 섹션용, 페이지네이션)
export const PRODUCT_REVIEWS_PAGE_SIZE = 5;

const REVIEW_SELECT = `
  id,
  user_id,
  user_name,
  rating,
  created_at,
  images,
  content,
  product_id,
  updated_at,
  public_profiles ( profile_image_url ),
  helpful_count,
  review_helpfuls ( user_id )
`;

export interface ProductReviewRow {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  created_at: string | null;
  images: string[] | null;
  content: string;
  product_id: string;
  updated_at: string | null;
  public_profiles: { profile_image_url: string | null } | null;
  helpful_count: number;
  review_helpfuls: { user_id: string }[];
}

export interface ProductReviewsResult {
  reviews: ProductReviewRow[];
  totalCount: number;
}

export async function getProductReviews(
  productId: string,
  page: number = 1,
  pageSize: number = PRODUCT_REVIEWS_PAGE_SIZE,
  excludeUserId?: string,
): Promise<ProductReviewsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("reviews")
    .select(REVIEW_SELECT, { count: "exact" })
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    reviews: (data ?? []) as ProductReviewRow[],
    totalCount: count ?? 0,
  };
}

export function useProductReviewsQuery(
  productId: string,
  page: number,
  pageSize: number,
  initialData?: ProductReviewsResult,
  excludeUserId?: string,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productReviews", productId, page, pageSize, excludeUserId],
    queryFn: () => getProductReviews(productId, page, pageSize, excludeUserId),
    enabled: !!productId,
    initialData: page === 1 ? initialData : undefined,
  });

  return {
    reviews: data?.reviews ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isError,
  };
}

// 내가 이 상품에 남긴 리뷰 1건 조회 ("내가 남긴 리뷰" 상단 고정 섹션용)
export async function getMyProductReview(
  productId: string,
  userId: string,
): Promise<ProductReviewRow | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as ProductReviewRow | null;
}

export function useMyProductReviewQuery(
  productId: string,
  userId?: string,
  initialData?: ProductReviewRow | null,
) {
  const { data, isLoading } = useQuery({
    queryKey: ["myProductReview", productId, userId],
    queryFn: () => getMyProductReview(productId, userId as string),
    enabled: !!productId && !!userId,
    initialData,
  });

  return { myReview: data ?? null, isLoading };
}

// 상품 상세 문의 조회 (상품 상세 페이지 "상품 문의" 섹션용, 페이지네이션)
export const PRODUCT_INQUIRY_PAGE_SIZE = 5;

const INQUIRY_SELECT = `
  id,
  user_id,
  user_name,
  created_at,
  content,
  answer_content,
  answered_at,
  updated_at,
  admin_id
`;

export interface ProductInquiryRow {
  id: number;
  user_id: string;
  user_name: string;
  created_at: string;
  content: string;
  answer_content: string | null;
  answered_at: string | null;
  updated_at: string | null;
  admin_id: string | null;
}

export interface ProductInquiryListResult {
  inquiries: ProductInquiryRow[];
  totalCount: number;
}

export async function getProductInquiryList(
  productId: string,
  page: number = 1,
  pageSize: number = PRODUCT_INQUIRY_PAGE_SIZE,
  excludeUserId?: string,
): Promise<ProductInquiryListResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("product_inquiry")
    .select(INQUIRY_SELECT, { count: "exact" })
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    inquiries: (data ?? []) as ProductInquiryRow[],
    totalCount: count ?? 0,
  };
}

export function useProductInquiryListQuery(
  productId: string,
  page: number,
  pageSize: number,
  initialData?: ProductInquiryListResult,
  excludeUserId?: string,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productInquiryList", productId, page, pageSize, excludeUserId],
    queryFn: () =>
      getProductInquiryList(productId, page, pageSize, excludeUserId),
    enabled: !!productId,
    initialData: page === 1 ? initialData : undefined,
  });

  return {
    inquiries: data?.inquiries ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isError,
  };
}

// 내가 이 상품에 남긴 문의 1건 조회 ("내 문의" 상단 고정 섹션용) —
// 중복 작성이 막혀있긴 하지만 혹시 여러 건이어도 에러 없이 최신 1건만 가져오도록 limit(1) 사용
export async function getMyProductInquiry(
  productId: string,
  userId: string,
): Promise<ProductInquiryRow | null> {
  const { data, error } = await supabase
    .from("product_inquiry")
    .select(INQUIRY_SELECT)
    .eq("product_id", productId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0] as ProductInquiryRow) ?? null;
}

export function useMyProductInquiryQuery(
  productId: string,
  userId?: string,
  initialData?: ProductInquiryRow | null,
) {
  const { data, isLoading } = useQuery({
    queryKey: ["myProductInquiry", productId, userId],
    queryFn: () => getMyProductInquiry(productId, userId as string),
    enabled: !!productId && !!userId,
    initialData,
  });

  return { myInquiry: data ?? null, isLoading };
}

// 장바구니 상품 전체 조회
export async function getProductAllCart(
  userId: string,
): Promise<CartItemType[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "id, quantity, product:product_id ( id, name, price, image_url ), options",
    ) // 장바구니 및 장바구니 상품 정보 조회 조인
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const normalized = (data ?? []).map((item) => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] : item.product, // product가 배열로 올 경우 첫 번째 요소만 사용 (supabase에서 조인 시 여러개가 조회될 수 있다 판단하여 배열로 반환)
  }));

  return normalized;
}

export function useProductAllCart(userId: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["cart_items", userId],
    queryFn: () => getProductAllCart(userId),
  });

  return {
    data,
    isLoading,
    isError,
  };
}

// 장바구니 추가
export const postCartItem = async ({
  userId,
  productId,
  quantity,
  selectedSize,
}: {
  userId: string;
  productId: string;
  quantity: number;
  selectedSize: string;
}) => {
  const optionsObj = { size: selectedSize };

  const { data: existing, error: fetchError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .contains("options", optionsObj)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error("장바구니 조회 실패: " + fetchError.message);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error("장바구니 수량 업데이트 실패: " + updateError.message);
    }
  } else {
    const { error: insertError } = await supabase.from("cart_items").insert({
      user_id: userId,
      product_id: productId,
      quantity,
      options: optionsObj,
    });

    if (insertError) {
      throw new Error("장바구니 추가 실패: " + insertError.message);
    }
  }
};

export const usePostMutation = (userId: string) => {
  const router = useRouter();
  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: postCartItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["cart_items", userId],
      });
      router.refresh();
      toast.success("장바구니에 상품이 추가되었습니다.");
    },
    onError: (error: Error) => {
      console.error("장바구니 추가 실패:", error);
      toast.error("관리자에게 문의해주세요.");
    },
  });

  return { data, isError, mutate, isSuccess, isPending };
};

// 장바구니 수량 변경
export const updateCartItemQuantity = async ({
  itemId,
  quantity,
}: {
  itemId: string;
  quantity: number;
}) => {
  if (quantity < 1) return;
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId);

  if (error) throw error;
  return data ?? [];
};

export const useUpdateQuantityMutation = (userId: string) => {
  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: updateCartItemQuantity,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart_items", userId],
      });
    },
  });
  return { data, isError, mutate, isSuccess, isPending };
};

// 장바구니 상품 삭제
export const deleteCartItem = async (itemId: string) => {
  const { data, error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
  return data ?? [];
};

export const useDeleteCartItemMutation = (userId: string) => {
  const router = useRouter();
  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: deleteCartItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["cart_items", userId],
      });
      toast.success("장바구니 상품이 삭제되었습니다.");
      router.refresh();
    },
  });
  return { data, isError, mutate, isSuccess, isPending };
};

// 상품 검색 쿼리
const getSearchProducts = async (
  category: string = "",
  sub: string = "",
  query: string = "",
  page: number,
  limit: number,
  sort: string = "accurate",
  minPrice?: number,
  maxPrice?: number,
  size?: string,
) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let queryBuilder = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("deleted", false);

  if (category && category !== "전체") {
    queryBuilder = queryBuilder.eq("category", category);
  }

  const trimmedSub = typeof sub === "string" ? sub.trim() : "";

  if (trimmedSub && trimmedSub !== "전체") {
    if (trimmedSub === "특가/할인") {
      queryBuilder = queryBuilder
        .not("discount_value", "is", null)
        .gt("discount_value", 0);
    } else {
      queryBuilder = queryBuilder.eq("subcategory", trimmedSub);
    }
  }

  if (query.trim() !== "") {
    queryBuilder = queryBuilder.ilike("name", `%${query}%`);
  }

  // 최소금액
  if (typeof minPrice === "number" && !isNaN(minPrice)) {
    queryBuilder = queryBuilder.gte("price", minPrice);
  }
  // 최대금액
  if (typeof maxPrice === "number" && !isNaN(maxPrice)) {
    queryBuilder = queryBuilder.lte("price", maxPrice);
  }

  // 사이즈 필터: stock_by_size(JSON)에 해당 사이즈 키 자체가 있는 상품만
  // (예: stock_by_size->M 이 존재하는 상품 - 재고 0이어도 그 사이즈를 운영하는 상품은 노출)
  if (size) {
    queryBuilder = queryBuilder.not(`stock_by_size->${size}`, "is", null);
  }

  // 정렬 처리
  switch (sort) {
    case "price_asc":
      queryBuilder = queryBuilder.order("price", { ascending: true });
      break;

    case "price_desc":
      queryBuilder = queryBuilder.order("price", { ascending: false });
      break;

    case "sales":
      queryBuilder = queryBuilder.order("sales_count", { ascending: false });
      break;

    case "latest":
      queryBuilder = queryBuilder.order("created_at", { ascending: false });
      break;

    case "accurate":
    default:
      // 기본값: 최신순 + id 보조 정렬
      queryBuilder = queryBuilder
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      break;
  }

  const { data, count, error } = await queryBuilder.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return { data, count };
};

export const useSearchProductsQuery = (
  category: string = "",
  subCategory: string = "",
  query: string = "",
  page: number,
  limit: number,
  sort: string = "accurate",
  minPrice?: number,
  maxPrice?: number,
  size?: string,
) => {
  const { data, isLoading } = useQuery({
    queryKey: [
      "searchProducts",
      category,
      subCategory,
      query,
      page,
      limit,
      sort,
      minPrice ?? null,
      maxPrice ?? null,
      size ?? "",
    ],
    queryFn: () =>
      getSearchProducts(
        category,
        subCategory,
        query,
        page,
        limit,
        sort,
        minPrice,
        maxPrice,
        size,
      ),
  });

  return {
    data,
    isLoading,
  };
};

// 즐겨찾기 단일 조회
export async function getFavorite(userId: string, productId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    throw new Error("즐겨찾기 조회 실패: " + error.message);
  }

  return data;
}

// 내가 찜한 상품 id 전체를 한 번에 조회 (상품 카드들이 이 결과 하나를 공유해서 씀)
export async function getMyFavoriteIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error("즐겨찾기 목록 조회 실패: " + error.message);
  }

  return new Set((data ?? []).map((f) => f.product_id));
}

export function useMyFavoriteIdsQuery(userId?: string) {
  return useQuery({
    queryKey: ["favoriteIds", userId],
    queryFn: () => getMyFavoriteIds(userId as string),
    enabled: !!userId,
  });
}

// 즐겨찾기 전체 조회
async function getFavoritesAll(
  userId: string,
  rawQuery: string = "",
  page: number,
  limit: number,
) {
  const query = (rawQuery ?? "").trim();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let qb = supabase
    .from("favorites")
    .select(
      `
        product_id,
        created_at,
        products!inner (
          id,
          name,
          price,
          image_url,
          category,
          subcategory,
          total_stock,
          stock_by_size
        )
      `,
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (query !== "") {
    qb = qb.ilike("products.name", `%${query}%`);
  }

  const { data, count, error } = await qb.range(from, to);

  if (error) {
    throw new Error("즐겨찾기 조회 실패: " + error.message);
  }

  return { data, count };
}

export const useFavoritesAll = (
  userId: string,
  query: string = "",
  page: number,
  limit: number,
) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["favorites", userId, query, page, limit],
    queryFn: () => getFavoritesAll(userId, query, page, limit),
  });

  return {
    data,
    isLoading,
    isError,
  };
};

// 즐겨찾기 추가
export const postFavorite = async (
  userId: string,
  productId: string,
): Promise<boolean> => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("즐겨찾기 조회 실패:", fetchError.message);
      return false;
    }

    if (existing) {
      console.warn("이미 즐겨찾기에 추가된 상품입니다.");
      return false;
    }

    const { error: insertError } = await supabase.from("favorites").insert({
      user_id: userId,
      product_id: productId,
    });

    if (insertError) {
      console.error("즐겨찾기 추가 실패:", insertError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("즐겨찾기 처리 중 예외 발생:", err);
    return false;
  }
};

export const usePostFavoriteMutation = (userId: string) => {
  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (productId: string) => postFavorite(userId, productId),
    onSuccess: async (_data, productId) => {
      queryClient.setQueryData<Set<string>>(["favoriteIds", userId], (prev) =>
        new Set(prev).add(productId),
      );
      await queryClient.invalidateQueries({
        queryKey: ["favorites", userId],
      });
      toast.success("상품을 찜했습니다.");
    },
  });
  return { data, isError, mutate, isSuccess, isPending };
};

// 즐겨찾기 삭제
export const deleteFavorite = async (userId: string, productId: string) => {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .match({ user_id: userId, product_id: productId });

  if (error) {
    throw new Error("즐겨찾기 삭제 실패: " + error.message);
  }

  return { userId, productId };
};

export const useDeleteFavoriteMutation = (userId: string) => {
  const { data, isError, mutate, isSuccess, isPending } = useMutation({
    mutationFn: (productId: string) => deleteFavorite(userId, productId),
    onSuccess: async (_data, productId) => {
      queryClient.setQueryData<Set<string>>(["favoriteIds", userId], (prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      await queryClient.invalidateQueries({
        queryKey: ["favorites", userId],
      });
      toast.success("찜 목록에서 제외되었습니다.");
    },
  });
  return { data, isError, mutate, isSuccess, isPending };
};
