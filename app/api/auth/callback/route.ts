import { NextResponse } from "next/server";
import { createActionSupabaseClient } from "@/lib/config/supabase/server/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Open Redirect 방지: "/"로 시작하는 같은 출처의 상대 경로만 허용
  // ("//evil.com" 같은 프로토콜 상대 URL도 브라우저가 외부 사이트로 취급하므로 같이 차단)
  const rawNext = url.searchParams.get("next") || "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/signin?message=${encodeURIComponent(errorDescription || "인증 세션이 만료되었습니다.")}`,
        url.origin,
      ),
    );
  }

  const supabase = await createActionSupabaseClient();

  if (code) {
    try {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        return NextResponse.redirect(
          new URL(
            `/signin?message=${encodeURIComponent("로그인 처리 중 오류가 발생했습니다.")}`,
            url.origin,
          ),
        );
      }
    } catch (error) {
      console.log(error);
      return NextResponse.redirect(new URL("/signin", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
