"use server";

import { Database } from "../types_db";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";

// Server Component(page.tsx, layout.tsx 등 렌더링 트리)에서만 사용.
// 이 시점엔 응답 본문을 그리는 중이라 Next.js가 쿠키를 읽기 전용으로 강제함 —
// set/remove를 시도해도 항상 에러이므로 아예 아무 것도 하지 않음.
// 세션 갱신은 middleware.ts(updateSession)가 매 요청마다 먼저 처리해준다.
export const createServerSupabaseClient = async (admin: boolean = false) => {
  const cookieStore: ReadonlyRequestCookies = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    admin
      ? process.env.NEXT_SUPABASE_SERVICE_ROLE!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Server Component에서는 쿠키를 쓸 수 없음 — middleware가 세션 갱신을 담당
        },
        remove() {
          // 위와 동일
        },
      },
    },
  );
};

// Server Action(lib/actions/*.ts)과 Route Handler(app/api/*/route.ts)에서만 사용.
// 이 컨텍스트는 응답이 아직 확정되기 전이라 쿠키를 실제로 쓸 수 있음 —
// 로그인/로그아웃처럼 세션 쿠키를 직접 심어야 하는 작업은 반드시 이 클라이언트로 생성할 것.
export const createActionSupabaseClient = async (admin: boolean = false) => {
  const cookieStore: ReadonlyRequestCookies = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    admin
      ? process.env.NEXT_SUPABASE_SERVICE_ROLE!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error("세션 쿠키 저장 실패:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.error("세션 쿠키 삭제 실패:", error);
          }
        },
      },
    },
  );
};

// 어드민 api 사용하도록 별도 함수 설정 — 항상 Server Action/Route Handler에서만 호출됨
export const createServerSupabaseAdminClient = async () => {
  return createActionSupabaseClient(true);
};
