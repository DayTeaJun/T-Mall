"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useInquiryStore } from "@/lib/store/useInquiryStore";
import { unlockInquirySecret } from "@/lib/queries/inquiry";

interface InquiryType {
  id: number;
  inquiry_type: string;
  title: string;
  guest_name: string | null;
  status: string | null;
  is_public: boolean | null;
  is_locked: boolean;
  is_guest_post: boolean;
  user_id: string | null;
}

interface InquiryRowProps {
  inquiry: InquiryType;
  displayIndex: number;
  inquiryTypeLabel: string;
  isMobileContainer?: boolean;
}

export default function InquiryRow({
  inquiry,
  displayIndex,
  inquiryTypeLabel,
  isMobileContainer = false,
}: InquiryRowProps) {
  const { setPendingPassword } = useInquiryStore();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const isSecret = inquiry.is_public === false;

  const maskName = (name: string | null) => {
    if (!name) return "";
    const trimmed = name.trim();
    if (trimmed.length <= 1) return trimmed;
    if (trimmed.length === 2) return `${trimmed[0]}*`;
    return `${trimmed[0]}${"*".repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
  };

  const handleRowClick = () => {
    if (!inquiry.is_locked) {
      router.push(`/inquiry/${inquiry.id}`);
      return;
    }

    if (inquiry.is_guest_post) {
      setIsModalOpen(true);
    } else {
      toast.warning("회원 비밀글은 작성자와 관리자만 확인 가능합니다.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      toast.warning("비밀번호를 입력해주세요.");
      return;
    }

    setIsUnlocking(true);
    try {
      const unlocked = await unlockInquirySecret(
        inquiry.id,
        passwordInput.trim(),
      );

      if (!unlocked) {
        toast.warning("비밀번호가 일치하지 않습니다.");
        return;
      }

      setPendingPassword(inquiry.id, passwordInput.trim());
      setIsModalOpen(false);
      setPasswordInput("");
      router.push(`/inquiry/${inquiry.id}`);
    } catch {
      toast.error("비밀번호 확인 중 오류가 발생했습니다.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPasswordInput("");
  };

  const renderPasswordModal = () => {
    if (!isModalOpen) return null;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          closeModal();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 cursor-default"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white p-6 rounded-sm shadow-xl w-[calc(100%-2rem)] max-w-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-150 text-left"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Lock size={18} className="text-gray-700" />
            비밀인증
          </h3>
          <p className="text-xs text-gray-400 mb-5 leading-normal whitespace-pre-wrap">
            {
              "이 글은 비공개 문의입니다.\n작성 시 설정한 비밀번호 4자리를 입력해주세요."
            }
          </p>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="비밀번호 입력"
              value={passwordInput}
              onChange={(e) =>
                setPasswordInput(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-full border border-gray-200 p-2.5 text-sm outline-none focus:border-black rounded-sm text-black text-center tracking-widest font-mono"
              autoFocus
            />
            <div className="flex gap-2 justify-end text-sm font-medium pt-1">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-200 text-gray-500 rounded-sm hover:bg-gray-50 hover:text-black transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isUnlocking}
                className="px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {isUnlocking ? "확인 중..." : "확인"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isMobileContainer) {
    return (
      <div
        onClick={handleRowClick}
        className="py-4 px-2 flex flex-col gap-1.5 active:bg-gray-50 cursor-pointer bg-white"
      >
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded-xs text-[10px] text-gray-600 font-sans">
              {inquiryTypeLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-gray-900 font-medium text-sm w-full">
          <span className="truncate flex-1 min-w-0">{inquiry.title}</span>

          <div className="flex items-center gap-2 shrink-0 select-none">
            {inquiry.status === "ANSWERED" ? (
              <span className="text-green-600 font-semibold text-[12px] bg-green-50 px-1.5 py-0.5 rounded-xs">
                답변완료
              </span>
            ) : (
              <span className="text-gray-400 font-semibold text-[12px] bg-gray-50 px-1.5 py-0.5 rounded-xs">
                답변대기
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-400 flex gap-2 items-center">
          <span>{maskName(inquiry.guest_name)}</span>
          {isSecret && (
            <>
              {"|"} <Lock size={12} className="text-gray-400 shrink-0" />
            </>
          )}
        </div>

        {renderPasswordModal()}
      </div>
    );
  }

  return (
    <tr
      onClick={handleRowClick}
      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors group cursor-pointer"
    >
      <td className="py-4 px-2 font-semibold text-center text-gray-400 text-xs sm:text-sm">
        {displayIndex}
      </td>
      <td className="py-4 px-2 text-center text-gray-600 font-medium">
        <span className="bg-gray-100 px-2 py-1 rounded-sm text-[11px] sm:text-xs text-gray-700 whitespace-nowrap">
          {inquiryTypeLabel}
        </span>
      </td>
      <td className="py-4 px-2 font-medium text-gray-900 max-w-[180px] sm:max-w-none">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate group-hover:text-black transition-colors">
            {inquiry.title}
          </span>
          {isSecret && <Lock size={13} className="text-gray-400 shrink-0" />}
        </div>
      </td>
      <td className="py-4 px-2 text-gray-600 text-center truncate text-xs sm:text-sm">
        {maskName(inquiry.guest_name)}
      </td>
      <td className="py-4 px-2 text-center whitespace-nowrap relative">
        {inquiry.status === "ANSWERED" ? (
          <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-sm text-[11px] sm:text-xs">
            답변완료
          </span>
        ) : (
          <span className="text-gray-500 font-semibold bg-gray-50 px-2 py-0.5 rounded-sm text-[11px] sm:text-xs">
            답변대기
          </span>
        )}
        {renderPasswordModal()}
      </td>
    </tr>
  );
}
