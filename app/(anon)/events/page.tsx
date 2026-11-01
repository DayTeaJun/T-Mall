"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, Ticket, Check } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useGetIsCouponDownloaded } from "@/lib/queries/coupon";
import { queryClient } from "@/components/providers/ReactQueryProvider";

export default function EventPage() {
  const supabase = createBrowserSupabaseClient();
  const { user } = useAuthStore();
  const { data: coupons } = useGetIsCouponDownloaded(
    user?.id || "",
    "SS26SPEC",
  );

  const isDownloaded = Boolean(user && coupons !== null);

  interface CouponResponse {
    success: boolean;
    message: string;
  }

  const handleDownloadCoupon = async (couponCode: string) => {
    const { data, error } = await supabase.rpc("download_coupon", {
      p_coupon_code: couponCode.trim(),
    });

    if (error || !data) {
      toast.error("오류가 발생했습니다.");
      return;
    }

    const result = data as unknown as CouponResponse;

    if (result.success) {
      toast.success(result.message);
      await queryClient.invalidateQueries({
        queryKey: ["isCouponDownloaded", user?.id || "", couponCode],
      });
    } else {
      toast.warning(result.message);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold tracking-wide mb-3">
          <Sparkles size={14} /> SPECIAL PROMOTION
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          2026 S/S 시즌 단독 특가 기획전
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          기간 한정 특가 상품들과 특별 할인 쿠폰 혜택을 놓치지 마세요!
        </p>
      </div>

      <div className="relative w-full h-[220px] sm:h-[380px] rounded-2xl overflow-hidden shadow-md mb-10">
        <Image
          src="/main_2.jpg"
          alt="이벤트 메인 이미지"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-6 sm:p-8 mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Ticket size={28} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold">
              전 품목 10% 할인 쿠폰팩
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
              지금 다운로드하고 즉시 결제 시 사용해 보세요. (유효기간:
              2026.04.30까지)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleDownloadCoupon("SS26SPEC")}
          disabled={isDownloaded}
          className={`w-full sm:w-auto px-6 py-3 font-bold rounded-xl transition-colors text-sm sm:text-base whitespace-nowrap shadow-sm flex items-center justify-center gap-2 ${
            isDownloaded
              ? "bg-gray-700 text-gray-300 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
          }`}
        >
          {isDownloaded ? (
            <>
              <Check size={18} /> 쿠폰 다운로드 완료
            </>
          ) : (
            "쿠폰 다운로드 받기"
          )}
        </button>
      </div>

      <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50 text-xs sm:text-sm text-gray-500 leading-relaxed">
        <h4 className="font-bold text-gray-800 mb-2">💡 이벤트 유의사항</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>본 이벤트는 회원 전용 혜택입니다.</li>
          <li>다운로드한 쿠폰은 마이페이지에서 확인하실 수 있습니다.</li>
          <li>
            이벤트 기간 내에 사용하지 않은 쿠폰은 기간 만료 시 자동 소멸됩니다.
          </li>
        </ul>
      </div>

      <div className="text-center mt-10">
        <Link
          href="/category?type=전체&sub=특가/할인&page=1"
          className="inline-block text-sm font-semibold text-gray-700 hover:text-black underline underline-offset-4"
        >
          &larr; 특가 상품 전체 보러 가기
        </Link>
      </div>
    </main>
  );
}
