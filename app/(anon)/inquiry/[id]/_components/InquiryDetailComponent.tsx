"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useInquiryStore } from "@/lib/store/useInquiryStore";
import { toast } from "sonner";
import CommentSection from "./CommentSection";
import {
  unlockInquirySecret,
  useDeleteInquiry,
  useGetInquiryDetail,
} from "@/lib/queries/inquiry";
import Image from "next/image";
import { LockKeyhole } from "lucide-react";

interface InquiryDetailClientProps {
  inquiryId: number;
}

const INQUIRY_TYPE_MAP: Record<string, string> = {
  DELIVERY: "배송",
  PRODUCT: "상품",
  CANCEL: "취소/반품",
  ORDER: "주문/결제",
  OTHER: "기타",
  AUTH: "계정",
};

export default function InquiryDetailComponent({
  inquiryId,
}: InquiryDetailClientProps) {
  const { user } = useAuthStore();

  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const [inputPassword, setInputPassword] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState<
    string | undefined
  >(() => useInquiryStore.getState().consumePendingPassword(inquiryId));
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const isAdmin = user?.level === 3;

  const {
    data: inquiry,
    isLoading,
    isError: error,
  } = useGetInquiryDetail(inquiryId, verifiedPassword);

  const { mutate: handleDeleteInquiry, isPending: isDeleting } =
    useDeleteInquiry(isAdmin);

  if (isLoading)
    return (
      <div className="py-20 text-center text-gray-400 text-sm animate-pulse">
        문의 내용을 불러오는 중...
      </div>
    );

  if (error || !inquiry)
    return (
      <div className="py-20 text-center text-gray-400 text-sm flex flex-col gap-3 items-center">
        <span>존재하지 않거나 삭제된 문의입니다.</span>
        <Link
          href="/inquiry"
          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-sm"
        >
          목록으로 돌아가기
        </Link>
      </div>
    );

  const isOwner = !!(user?.id && inquiry.user_id === user.id);

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();

    if (inquiry.user_id || isAdmin) {
      handleDeleteInquiry({ inquiryId });
    } else {
      if (!deletePassword.trim()) {
        toast.warning("비밀번호를 입력해주세요.");
        return;
      }
      if (deletePassword.trim().length !== 4) {
        toast.warning("비밀번호 숫자 4자리를 입력해주세요.");
        return;
      }

      handleDeleteInquiry({
        inquiryId,
        guestPassword: deletePassword.trim(),
      });
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletePassword("");
  };

  if (inquiry.is_locked) {
    if (!inquiry.is_guest_post) {
      return (
        <div className="max-w-md mx-auto my-20 p-8 border border-gray-100 rounded-sm bg-white shadow-sm flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-5">
            <LockKeyhole size={30} className="text-gray-400" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">
            비공개 문의글입니다
          </h3>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed whitespace-pre-wrap">
            {
              "이 글은 작성자와 관리자만 확인할 수 있는\n회원 비공개 문의사항입니다."
            }
          </p>

          <Link
            href="/inquiry"
            className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors shadow-sm text-center"
          >
            목록으로 돌아가기
          </Link>
        </div>
      );
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!inputPassword.trim()) {
        toast.warning("비밀번호를 입력해주세요.");
        return;
      }

      setIsUnlocking(true);
      try {
        const unlocked = await unlockInquirySecret(
          inquiryId,
          inputPassword.trim(),
        );

        if (!unlocked) {
          toast.error("비밀번호가 일치하지 않습니다.");
          return;
        }

        setVerifiedPassword(inputPassword.trim());
        toast.success("인증되었습니다.");
      } catch {
        toast.error("비밀번호 확인 중 오류가 발생했습니다.");
      } finally {
        setIsUnlocking(false);
      }
    };

    return (
      <div className="max-w-md mx-auto my-20 p-6 border border-gray-100 rounded-sm bg-white shadow-sm flex flex-col items-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">비밀글 열람</h3>
        <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed whitespace-pre-wrap">
          {
            "이 글은 비공개로 문의된 글입니다.\n설정하신 비회원 비밀번호 4자리를 입력해주세요."
          }
        </p>
        <form
          onSubmit={handlePasswordSubmit}
          className="w-full flex flex-col gap-3"
        >
          <input
            type="password"
            maxLength={4}
            inputMode="numeric"
            placeholder="비밀번호 4자리 입력"
            value={inputPassword}
            onChange={(e) =>
              setInputPassword(e.target.value.replace(/[^0-9]/g, ""))
            }
            className="w-full border border-gray-200 px-3 py-2.5 text-sm rounded-sm text-center tracking-widest font-mono focus:outline-none focus:border-black"
            autoFocus
          />
          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {isUnlocking ? "확인 중..." : "확인"}
          </button>
        </form>
      </div>
    );
  }

  const maskName = (name: string | null) => {
    if (!name) return "";
    const trimmed = name.trim();
    if (trimmed.length <= 1) return trimmed;
    if (trimmed.length === 2) return `${trimmed[0]}*`;
    return `${trimmed[0]}${"*".repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
  };

  const inquiryTypeLabel =
    INQUIRY_TYPE_MAP[inquiry.inquiry_type] || inquiry.inquiry_type;

  return (
    <div className="flex flex-col gap-3 h-full relative">
      <div className="w-full flex flex-col border-b border-solid border-gray-200 py-2 gap-3">
        <h2 className="flex gap-2 text-2xl font-bold items-center text-gray-900">
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-sm font-medium whitespace-nowrap">
            {inquiryTypeLabel}
          </span>
          <span className="truncate">{inquiry.title}</span>
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <p className="text-sm text-gray-500 font-medium">
              {maskName(inquiry.guest_name)}
            </p>
            <p className="text-sm text-gray-400">
              {inquiry.created_at
                ? new Date(inquiry.created_at).toLocaleDateString()
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/inquiry"
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 transition-colors font-medium rounded-sm"
            >
              목록보기
            </Link>

            {(isOwner || isAdmin || !inquiry.user_id) && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isDeleting}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 transition-colors font-medium rounded-sm disabled:opacity-50"
              >
                삭제하기
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-solid border-gray-100 min-h-[180px] py-6 flex flex-col gap-6">
        <p className="text-base sm:text-lg whitespace-pre-wrap leading-8 text-gray-800">
          {inquiry.content}
        </p>
      </div>

      {inquiry.image_urls && inquiry.image_urls.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-400 mb-2.5">
            첨부 이미지 ({inquiry.image_urls.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {inquiry.image_urls.map((url: string, index: number) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveImageUrl(url)}
                className="relative w-24 h-24 sm:w-32 sm:h-32 border border-gray-200 rounded-sm overflow-hidden group bg-gray-50 cursor-zoom-in hover:border-gray-400 transition-colors"
              >
                <Image
                  width={96}
                  height={96}
                  src={url}
                  alt={`첨부 이미지 ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <CommentSection inquiry={inquiry} />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-gray-100 rounded-sm p-6 shadow-xl flex flex-col items-center">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              문의글 삭제
            </h3>

            <p className="text-xs text-gray-400 text-center mb-5 leading-relaxed">
              {isAdmin || inquiry.user_id
                ? "정말 이 문의글을 영구히 삭제하시겠습니까?"
                : "비회원 글 삭제를 위해\n설정하셨던 비밀번호 4자리를 입력해주세요."}
            </p>

            <form
              onSubmit={handleConfirmDelete}
              className="w-full flex flex-col gap-3"
            >
              {!inquiry.user_id && !isAdmin && (
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="비밀번호 4자리 입력"
                  value={deletePassword}
                  onChange={(e) =>
                    setDeletePassword(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full border border-gray-200 px-3 py-2 text-sm rounded-sm text-center tracking-widest font-mono focus:outline-none focus:border-black mb-1"
                  autoFocus
                />
              )}

              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-sm hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-600 text-white text-xs font-medium rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "삭제 중..." : "확인"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn"
          onClick={() => setActiveImageUrl(null)}
        >
          <div
            className="relative flex flex-col w-full sm:max-w-xl max-w-2xl h-[80vh] sm:h-[60vh] bg-[#fcfcfc] border border-gray-200 rounded-sm shadow-2xl overflow-hidden cursor-default animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-solid border-gray-100 select-none">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 tracking-tight">
                  첨부 이미지 원본 보기
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveImageUrl(null)}
                className="text-xs text-gray-400 hover:text-black font-medium transition-colors px-2 py-1 rounded-sm hover:bg-gray-50"
              >
                창 닫기 ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-50/50 flex items-center justify-center group">
              <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center">
                <Image
                  fill
                  src={activeImageUrl}
                  alt="첨부 이미지 원본 확대"
                  sizes="(max-w-768px) 100vw, 42rem"
                  priority
                  className="object-contain transition-transform duration-300"
                />
              </div>
            </div>

            <div className="px-4 py-2 bg-white border-t border-solid border-gray-100 flex justify-end">
              <p className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">
                Inquiry Attachment Viewer
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
