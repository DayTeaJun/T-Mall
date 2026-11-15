"use client";

import React, { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";

function PasswordForm() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const supabase = createBrowserSupabaseClient();

  const disabled =
    !currentPassword ||
    !newPassword ||
    !newPasswordConfirm ||
    newPassword !== newPasswordConfirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      toast.warning("모든 항목을 입력해주세요.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      if (
        updateError.message ===
        "New password should be different from the old password."
      ) {
        toast.error("이전 비밀번호와 일치합니다.");
      } else if (
        updateError.message === "Password should be at least 6 characters."
      ) {
        toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      } else {
        toast.error(updateError.message);
      }
    } else {
      router.push("/mypage/profile");
      toast.success("비밀번호가 성공적으로 변경되었습니다.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 max-w-[500px] w-full"
    >
      <div className="flex items-center gap-4">
        <p className="w-[100px] sm:w-[120px] shrink-0 text-sm text-gray-600">
          아이디(이메일)
        </p>
        <p className="flex-1 p-2 text-sm">{user?.email}</p>
      </div>

      <div className="flex items-center gap-4">
        <label className="w-[100px] sm:w-[120px] shrink-0 text-sm text-gray-600">
          현재 비밀번호
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="w-[100px] sm:w-[120px] shrink-0 text-sm text-gray-600">
          새 비밀번호
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="w-[100px] sm:w-[120px] shrink-0 text-sm text-gray-600">
          새 비밀번호 확인
        </label>
        <input
          type="password"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          className="w-full p-2 border border-gray-300 text-sm"
        />
      </div>

      <span
        className={`ml-[120px] text-[12px] h-[18px] ${
          newPasswordConfirm.length > 0
            ? newPassword === newPasswordConfirm
              ? "text-green-500"
              : "text-red-500"
            : "text-gray-400"
        }`}
      >
        {newPasswordConfirm.length > 0 &&
          (newPassword === newPasswordConfirm
            ? "비밀번호가 일치합니다."
            : "비밀번호가 일치하지 않습니다.")}
      </span>

      <button
        type="submit"
        disabled={disabled}
        className={`w-fit ml-auto px-6 py-2 text-[14px] font-bold transition-all duration-200 ease-in-out text-white ${
          disabled
            ? "bg-gray-400 !cursor-default"
            : "bg-gray-500 hover:bg-gray-600"
        }`}
      >
        비밀번호 변경
      </button>
    </form>
  );
}

export default PasswordForm;
