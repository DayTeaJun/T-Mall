"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createBrowserSupabaseClient } from "../../lib/config/supabase/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { UserType } from "../../types/user";
import { getMyProfile } from "@/lib/actions/auth";

interface Props {
  user: UserType | null;

  children: React.ReactNode;
}

// 유저 인증 상태 변경, 이름 변경, 로그인 상태, 토큰 만료 등 이벤트 구독
export default function AuthProvider({ user, children }: Props) {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const { setUser } = useAuthStore();

  useEffect(() => {
    // user prop은 루트 레이아웃의 쿠키 기반 세션 조회 결과라, /products/[id]처럼
    // 정적으로 캐시되는 페이지에서는 "그 HTML이 만들어질 때"의 다른 유저(또는
    // 빌드 시점의 null) 기준으로 굳어있을 수 있다. 실제 브라우저 세션(로컬 저장소
    // 읽기라 서버 왕복 없음)과 비교해 다를 때만 진짜 프로필을 다시 불러와 보정한다.
    const syncUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const sessionUserId = session?.user?.id ?? null;

      if (sessionUserId === (user?.id ?? null)) {
        setUser(user ?? null);
        return;
      }

      if (!sessionUserId) {
        setUser(null);
        return;
      }

      const profile = await getMyProfile(sessionUserId);
      setUser({
        id: sessionUserId,
        email: session?.user.email ?? "",
        user_name: profile?.user_name ?? "",
        level: profile?.level ?? 1,
        profile_image_url: profile?.profile_image_url,
        phone: profile?.phone,
        status: profile?.status ?? undefined,
        created_at: profile?.created_at ?? undefined,
        updated_at: profile?.updated_at ?? undefined,
        last_login_at: profile?.last_login_at ?? undefined,
        address: profile?.address ?? undefined,
      });
    };

    syncUser();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  }, [supabase, router, setUser, user]);

  return children;
}
