"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  Home,
  MessageCircleQuestion,
  Settings,
  ShoppingCart,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useProductAllCart } from "@/lib/queries/products";
import { useChatUnread } from "@/hooks/useChatUnread";
import ChattingModal from "./chat/ChattingModal";

export default function MobileBottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: cartItems } = useProductAllCart(user?.id ?? "");
  const { unreadCount, markOpen } = useChatUnread();
  const [isChatting, setIsChatting] = useState(false);

  const cartCount = cartItems?.length ?? 0;

  const isMyPage =
    pathname.startsWith("/mypage") && !pathname.startsWith("/mypage/my-cart");
  const isCart = pathname.startsWith("/mypage/my-cart");
  const isHome = pathname === "/";
  const isBookmark = pathname.startsWith("/mypage/bookmark");
  const isAdminRoute = pathname.startsWith("/manage");
  const isAdmin = user?.level === 3;

  const handleChatClick = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      router.push("/signin");
      return;
    }
    const next = !isChatting;
    setIsChatting(next);
    await markOpen(next);
  };

  const tabClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] ${
      active ? "text-green-600" : "text-gray-500"
    }`;

  return (
    <>
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-white border-t border-gray-200 pt-1"
        style={{
          paddingBottom: "calc(0.25rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Link href="/" className={tabClass(isHome)}>
          <Home size={20} />
        </Link>

        {isAdmin ? (
          <Link href="/manage/dashboard" className={tabClass(isAdminRoute)}>
            <Settings size={20} />
          </Link>
        ) : (
          <Link href="/mypage/bookmark" className={tabClass(isBookmark)}>
            <Heart size={20} />
          </Link>
        )}

        <Link href="/mypage/my-cart" className={tabClass(isCart)}>
          <span className="relative">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </span>
        </Link>

        <button
          type="button"
          onClick={handleChatClick}
          className={tabClass(isChatting)}
        >
          <span className="relative">
            <MessageCircleQuestion size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
        </button>

        <Link href="/mypage" className={tabClass(isMyPage)}>
          <User size={20} />
        </Link>
      </nav>

      {isChatting && (
        <ChattingModal fullScreen onClose={() => setIsChatting(false)} />
      )}
    </>
  );
}
