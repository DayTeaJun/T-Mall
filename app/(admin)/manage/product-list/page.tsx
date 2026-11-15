"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import useDebounce from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import ReactPaginate from "react-paginate";
import ProductDelBtn from "./_components/ProductDelBtn";
import { useMyProductsQuery } from "@/lib/queries/admin";
import { ImageOff, Loader2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { Json } from "@/lib/config/supabase/types_db";

interface StockMapType {
  [size: string]: number | string | null | undefined;
}

interface ProductType {
  category: string | null;
  color: string | null;
  created_at: string | null;
  deleted: boolean;
  deleted_at: string | null;
  description: string | null;
  gender: string | null;
  id: string;
  image_url: string | null;
  name: string;
  price: number;
  rating_map: Json | null;
  sales_count: number | null;
  stock_by_size: Json;
  subcategory: string | null;
  tags: string[] | null;
  total_stock: number | null;
  updated_at: string | null;
  user_id: string | null;
  views: number;
  // 등록자 닉네임 (products.user_id -> public_profiles FK 조인 결과)
  public_profiles: { user_name: string | null } | null;
}

const PAGE_SIZE = 10;

export default function ProductListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debounceQuery = useDebounce<string>(searchQuery);
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [debounceQuery]);

  const {
    data: products = [],
    totalCount,
    isLoading,
  } = useMyProductsQuery(user?.id || "", debounceQuery, page, PAGE_SIZE);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const getAvailableStock = (
    stockBySize: ProductType["stock_by_size"],
  ): [string, number][] => {
    if (!stockBySize) return [];

    try {
      const stockMap = (
        typeof stockBySize === "string" ? JSON.parse(stockBySize) : stockBySize
      ) as StockMapType;

      if (!stockMap || typeof stockMap !== "object") return [];

      return Object.entries(stockMap)
        .map(([size, count]): [string, number] => [size, Number(count) || 0])
        .filter((item) => item[1] > 0);
    } catch (error) {
      console.error("재고 데이터 파싱 오류:", error);
      return [];
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-4">등록한 상품 관리</h1>

      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <input
          type="text"
          placeholder="상품명 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full sm:w-64"
        />

        <button
          onClick={() => router.push("/manage/regist")}
          className="text-black flex gap-1 items-center cursor-pointer border p-2 px-4 hover:bg-gray-100 duration-200 transition-all rounded self-stretch sm:self-auto justify-center"
        >
          <p className="text-[14px]">상품등록</p>
          <ShoppingBag size={16} />
        </button>
      </div>

      <div className="hidden sm:block">
        <div className="overflow-x-auto rounded border">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="border p-2 w-[60px]">No</th>
                <th className="border p-2 w-[140px]">이미지</th>
                <th className="border p-2">
                  닉네임 / 상품번호 / 상품명 / 상품태그
                </th>
                <th className="border p-2 w-[120px]">판매가 (할인)</th>
                <th className="border p-2 w-[160px]">재고 상태</th>
                <th className="border p-2 w-[150px]">처리 날짜</th>
                <th className="border p-2 w-[120px]">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm relative">
              {isLoading ? (
                <tr className="h-full">
                  <td colSpan={7} className="h-full">
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                      <Loader2 className="w-10 h-10 mb-4 animate-spin text-gray-400" />
                      <p className="text-sm">상품 목록을 불러오는 중입니다</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr className="h-full">
                  <td colSpan={7} className="h-full">
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                      <ShoppingBag className="w-12 h-12 mb-4 text-gray-400" />
                      <p className="text-base font-medium mb-1">
                        등록된 상품이 없습니다
                      </p>
                      <p className="text-sm text-gray-400 mb-6">
                        상품을 등록하면 이곳에서 관리할 수 있습니다.
                      </p>
                      <button
                        onClick={() => router.push("/manage/regist")}
                        className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-100 transition"
                      >
                        <ShoppingBag size={16} />
                        상품 등록하기
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const validStocks = getAvailableStock(product.stock_by_size);

                  const hasDiscount =
                    product.original_price &&
                    product.original_price > product.price;

                  let discountPercent = 0;
                  if (product && product.original_price) {
                    if (
                      product.discount_type === "percentage" &&
                      product.discount_value
                    ) {
                      discountPercent = product.discount_value;
                    } else {
                      discountPercent = Math.round(
                        ((product.original_price - product.price) /
                          product.original_price) *
                          100,
                      );
                    }
                  }

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="border p-2">
                        {totalCount - (page * PAGE_SIZE + index)}
                      </td>
                      <td
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="border p-2 cursor-pointer align-middle"
                      >
                        <div className="w-full aspect-square">
                          {product.image_url ? (
                            <Image
                              width={200}
                              height={200}
                              src={product.image_url}
                              alt={product.name}
                              priority
                              className="object-cover w-full h-full hover:scale-105 transition-all duration-200"
                            />
                          ) : (
                            <div className="flex flex-col gap-2 items-center justify-center w-full h-full bg-gray-100">
                              <ImageOff size={28} className="text-gray-400" />
                              <p className="text-gray-500 text-xs">
                                이미지가 없습니다.
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="border p-2 text-left cursor-pointer"
                      >
                        <span className="text-gray-500 text-xs block">
                          {product.public_profiles?.user_name ?? "알 수 없음"} | {product.id}
                        </span>
                        <span className="block my-2 border p-1">
                          {product.name}
                        </span>
                        <span className="block border p-1 text-xs text-gray-700">
                          {product.category}
                        </span>
                      </td>
                      <td className="border p-2 font-medium">
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-[14px] text-red-500 tracking-tight">
                              {discountPercent}%
                            </span>
                            <span className="text-[11px] text-gray-400 line-through">
                              {product.original_price?.toLocaleString()}원
                            </span>
                            <span className="text-[14px] text-[#111111] tracking-tight">
                              {product.price.toLocaleString()}원
                            </span>
                          </div>
                        ) : (
                          <p className="text-[14px] text-[#111111] tracking-tight">
                            {product.price.toLocaleString()}원
                          </p>
                        )}
                      </td>

                      <td className="border p-2 text-center align-middle">
                        {validStocks.length > 0 ? (
                          <div className="flex flex-col gap-1 justify-center">
                            {validStocks.map(([size, count]) => (
                              <span
                                key={size}
                                className="text-gray-700 text-[11px]"
                              >
                                {size}: {Number(count)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-red-500 font-medium text-xs">
                            재고 없음
                          </span>
                        )}
                      </td>

                      <td className="border p-2 text-left text-xs leading-6">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <span className="block">
                            <span className="text-gray-500 mr-1">등록일</span>
                            {product.created_at &&
                              new Date(product.created_at).toLocaleDateString()}
                          </span>
                          <span className="block">
                            <span className="text-gray-500 mr-1">갱신일</span>
                            {product.updated_at &&
                              new Date(product.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="border p-2">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() =>
                              router.push(`/manage/edit/${product.id}`)
                            }
                            className="border p-2 text-14 hover:bg-gray-100 transition"
                          >
                            수정
                          </button>
                          <ProductDelBtn
                            productId={product.id}
                            imageUrl={product.image_url || ""}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sm:hidden min-h-[60vh] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-10 h-10 mb-4 animate-spin text-gray-400" />
            <p className="text-sm">상품 목록을 불러오는 중입니다</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 border rounded">
            <ShoppingBag className="w-12 h-12 mb-4 text-gray-400" />
            <p className="text-base font-medium mb-1">등록된 상품이 없습니다</p>
            <p className="text-sm text-gray-400 mb-6">
              첫 상품을 등록해보세요.
            </p>
            <button
              onClick={() => router.push("/manage/regist")}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-100 transition"
            >
              <ShoppingBag size={16} />
              상품 등록하기
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {products.map((product, index) => {
              const validStocks = getAvailableStock(product.stock_by_size);

              const hasDiscount =
                product.original_price &&
                product.original_price > product.price;

              let discountPercent = 0;
              if (product && product.original_price) {
                if (
                  product.discount_type === "percentage" &&
                  product.discount_value
                ) {
                  discountPercent = product.discount_value;
                } else {
                  discountPercent = Math.round(
                    ((product.original_price - product.price) /
                      product.original_price) *
                      100,
                  );
                }
              }

              return (
                <li
                  key={product.id}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex gap-3">
                    <div
                      className="w-24 min-w-24 aspect-square overflow-hidden rounded-md border cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                          <ImageOff size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          No. {totalCount - (page * PAGE_SIZE + index)}
                        </span>
                        {hasDiscount ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[11px] text-gray-400 line-through">
                              {product.original_price?.toLocaleString()}원
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[14px] sm:text-[15px] font-bold text-red-500 tracking-tight">
                                {discountPercent}%
                              </span>
                              <span className="text-[14px] sm:text-[15px] font-bold text-[#111111] tracking-tight">
                                {product.price.toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[14px] sm:text-[15px] font-bold text-[#111111] tracking-tight">
                            {product.price.toLocaleString()}원
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="mt-1 w-full flex flex-col gap-1.5 text-left"
                      >
                        <p className="text-xs text-gray-500 truncate">
                          {product.public_profiles?.user_name ?? "알 수 없음"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          ID: {product.id}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-600 px-2 py-0.5 border rounded w-fit bg-white">
                          {product.category}
                        </p>
                      </button>

                      {/* 💡 모바일 재고 상태 */}
                      <div className="mt-3 pt-2 border-t border-dashed border-gray-200">
                        {validStocks.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {validStocks.map(([size, count]) => (
                              <span
                                key={size}
                                className="bg-gray-50 text-gray-700 border border-gray-200 text-[11px] px-1.5 py-0.5 rounded-sm"
                              >
                                {size}: {Number(count)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-red-500 font-medium text-xs">
                            재고 없음
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 flex flex-col text-[11px] text-gray-400 leading-4">
                        <span>
                          등록{" "}
                          {product.created_at &&
                            new Date(product.created_at).toLocaleDateString()}
                        </span>
                        <span>
                          갱신{" "}
                          {product.updated_at &&
                            new Date(product.updated_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            router.push(`/manage/edit/${product.id}`)
                          }
                          className="border rounded p-2 text-sm bg-white hover:bg-gray-100 active:scale-[0.99] transition"
                        >
                          수정
                        </button>
                        <ProductDelBtn
                          productId={product.id}
                          imageUrl={product.image_url || ""}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-center text-xs sm:text-sm mt-6">
        <ReactPaginate
          onPageChange={(e) => setPage(e.selected)}
          pageRangeDisplayed={3}
          pageCount={pageCount}
          forcePage={page}
          marginPagesDisplayed={1}
          previousLabel={"<"}
          nextLabel={">"}
          breakLabel={"..."}
          breakClassName={"break-me"}
          containerClassName={"pagination"}
          activeClassName={"active"}
          pageClassName={"page-item"}
          pageLinkClassName={"page-link"}
          previousClassName={"page-item"}
          previousLinkClassName={"page-link"}
          nextClassName={"page-item"}
          nextLinkClassName={"page-link"}
        />
      </div>
    </div>
  );
}
