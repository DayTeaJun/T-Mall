"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, LockKeyhole } from "lucide-react";

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("잘못된 접근입니다. 비밀번호 재설정 페이지로 이동합니다.");
      router.replace("/find-password");
      return;
    }

    const qError = searchParams.get("error_code");
    const hError =
      typeof window !== "undefined" &&
      window.location.hash.includes("error_code=otp_expired");

    if (qError === "otp_expired" || hError) {
      setExpired(true);
      toast.error("비밀번호 재설정 링크가 만료되었습니다.");
    }
  }, [email, searchParams, router]);

  const isFormValid =
    newPassword.length >= 6 && newPassword === confirmPassword;

  const handleResend = async () => {
    if (!email) return;
    setResending(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/reset-password?email=${encodeURIComponent(email)}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setResending(false);

    if (error) {
      toast.error(`재전송 실패: ${error.message}`);
    } else {
      toast.success("재설정 링크를 다시 보냈습니다. 받은 편지함을 확인하세요.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);

    if (error) {
      if (error.message?.includes("Auth session missing")) {
        toast.error(
          "인증 세션이 만료되었습니다. 다시 로그인 후 시도해 주세요.",
        );
      } else if (error.message?.includes("New password should be different")) {
        toast.error("새 비밀번호는 이전 비밀번호와 달라야 합니다.");
      } else {
        toast.error(`비밀번호 변경 실패: ${error.message}`);
      }
      console.error("비밀번호 변경 실패:", error);
    } else {
      toast.success("비밀번호가 성공적으로 변경되었습니다.");
      router.replace("/signin");
    }
  };

  if (expired) {
    return (
      <div className="flex flex-col p-5 max-w-[500px] w-full text-center">
        <div className="rounded-lg border border-gray-200 bg-white p-8 flex flex-col items-center gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-base font-bold text-gray-800">
              만료된 링크입니다
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              보안을 위해 재설정 링크가 만료되었습니다. <br />
              아래 버튼을 눌러 재설정 이메일을 다시 받아주세요.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className={`w-full p-3 rounded-md font-bold text-sm transition-all ${
              resending
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {resending ? "이메일 재전송 중..." : "재설정 이메일 받기"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleResetPassword}
      className="flex flex-col p-5 max-w-[500px] w-full gap-6"
    >
      <div className="flex gap-2 items-center border border-gray-100 mt-2">
        <label htmlFor="password" className="bg-gray-50 p-3">
          <Lock size={20} className="text-gray-400" />
        </label>
        <input
          id="password"
          placeholder="새 비밀번호 (6자 이상)"
          className="border-none outline-0 px-2 w-full text-sm"
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={expired}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="p-3"
          disabled={expired}
        >
          {showPassword ? (
            <Eye size={20} className="text-gray-400" />
          ) : (
            <EyeOff size={20} className="text-gray-400" />
          )}
        </button>
      </div>

      <div className="flex gap-2 items-center border border-gray-100">
        <label htmlFor="passwordConfirm" className="bg-gray-50 p-3">
          <LockKeyhole size={20} className="text-gray-400" />
        </label>
        <input
          id="passwordConfirm"
          placeholder="비밀번호 확인"
          className="border-none outline-0 px-2 w-full text-sm"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={expired}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="p-3"
          disabled={expired}
        >
          {showConfirmPassword ? (
            <Eye size={20} className="text-gray-400" />
          ) : (
            <EyeOff size={20} className="text-gray-400" />
          )}
        </button>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || isLoading || expired}
        className={`p-3 rounded-md font-bold transition-all ${
          !isFormValid || isLoading || expired
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {isLoading ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
