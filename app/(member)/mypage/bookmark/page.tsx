"use client";

import {
  useDeleteFavoriteMutation,
  useFavoritesAll,
  usePostMutation,
} from "@/lib/queries/products";
import { useAuthStore } from "@/lib/store/useAuthStore";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LoaderCircle,
  PackageX,
  RefreshCcw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react"; // ← useEffect 추가
import { toast } from "sonner";
import Modal from "@/components/common/modal/Modal";
import ReactPaginate from "react-paginate";

type StockMap = Record<string, number>;

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock_by_size?: StockMap;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface FavoriteMapValue {
  product_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    category: string | null;
    subcategory: string | null;
    total_stock: number | null;
    stock_by_size: Json;
  };
}

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

const pickFirstAvailable = (stock: StockMap) => {
  if ((stock["L"] ?? 0) > 0) return "L";
  const first = SIZE_OPTIONS.find((s) => (stock[s] ?? 0) > 0);
  return first ?? "";
};

export default function BookmarkPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const keyword = searchParams.get("query") ?? "";
  const [searchInput, setSearchInput] = useState(keyword);

  const currentPage = Number(searchParams.get("page") ?? 1);

  const {
    data: favorites,
    isLoading,
    isError,
  } = useFavoritesAll(user?.id ?? "", keyword, currentPage, 8);

  const { mutate: deleteMutate } = useDeleteFavoriteMutation(user?.id ?? "");
  const { mutate: addCartMutate } = usePostMutation(user?.id ?? "");

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isModal, setIsModal] = useState(false);

  const [selectedSizeById, setSelectedSizeById] = useState<
    Record<string, string>
  >({});
  const [quantityById, setQuantityById] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!favorites?.data) return;

    setSelectedSizeById((prev) => {
      const next = { ...prev };
      for (const fav of favorites.data) {
        const p = fav.products;
        const stock: StockMap = (p?.stock_by_size as StockMap) ?? {};
        if (!next[p.id]) {
          next[p.id] = pickFirstAvailable(stock);
        } else {
          const cur = next[p.id];
          if (!cur || (stock[cur] ?? 0) === 0) {
            next[p.id] = pickFirstAvailable(stock);
          }
        }
      }
      return next;
    });

    setQuantityById((prev) => {
      const next = { ...prev };
      for (const fav of favorites.data) {
        const p = fav.products;
        if (!next[p.id] || !Number.isFinite(next[p.id]) || next[p.id] < 1) {
          next[p.id] = 1;
        }
      }
      return next;
    });
  }, [favorites?.data]);

  const getStockMap = (p: Product): StockMap => {
    return (p?.stock_by_size as StockMap) ?? {};
  };

  const validateBeforeAdd = (p: Product) => {
    const stockBySize = getStockMap(p);
    const selectedSize = selectedSizeById[p.id] ?? "";
    const qty = quantityById[p.id] ?? 1;
    const currentStock = stockBySize[selectedSize] ?? 0;

    if (!selectedSize) {
      toast.error("사이즈를 선택해주세요.");
      return false;
    }
    if (currentStock <= 0) {
      toast.error("선택하신 사이즈는 품절입니다.");
      return false;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error("수량은 1 이상으로 입력해주세요.");
      return false;
    }
    if (qty > currentStock) {
      toast.error(
        `현재 선택하신 재고는 최대 ${currentStock}개입니다.\n수량을 조정해주세요.`,
      );
      return false;
    }
    return true;
  };

  const handleSearch = () => {
    router.push(`/mypage/bookmark?query=${searchInput}&page=1`);
  };

  const handleSearchRefresh = () => {
    setSearchInput("");
    router.push("/mypage/bookmark?query=&page=1");
  };

  const handlePageChange = (selected: { selected: number }) => {
    const newPage = selected.selected + 1;
    router.push(
      `/mypage/bookmark?query=${encodeURIComponent(keyword)}&page=${newPage}`,
    );
  };

  const PAGE_SIZE = 10; // ← 훅에서 8을 쓰고 있어 불일치합니다. 둘 중 하나로 통일 권장 (예: 10)
  const totalCount = favorites?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const allIds = favorites?.data?.map((item) => item.products.id) ?? [];
    if (selectedItems.length === allIds.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allIds);
    }
  };

  const handleDelSelectFavorites = () => {
    selectedItems.forEach((id) => deleteMutate(id));
    setSelectedItems([]);
    router.refresh();
    setIsModal(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-600">
        <LoaderCircle size={48} className="animate-spin mb-4" />
        <p className="text-sm">찜 목록 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  if (isError || !favorites) {
    return (
      <div className="max-w-7xl">
        <h1 className="text-xl font-bold">찜 리스트</h1>
        <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-600">
          <PackageX size={48} className="mb-4" />
          <p className="text-sm">찜 목록을 불러오는 중 문제가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-4">찜 리스트</h1>
      {favorites && favorites?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600">
          <PackageX size={48} className="mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            찜 목록이 비어 있습니다
          </h3>
          <p className="text-sm mb-6">
            마음에 드는 상품을 찜 목록에 담아보세요.
          </p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-100 transition"
          >
            <ShoppingCart size={16} />
            쇼핑하러 가기
          </button>
        </div>
      ) : (
        <>
          <ul className="flex flex-col border-b">
            <div className="flex flex-col mb-4 sm:gap-0 gap-4">
              <div className="flex items-center gap-2 relative w-full">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="상품 이름을 검색해보세요!"
                  className="w-full px-3 py-2 pr-10 border rounded-md text-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute right-12 sm:right-[52px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label="검색어 지우기"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  className="p-2 text-black border rounded-md cursor-pointer active:scale-[0.98]"
                  aria-label="검색"
                >
                  <Search size={20} />
                </button>

                <button
                  onClick={handleSearchRefresh}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md border text-sm self-end sm:self-auto w-full sm:w-auto justify-center sm:justify-start shrink-0"
                >
                  <RefreshCcw size={16} />
                  검색 초기화
                </button>
              </div>

              <button
                onClick={handleSearchRefresh}
                className="flex sm:hidden items-center gap-2 px-3 py-2 rounded-md border text-sm self-end w-full justify-center shrink-0"
              >
                <RefreshCcw size={16} />
                검색 초기화
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-b p-3 px-4 bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  onChange={toggleSelectAll}
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                  checked={
                    (favorites?.data?.length ?? 0) > 0 &&
                    selectedItems.length === (favorites?.data?.length ?? 0)
                  }
                />
                <span className="text-sm text-gray-800 font-medium">
                  전체 선택 ({selectedItems.length} /{" "}
                  {favorites?.data?.length ?? 0})
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedItems.length === 0) {
                      toast.error("삭제할 항목을 선택하세요.");
                      return;
                    }
                    setIsModal(true);
                  }}
                  className="px-3 py-1 border text-sm rounded hover:bg-gray-100 transition"
                >
                  선택삭제
                </button>
              </div>
            </div>

            {favorites?.data.map((fav: FavoriteMapValue, i: number) => {
              const p: Product = {
                ...fav.products,
                stock_by_size:
                  fav.products.stock_by_size &&
                  typeof fav.products.stock_by_size === "object" &&
                  !Array.isArray(fav.products.stock_by_size)
                    ? (Object.fromEntries(
                        Object.entries(
                          fav.products.stock_by_size as Record<string, unknown>,
                        ).filter(([, v]) => typeof v === "number"),
                      ) as StockMap)
                    : undefined,
              };

              const stockBySize = getStockMap(p);
              const selectedSize = selectedSizeById[p.id] ?? "";

              return (
                <li
                  key={p.id}
                  className={`p-4 bg-white ${
                    favorites?.data.length - i !== 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-3 sm:gap-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mr-2 cursor-pointer"
                      checked={selectedItems.includes(p.id)}
                      onChange={() => toggleItemSelection(p.id)}
                    />

                    <div
                      className="flex flex-col gap-2 sm:flex-1 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        const ignore = target.closest("[data-no-nav='true']");
                        if (!ignore) router.push(`/products/${p.id}`);
                      }}
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                          <Image
                            src={p.image_url ?? ""}
                            alt={p.name}
                            width={96}
                            height={96}
                            className="rounded border object-cover w-20 h-20 sm:w-24 sm:h-24"
                          />
                          <div className="flex flex-col justify-between h-20 sm:h-24 flex-1">
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {p.price?.toLocaleString?.() ?? 0}원
                            </p>

                            <select
                              value={selectedSize || ""}
                              onChange={(e) => {
                                const value = e.target.value;

                                if (!value) return;

                                setSelectedSizeById((prev) => ({
                                  ...prev,
                                  [p.id]: value,
                                }));

                                setQuantityById((prev) => ({
                                  ...prev,
                                  [p.id]: 1,
                                }));
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="w-42 border p-2 text-sm bg-white"
                            >
                              <option value="" disabled hidden>
                                사이즈 선택
                              </option>

                              {SIZE_OPTIONS.map((size) => {
                                const stock = stockBySize[size] ?? 0;
                                const disabled = stock === 0;

                                return (
                                  <option
                                    key={size}
                                    value={size}
                                    disabled={disabled}
                                  >
                                    {size} ({stock}개 남음)
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-1 sm:gap-2 mt-2 sm:mt-0 sm:flex sm:flex-col sm:justify-between">
                      <button
                        onClick={() => {
                          if (!validateBeforeAdd(p)) return;
                          addCartMutate({
                            productId: p.id,
                            userId: user?.id || "",
                            quantity: quantityById[p.id] ?? 1,
                            selectedSize: selectedSizeById[p.id],
                          });
                        }}
                        className="border h-8 rounded-md px-2 py-auto text-sm text-gray-700 hover:bg-gray-200 cursor-pointer w-auto sm:w-30"
                      >
                        장바구니 담기
                      </button>

                      <hr className="sm:block hidden" />

                      <button
                        onClick={() => deleteMutate(fav.product_id)}
                        className="border h-8 rounded-md px-2 py-auto text-sm text-gray-700 hover:bg-gray-200 cursor-pointer w-auto sm:w-30"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex justify-center">
            <ReactPaginate
              onPageChange={handlePageChange}
              pageRangeDisplayed={3}
              pageCount={pageCount}
              forcePage={currentPage - 1}
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
        </>
      )}

      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title="선택한 상품을 삭제하시겠습니까?"
        description={`* 선택한 상품이 장바구니에서 삭제됩니다. \n (상품페이지에서 다시 상품을 다시 추가할 수 있습니다.)`}
        onConfirm={handleDelSelectFavorites}
        confirmText="삭제"
      />
    </div>
  );
}
