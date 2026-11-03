"use client";

import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  getFavorite,
  useDeleteFavoriteMutation,
  usePostFavoriteMutation,
} from "@/lib/queries/products";

type Props = {
  productId: string;
};

export default function BookmarkBtn({ productId }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();

  const [isFavorited, setIsFavorited] = useState(false);
  const { mutate: addFavoriteMutate } = usePostFavoriteMutation(user?.id ?? "");
  const { mutate: delFavoriteMutate } = useDeleteFavoriteMutation(
    user?.id ?? "",
  );

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!user?.id) return;
      const favorite = await getFavorite(user.id, productId);
      setIsFavorited(!!favorite);
    };

    fetchFavoriteStatus();
  }, [user?.id, productId]);

  const handleBookmark = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (isFavorited) {
      delFavoriteMutate(productId);
      setIsFavorited(false);
    } else {
      addFavoriteMutate(productId);
      setIsFavorited(true);
    }

    router.refresh();
  };

  return (
    <button
      onClick={handleBookmark}
      title="즐겨찾기"
      className="hover:text-gray-900 hover:bg-gray-100 rounded-full shrink-0 transition-all duration-200 border p-2 border-gray-300"
    >
      <Heart
        className={`w-6 h-6 cursor-pointer ${
          isFavorited
            ? "text-red-500 fill-red-500" // 내부를 연한 빨강으로 채움
            : "text-gray-600 fill-transparent" // 내부 비움
        } fill-current`}
      />
    </button>
  );
}
