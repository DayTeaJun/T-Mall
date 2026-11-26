"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check } from "lucide-react";

type Step = "input" | "success";

function FindIdForm() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("input");

  const isFormValid = username.trim().length > 0 && phone.trim().length >= 10;

  const formatPhone = (value: string) => {
    if (value.length !== 11) return value;
    return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    const formattedPhone = formatPhone(phone);

    try {
      const res = await fetch("/api/auth/find-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          phone: formattedPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("입력한 정보와 일치하는 계정이 없습니다.");
        return;
      }

      setFoundId(data.maskedEmail);
      setStep("success");
    } catch {
      toast.error("요청 처리 중 문제가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "success" && foundId) {
    return (
      <div className="flex flex-col items-center px-4 max-w-[500px] w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
          <Check size={32} className="text-green-600" />
        </div>

        <p className="text-base font-bold text-gray-800 mb-2">
          아이디 찾기 완료
        </p>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          입력하신 정보와 일치하는 회원 정보를 확인했습니다. <br />
          보안을 위해 일부 글자는 마스킹 처리되어 표시됩니다.
        </p>

        <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-6 mb-8 flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            가입된 이메일 아이디
          </span>
          <span className="text-lg font-bold text-gray-800 break-all select-all">
            {foundId}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 text-sm font-medium text-gray-500 w-full mb-8">
          <Link
            href="/signin"
            className="hover:text-green-600 transition-colors"
          >
            로그인하기
          </Link>
          <span className="w-px h-3 bg-gray-200" />
          <Link
            href="/find-password"
            className="hover:text-gray-800 transition-colors"
          >
            비밀번호 찾기
          </Link>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
          * 전체 아이디 확인이 필요하거나 로그인이 불가능한 경우 <br />
          고객센터로 문의해 주시기 바랍니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-[32px] font-bold">Find your ID</p>

      <p className="text-[13px] text-gray-500">
        사용자명과 휴대폰 번호를 입력해주세요.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col p-5 max-w-[500px] w-full gap-4"
      >
        <input
          type="text"
          placeholder="사용자명"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-3 rounded-md"
        />

        <input
          type="tel"
          placeholder="휴대폰 번호 (숫자만 입력)"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
          className="border p-3 rounded-md"
        />

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`p-3 rounded-md font-bold ${
            isFormValid ? "bg-green-600 text-white" : "bg-gray-300 text-white"
          }`}
        >
          아이디 찾기
        </button>
      </form>

      <Link href="/signin" className="text-[14px] underline">
        Cancel
      </Link>
    </>
  );
}

export default FindIdForm;
