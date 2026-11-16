"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User as UserIcon,
  ShieldCheck,
  Loader2,
  Clock,
  UserCog,
} from "lucide-react";
import UserOrderLists from "./UserOrderLists";
import {
  useGetProfileQuery,
  usePatchUserActiveMutation,
} from "@/lib/queries/admin";
import { toast } from "sonner";
import Modal from "@/components/common/modal/Modal";
import Image from "next/image";
import { getUserLevelLabel } from "@/lib/utils";

export default function UserDetailClient({ userId }: { userId: string }) {
  const { data: user, isLoading, isError } = useGetProfileQuery(userId);
  const { mutate } = usePatchUserActiveMutation(userId);
  const [isModal, setIsModal] = useState(false);

  const handleUserActiveToggle = () => {
    if (!user?.id) {
      toast.error("유저 정보를 찾을 수 없습니다.");
      return;
    }
    mutate(user.status === "suspended" ? "active" : "suspended");
    setIsModal(false);
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
        <Loader2 className="animate-spin" size={40} />
        <p>고객 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-bold">
          사용자를 찾을 수 없거나 에러가 발생했습니다.
        </p>
        <Link href="/manage/user" className="text-sm underline text-gray-500">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Link
          href="/manage/user"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold">고객 상세 정보</h2>
      </div>

      <div className="flex flex-col sm:grid grid-cols-3 w-full min-h-full bg-gray-50">
        <section className="col-span-1 flex flex-col gap-6 p-4 sm:pr-2">
          <div className="border border-gray-200 bg-white p-4 flex flex-col items-center text-center ">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 mb-4 shadow-md bg-gray-100">
              {user.profile_image_url ? (
                <Image
                  fill
                  sizes="128px"
                  src={user.profile_image_url}
                  alt={user.user_name || "Profile"}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <UserIcon size={48} />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {user.user_name || "이름 없음"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{user.email}</p>
            <span
              className={`px-4 py-1 rounded-full text-xs font-bold ${
                (user.level ?? 0) >= 2
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {getUserLevelLabel(user?.level)}
            </span>
          </div>

          <div className="border border-gray-200 bg-white p-4 flex flex-col ">
            <h4 className="text-lg font-bold text-gray-800 mb-6 pb-2 border-b">
              기본 정보
            </h4>
            <div className="flex flex-col gap-4">
              <InfoRow
                icon={<UserIcon size={16} />}
                label="이름"
                value={user.user_name}
              />
              <InfoRow
                icon={<UserCog size={16} />}
                label="고유 ID"
                value={user.id}
              />
              <InfoRow
                icon={<Mail size={16} />}
                label="이메일 주소"
                value={user.email}
              />
              <InfoRow
                icon={<Phone size={16} />}
                label="연락처"
                value={user.phone}
              />

              <InfoRow
                icon={<Clock size={16} />}
                label="최근 접속일"
                value={
                  user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString("ko-KR")
                    : "접속 기록 없음"
                }
              />

              <InfoRow
                icon={<ShieldCheck size={16} />}
                label="계정 상태"
                className={`${user.status === "active" ? "" : user.status === "suspended" ? "text-red-500" : user.status === "withdrawn" ? "text-gray-500" : "text-gray-400"}`}
                value={
                  user.status === "active"
                    ? "정상"
                    : user.status === "suspended"
                      ? "계정 정지"
                      : user.status === "withdrawn"
                        ? "탈퇴 계정"
                        : "확인 불가"
                }
              />
            </div>

            <div className="mt-10">
              <h4 className="text-lg font-bold text-gray-800 mb-6 pb-2 border-b">
                배송 정보
              </h4>
              <div className="space-y-6">
                <InfoRow
                  icon={<MapPin size={16} />}
                  label="주소지"
                  value={
                    user?.address
                      ? user.address
                      : "등록된 기본 배송지가 없습니다."
                  }
                />
              </div>
            </div>

            <div className="mt-12 pt-6 border-t flex flex-col gap-3">
              <button
                className="px-6 py-2.5 border border-red-100 text-red-500 rounded-lg font-bold text-sm hover:bg-red-50 transition-all"
                onClick={() => setIsModal(true)}
              >
                {user.status === "suspended"
                  ? "계정 활동 제한 해제"
                  : "계정 활동 제한"}
              </button>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-4 flex flex-col">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500" />
              계정 타임라인
            </h4>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>최초 가입일</span>
                <span className="font-medium text-gray-900">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>최근 수정일</span>
                <span className="font-medium text-gray-900">
                  {user.updated_at
                    ? new Date(user.updated_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <UserOrderLists userId={userId} />
      </div>

      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title={
          user.status === "suspended" ? "계정 활동 제한 해제" : "계정 활동 제한"
        }
        description="(* 계정 활동 제한 시, 해당 유저는 로그인 및 서비스 이용이 불가능해집니다. 제한 해제 시 정상적으로 이용할 수 있습니다.)"
        onConfirm={handleUserActiveToggle}
        confirmText={
          user.status === "suspended" ? "계정 활동 제한 해제" : "계정 활동 제한"
        }
      />
    </div>
  );
}

function InfoRow({
  icon,
  className,
  label,
  value,
}: {
  icon: React.ReactNode;
  className?: string;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 items-start">
      <div className="flex gap-2 text-gray-400 items-center sm:mt-1 shrink-1">
        {icon}
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">
          {label}
        </span>
      </div>

      <p
        className={`${className || ""} text-[13px] sm:text-[14px] font-medium text-gray-700 leading-relaxed pl-6`}
      >
        {value || "등록된 정보가 없습니다."}
      </p>
    </div>
  );
}
