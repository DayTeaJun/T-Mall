"use client";

import React, { useState } from "react";
import {
  useMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/lib/queries/auth";
import { uploadImageToStorage } from "@/lib/queries/storage";
import { useAuthStore } from "@/lib/store/useAuthStore";
import ImagePreviews from "@/components/common/ImagePreview";
import { ImgPreview } from "@/hooks/useImagePreview";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();

  const { user } = useAuthStore();
  const { data, isLoading } = useMyProfileQuery(user?.id);
  const { mutate: updateProfile, isPending } = useUpdateMyProfileMutation(
    user?.id,
  );

  const [userName, setUserName] = useState(data?.user_name || "");
  const [phone1, setPhone1] = useState(data?.phone.split("-")[0] || "");
  const [phone2, setPhone2] = useState(data?.phone.split("-")[1] || "");
  const [phone3, setPhone3] = useState(data?.phone.split("-")[2] || "");
  const [profileImage, setProfileImage] = useState(
    data?.profile_image_url || "",
  );

  const { imageSrc, imgUrl, onUpload } = ImgPreview();

  const handleProfileImageChange = (file: File) => {
    const uploaded = onUpload(file);
    if (uploaded) {
      setProfileImage("");
    }
    return uploaded;
  };

  const handleSubmit = async () => {
    if (!userName || !user) {
      toast.info("모든 필수 항목을 입력해 주세요.");
      return;
    }
    if (!phone1 || !phone2 || !phone3) {
      toast.info("전화번호를 전부 입력해 주세요.");
      return;
    }

    try {
      const imageUrl = imgUrl
        ? await uploadImageToStorage("avatar", user.id, imgUrl)
        : profileImage || null;

      updateProfile({
        id: user.id,
        phone: `${phone1}-${phone2}-${phone3}`,
        user_name: userName,
        profile_image_url: imageUrl,
      });
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      toast.error("알 수 없는 오류가 발생했습니다.");
    }
  };

  if (isLoading)
    return <div className="p-4 text-gray-400 text-center">로딩 중...</div>;

  return (
    <section className="w-full flex flex-col gap-4">
      <h2 className="text-xl font-bold">회원정보 수정</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 bg-gray-50 overflow-hidden">
        <section className="col-span-1 flex flex-col gap-4 sm:gap-6 p-4">
          <div className="border border-gray-200 bg-white p-6 flex flex-col items-center text-center">
            <ImagePreviews
              variant="circle"
              imageSrc={imageSrc || ""}
              onUpload={handleProfileImageChange}
              editImage={data?.profile_image_url || ""}
            />
            <p className="mt-4 text-xs text-gray-400">
              이미지를 클릭하여 프로필 사진을 변경하세요.
            </p>
          </div>

          <div className="border border-gray-200 bg-white p-4 flex flex-col">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2 text-sm">
              <ShieldCheck size={16} className="text-blue-500" />
              수정 시 주의사항
            </h4>
            <ul className="text-[11px] text-gray-500 space-y-2 list-disc pl-3">
              <li>이름과 연락처는 실제 배송 시 사용됩니다.</li>
              <li>테스트 계정은 이름 수정이 불가능할 수 있습니다.</li>
            </ul>
          </div>
        </section>

        <section className="col-span-2 flex flex-col gap-6 p-4 sm:pl-0">
          <div className="border border-gray-200 bg-white p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8 pb-2 border-b">
              <h4 className="text-lg font-bold text-gray-800">
                상세 정보 수정
              </h4>
            </div>

            <div className="flex flex-col gap-8">
              <EditRow icon={<UserIcon size={16} />} label="이름">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="border-b border-gray-200 py-1 text-sm w-full max-w-[240px] focus:border-black outline-none transition-colors"
                  readOnly={user?.email === "testuser@tmall.com"}
                  placeholder="이름을 입력하세요"
                />
              </EditRow>

              <EditRow icon={<Phone size={16} />} label="연락처">
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    maxLength={3}
                    value={phone1}
                    onChange={(e) =>
                      setPhone1(e.target.value.replace(/\D/g, ""))
                    }
                    className="border-b border-gray-200 py-1 text-sm sm:w-12 w-8 text-center focus:border-black outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="tel"
                    maxLength={4}
                    value={phone2}
                    onChange={(e) =>
                      setPhone2(e.target.value.replace(/\D/g, ""))
                    }
                    className="border-b border-gray-200 py-1 text-sm sm:w-16 w-12 text-center focus:border-black outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="tel"
                    maxLength={4}
                    value={phone3}
                    onChange={(e) =>
                      setPhone3(e.target.value.replace(/\D/g, ""))
                    }
                    className="border-b border-gray-200 py-1 text-sm sm:w-16 w-12 text-center focus:border-black outline-none"
                  />
                </div>
              </EditRow>

              <EditRow icon={<MapPin size={16} />} label="기본 배송지">
                <div className="flex flex-col gap-2 items-start">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {user?.address || "등록된 주소 없음"}
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/mypage/delivery")}
                    className="flex gap-[2px] items-center text-[12px] font-bold text-blue-600 group hover:underline"
                  >
                    <ArrowLeft
                      size={12}
                      className="group-hover:-translate-x-0.5 transition-all duration-300"
                    />{" "}
                    배송지 관리에서 변경하기
                  </button>
                </div>
              </EditRow>
            </div>

            <div className="mt-12 sm:mt-auto pt-6 flex justify-between sm:justify-end items-center gap-3 border-t">
              <button
                type="button"
                onClick={() => router.push("/mypage/profile")}
                className="px-6 py-2 border border-gray-200 text-gray-500 font-bold text-xs hover:bg-gray-50 transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="px-6 py-2 bg-black text-white font-bold text-xs hover:bg-gray-800 transition-all disabled:bg-gray-400"
              >
                {isPending ? "저장 중..." : "수정 완료"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function EditRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-4 gap-2 sm:gap-1.5 items-start">
      <div className="flex gap-2 text-gray-400 items-center sm:mt-1">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">
          {label}
        </span>
      </div>
      <div className="w-full sm:col-span-3 pl-6 sm:pl-0">{children}</div>
    </div>
  );
}
