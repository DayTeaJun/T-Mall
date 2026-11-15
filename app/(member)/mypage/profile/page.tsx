"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useMyProfileQuery } from "@/lib/queries/auth";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { withdrawalUser } from "@/lib/actions/auth";
import Modal from "@/components/common/modal/Modal";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import { getUserLevelLabel } from "@/lib/utils";

// --- Types ---
interface UserProfileData {
  id: string;
  user_name: string | null;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  level?: number;
}

interface AuthUser {
  id: string;
  email?: string;
  address?: string;
}

interface ProfileDetailProps {
  data: UserProfileData;
  user: AuthUser | null;
  router: AppRouterInstance;
  onDelete: () => void;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  className?: string;
}

// --- Components ---

export default function ProfilePage() {
  const [isModal, setIsModal] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const { data, isLoading } = useMyProfileQuery(user?.id);

  if (!data || isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        <p>프로필 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  const handlePasswordReset = () => {
    if (user?.email === "testuser@tmall.com") {
      toast.error("테스트 계정은 비밀번호 재설정을 할 수 없습니다.");
      return;
    }
    router.push("/mypage/profile/reset-password");
  };

  const handleDelete = async () => {
    if (user?.email === "testuser@tmall.com") {
      toast.error("테스트 계정은 탈퇴할 수 없습니다.");
      return;
    }

    const withrawal = await withdrawalUser();
    if (withrawal) {
      toast.success("성공적으로 회원 탈퇴되었습니다.");
      router.push("/");
    } else {
      toast.error("회원 탈퇴에 실패하였습니다. 관리자에게 문의 주세요");
    }
    setIsModal(false);
  };

  return (
    <section className="w-full flex flex-col gap-4">
      <h2 className="text-xl font-bold">내 정보 관리</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 bg-gray-50 overflow-hidden">
        {/* 왼쪽 섹션 */}
        <section className="col-span-1 flex flex-col gap-4 p-4">
          <div className="border border-gray-200 bg-white p-6 flex flex-col items-center text-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 mb-4 shadow-sm bg-gray-100">
              {data?.profile_image_url ? (
                <Image
                  fill
                  sizes="128px"
                  src={data.profile_image_url}
                  alt={data.user_name || "Profile"}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <UserIcon size={48} />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {data.user_name || "이름 없음"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{data.email}</p>
            <span className="px-4 py-1 rounded-full text-xs font-bold bg-black text-white">
              {getUserLevelLabel(data?.level)}
            </span>
          </div>

          {/* 모바일 뷰 상세 정보 */}
          <div className="block sm:hidden">
            <ProfileDetailSection
              data={data as UserProfileData}
              user={user as AuthUser}
              router={router}
              onDelete={() => setIsModal(true)}
            />
          </div>

          <div className="border border-gray-200 bg-white p-4 flex flex-col">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <ShieldCheck size={18} className="text-blue-500" />
              계정 보안
            </h4>
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePasswordReset}
                className="w-full py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={14} /> 비밀번호 재설정
              </button>
            </div>
          </div>
        </section>

        {/* 데스크톱 뷰 상세 정보 */}
        <section className="hidden sm:flex col-span-2 flex-col gap-6 p-4 pl-0">
          <ProfileDetailSection
            data={data as UserProfileData}
            user={user as AuthUser}
            router={router}
            onDelete={() => setIsModal(true)}
          />
        </section>
      </div>

      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title="정말 탈퇴하시겠습니까?"
        description={`* 회원 정보는 모두 삭제되며 복구할 수 없습니다.\n(등록한 댓글 및 기록들은 자동으로 삭제되지 않습니다.)`}
      >
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsModal(false)}
            className="px-4 py-2 text-gray-600 hover:underline"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            탈퇴하기
          </button>
        </div>
      </Modal>
    </section>
  );
}

function ProfileDetailSection({
  data,
  user,
  router,
  onDelete,
}: ProfileDetailProps) {
  return (
    <div className="border border-gray-200 bg-white p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 pb-2 border-b">
        <h4 className="text-lg font-bold text-gray-800">상세 프로필 정보</h4>
        <button
          onClick={() => router.push("/mypage/profile/edit")}
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          정보 수정하기
        </button>
      </div>

      <div className="flex flex-col gap-6 h-full justify-between">
        <div className="grid grid-cols-1 gap-6">
          <InfoRow
            icon={<UserIcon size={16} />}
            label="이름"
            value={data.user_name}
          />
          <InfoRow
            icon={<Mail size={16} />}
            label="이메일 주소"
            value={data.email}
          />
          <InfoRow
            icon={<Phone size={16} />}
            label="연락처"
            value={data.phone ? data.phone.split("-").join(" - ") : null}
          />
          <InfoRow
            icon={<MapPin size={16} />}
            label="기본 배송지"
            value={user?.address}
          />
        </div>

        <div className="mt-auto pt-6 flex sm:flex-row flex-col justify-between items-end sm:items-center gap-4 border-t">
          <span className="text-[10px] sm:text-[11px] text-gray-400">
            더 이상 서비스를 이용하지 않으시나요?
          </span>
          <button
            onClick={onDelete}
            className="text-red-500 font-bold text-xs hover:underline whitespace-nowrap"
          >
            회원 탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, className }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-4 gap-1 sm:gap-1.5 items-start">
      <div className="flex gap-2 text-gray-400 items-center sm:mt-1">
        {icon}
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">
          {label}
        </span>
      </div>

      <p
        className={`${className || ""} sm:col-span-3 text-[13px] sm:text-[14px] font-medium text-gray-700 leading-relaxed pl-6 sm:pl-0`}
      >
        {value || "등록된 정보가 없습니다."}
      </p>
    </div>
  );
}
