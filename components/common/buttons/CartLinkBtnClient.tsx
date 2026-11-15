"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  cartCount: number;
  isLoggedIn: boolean;
};

export default function CartLinkBtnClient({ cartCount, isLoggedIn }: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (isLoggedIn) {
      router.push("/mypage/my-cart");
    } else {
      toast.error("로그인이 필요합니다.");
      router.push("/signin?redirectTo=/mypage/my-cart");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="cursor-pointer p-1 relative"
      aria-label="장바구니로 이동"
    >
      <ShoppingCart size={20} />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none font-bold">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
}
