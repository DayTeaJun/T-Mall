"use client";

import Modal from "@/components/common/modal/Modal";
import { Json } from "@/lib/config/supabase/types_db";
import { useGetMyAvailableCoupons } from "@/lib/queries/coupon";
import {
  useDeleteCartItemMutation,
  useProductAllCart,
  useUpdateQuantityMutation,
} from "@/lib/queries/products";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { ImageOff, LoaderCircle, PackageX, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function CartItemOptions({ options }: { options?: Json | null }) {
  if (!options) return null;

  const labels: Record<string, string> = {
    size: "사이즈",
    color: "색상",
  };

  return (
    <p className="text-xs text-gray-500">
      {Object.entries(options)
        .map(([k, v]) => `${labels[k] ?? k}: ${v}`)
        .join(" / ")}
    </p>
  );
}

export default function MyCartPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { mutate, isPending } = useUpdateQuantityMutation(user?.id ?? "");
  const { mutate: deleteMutate } = useDeleteCartItemMutation(user?.id ?? "");
  const { data: cartItems, isLoading } = useProductAllCart(user?.id ?? "");

  const { data: coupons } = useGetMyAvailableCoupons(user?.id || "");

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [isModal, setIsModal] = useState(false);

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const selectedCartItems = cartItems?.filter((item) =>
    selectedItems.includes(item.id),
  );

  const totalQuantity =
    selectedCartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const totalPrice =
    selectedCartItems?.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0,
    ) ?? 0;

  // 선택된 쿠폰 정보 찾기
  const selectedUserCoupon = coupons?.find(
    (item) => item.id === selectedCouponId,
  );
  const rawSelectedCoupon = selectedUserCoupon?.coupon;

  // [파생값 방식 적용] 최소 주문 금액을 충족하지 않으면 유효하지 않은 쿠폰으로 간주
  const isSelectedCouponInvalid =
    rawSelectedCoupon &&
    rawSelectedCoupon.min_order_price &&
    rawSelectedCoupon.min_order_price > 0 &&
    totalPrice < rawSelectedCoupon.min_order_price;

  // 최종 유효한 쿠폰 및 쿠폰 ID 계산 (조건 미달 시 자동으로 null 처리됨)
  const selectedCoupon = isSelectedCouponInvalid ? null : rawSelectedCoupon;
  const effectiveCouponId = isSelectedCouponInvalid ? null : selectedCouponId;

  // 쿠폰 할인 금액 계산 로직
  const calculateDiscount = () => {
    if (!selectedCoupon) return 0;

    // 최소 주문 금액 조건 확인 (이미 위에서 거걸러지지만 안전장치로 유지)
    if (
      selectedCoupon.min_order_price &&
      selectedCoupon.min_order_price > 0 &&
      totalPrice < selectedCoupon.min_order_price
    ) {
      return 0;
    }

    let discount = 0;
    if (selectedCoupon.discount_type === "percentage") {
      discount = (totalPrice * selectedCoupon.discount_value) / 100;
      // 최대 할인 금액 제한 적용
      if (
        selectedCoupon.max_discount_price &&
        discount > selectedCoupon.max_discount_price
      ) {
        discount = selectedCoupon.max_discount_price;
      }
    } else {
      discount = selectedCoupon.discount_value;
    }

    // 상품 가격보다 할인이 클 경우 처리
    return Math.min(discount, totalPrice);
  };

  const discountAmount = calculateDiscount();
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("선택된 상품이 없습니다.");
      return;
    }

    const query = new URLSearchParams();
    selectedItems.forEach((id) => query.append("itemIds", id));

    // 유효한 effectiveCouponId만 쿼리에 포함
    if (effectiveCouponId) {
      query.append("couponId", effectiveCouponId);
    }
    router.push(`/mypage/myCart/checkout?${query.toString()}`);
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems?.map((item) => item.id) ?? []);
    }
  };

  const handleDelSelectCart = () => {
    selectedItems.forEach((id) => deleteMutate(id));
    setSelectedItems([]);
    router.refresh();

    setIsModal(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-gray-600">
        <LoaderCircle size={48} className="animate-spin mb-4" />
        <p className="text-sm">장바구니 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-4">장바구니</h1>

      {cartItems &&
        (cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600">
            <PackageX size={48} className="mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              장바구니가 비어 있습니다
            </h3>
            <p className="text-sm mb-6">
              마음에 드는 상품을 장바구니에 담아보세요.
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
          <div className="flex sm:flex-row flex-col gap-4">
            <div className="flex flex-col gap-8 mb-6 flex-1">
              <ul className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-4 border p-3 rounded bg-gray-50">
                  <div
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      onChange={() => toggleSelectAll()}
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                      checked={selectedItems.length === cartItems?.length}
                    />
                    <span className="text-sm text-gray-800 font-medium">
                      전체 선택 ({selectedItems.length} /{" "}
                      {cartItems?.length ?? 0})
                    </span>
                  </div>

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

                {cartItems.map((item) => {
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between border p-3 rounded"
                    >
                      <div className="flex items-start gap-3 justify-between w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 mr-2 my-auto cursor-pointer"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                          />

                          <div className="flex items-center gap-4">
                            {item.product?.image_url ? (
                              <Image
                                width={144}
                                height={144}
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded cursor-pointer"
                                onClick={() =>
                                  router.push(`/products/${item.product?.id}`)
                                }
                              />
                            ) : (
                              <div className="flex w-32 h-32 flex-col gap-2 items-center justify-center bg-gray-100 rounded">
                                <ImageOff size={40} className="text-gray-400" />
                                <p className="text-gray-500 text-sm text-center">
                                  이미지가 없습니다.
                                </p>
                              </div>
                            )}

                            <div className="flex flex-col gap-2">
                              <button
                                className="cursor-pointer hover:underline text-left"
                                type="button"
                                onClick={() =>
                                  router.push(`/products/${item.product?.id}`)
                                }
                              >
                                <span className="font-semibold">
                                  {item.product?.name}
                                </span>
                              </button>

                              <CartItemOptions options={item.options} />

                              <p className="text-sm text-gray-500">
                                ₩{(item.product?.price ?? 0).toLocaleString()}
                              </p>

                              <div className="flex items-center gap-2 mt-auto">
                                <button
                                  className="w-8 h-8 border rounded bg-white hover:bg-gray-400 transition-all cursor-pointer"
                                  onClick={() => {
                                    if (item.quantity === 1) {
                                      deleteMutate(item?.id);
                                      router.refresh();
                                      return;
                                    }
                                    mutate({
                                      itemId: item.id,
                                      quantity: item.quantity - 1,
                                    });
                                  }}
                                  disabled={isPending}
                                >
                                  -
                                </button>
                                <span className="min-w-[24px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  className="w-8 h-8 border rounded bg-white hover:bg-gray-400 transition-all cursor-pointer"
                                  onClick={() => {
                                    mutate({
                                      itemId: item.id,
                                      quantity: item.quantity + 1,
                                    });
                                  }}
                                  disabled={isPending}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteMutate(item?.id)}
                          type="button"
                          className="shrink-0 cursor-pointer"
                        >
                          <span className="text-gray-500 underline transition-colors hover:no-underline hover:text-gray-800">
                            삭제
                          </span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-col">
                <div className="border-t p-3 flex items-center justify-between">
                  <h2 className="font-bold">할인쿠폰 적용</h2>
                  <Link
                    href="/mypage/coupon"
                    className="text-[12px] sm:text-sm font-medium text-gray-900 underline underline-offset-4 whitespace-nowrap"
                  >
                    쿠폰함 바로가기 &rarr;
                  </Link>
                </div>

                <ul className="flex flex-col">
                  {(!coupons || coupons.length === 0) && (
                    <li>
                      <p className="p-4 border-b border-t border-gray-200 text-sm text-gray-500">
                        사용 가능한 쿠폰이 없습니다
                      </p>
                    </li>
                  )}

                  {coupons?.map((item) => {
                    const coupon = item.coupon;
                    if (!coupon) return null;

                    const isMinPriceNotMet =
                      coupon.min_order_price &&
                      coupon.min_order_price > 0 &&
                      totalPrice < coupon.min_order_price;

                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 border-b border-gray-200 transition ${
                          isMinPriceNotMet
                            ? "opacity-50 cursor-not-allowed"
                            : `cursor-pointer hover:bg-gray-50 ${
                                effectiveCouponId === item.id
                                  ? "bg-gray-50"
                                  : "bg-white"
                              }`
                        } first:border-t`}
                      >
                        <div className="w-full flex items-center gap-4">
                          <input
                            type="radio"
                            name="selectedCoupon"
                            value={item.id}
                            checked={effectiveCouponId === item.id}
                            onChange={() => {
                              if (isMinPriceNotMet) {
                                toast.error(
                                  `최소 주문 금액(${coupon.min_order_price?.toLocaleString()}원)을 채워야 사용 가능합니다.`,
                                );
                                return;
                              }
                              setSelectedCouponId(item.id);
                            }}
                            disabled={Boolean(isMinPriceNotMet)}
                            className="accent-black"
                          />
                          <div className="w-full flex flex-col gap-1.5">
                            <div className="w-full flex flex-col gap-2">
                              <span className="font-bold text-xl text-gray-900">
                                {coupon.discount_type === "percentage"
                                  ? `${coupon.discount_value}% 할인`
                                  : `${coupon.discount_value.toLocaleString()}원 할인`}
                              </span>

                              <span className="text-sm text-gray-500">
                                {coupon.name}
                              </span>
                            </div>

                            <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 justify-between">
                              <div className="flex items-center gap-2">
                                {coupon.min_order_price &&
                                  coupon.min_order_price > 0 && (
                                    <span>
                                      {coupon.min_order_price.toLocaleString()}
                                      원 이상
                                    </span>
                                  )}
                                {coupon.max_discount_price && (
                                  <span>
                                    (최대{" "}
                                    {coupon.max_discount_price.toLocaleString()}
                                    원 할인)
                                  </span>
                                )}
                              </div>
                              {coupon.expires_at && (
                                <span className="text-gray-400">
                                  ~{" "}
                                  {new Date(
                                    coupon.expires_at,
                                  ).toLocaleDateString()}{" "}
                                  까지
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}

                  <label
                    className={`flex items-center gap-4 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${effectiveCouponId === null ? "bg-gray-50" : "bg-white"}`}
                  >
                    <input
                      type="radio"
                      name="selectedCoupon"
                      checked={effectiveCouponId === null}
                      onChange={() => setSelectedCouponId(null)}
                      className="accent-black"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      쿠폰 사용 안 함
                    </span>
                  </label>
                </ul>
              </div>
            </div>

            <div className="w-full sm:w-[280px] border p-4 flex flex-col gap-3 self-start rounded">
              <p className="text-[22px]">주문 예상 금액</p>

              <div className="flex justify-between items-center text-[16px]">
                <p>총 수량</p>
                <p>
                  <span className="font-bold">{totalQuantity}</span> 개
                </p>
              </div>

              <div className="flex justify-between items-center text-[16px]">
                <p>총 상품 가격</p>
                <p>
                  <span className="font-bold">
                    {totalPrice.toLocaleString()}
                  </span>{" "}
                  원
                </p>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-[16px] text-red-500">
                  <p>할인 금액</p>
                  <p>
                    -{" "}
                    <span className="font-bold">
                      {discountAmount.toLocaleString()}
                    </span>{" "}
                    원
                  </p>
                </div>
              )}

              <hr className="my-2" />

              <p className="text-[20px] text-right font-bold">
                {finalPrice.toLocaleString()}
                <span className="font-normal text-[16px]"> 원</span>
              </p>

              <button
                onClick={handleCheckout}
                type="button"
                className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors cursor-pointer"
              >
                구매하기
              </button>
            </div>
          </div>
        ))}

      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title="선택한 상품을 삭제하시겠습니까?"
        description={`* 선택한 상품이 장바구니에서 삭제됩니다. \n (상품페이지에서 다시 상품을 다시 추가할 수 있습니다.)`}
      >
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsModal(false)}
            className="px-4 py-2 text-gray-600 hover:underline"
          >
            취소
          </button>
          <button
            onClick={handleDelSelectCart}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            삭제
          </button>
        </div>
      </Modal>
    </div>
  );
}
