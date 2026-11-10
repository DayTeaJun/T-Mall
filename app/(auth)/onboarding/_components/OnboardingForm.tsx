"use client";

import { useState, useEffect } from "react";
import useDebounce from "@/hooks/useDebounce";
import { USERNAME_REGEX } from "../../constants";
import { useSignUpOAuthMutation } from "@/lib/queries/auth";
import { uploadImageToStorage } from "@/lib/queries/storage";
import { User } from "@supabase/supabase-js";
import { ImgPreview } from "@/hooks/useImagePreview";
import DaumPostcode from "@/components/common/AddressSearch";
import ImagePreviews from "@/components/common/ImagePreview";
import PolicyForm from "../../signup/_components/PolicyForm";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";

interface Props {
  user: User;
}

export default function OnboardingForm({ user }: Props) {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { mutate } = useSignUpOAuthMutation();
  const [username, setUsername] = useState("");

  const debounceUsername = useDebounce<string>(username);

  const { imageSrc, imgUrl, onUpload } = ImgPreview();

  const [profileImage, setProfileImage] = useState("");

  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("가입이 취소되었습니다.");
    router.refresh();
  };

  const handleProfileImageChange = (file: File) => {
    const uploaded = onUpload(file);
    if (uploaded) {
      setProfileImage("");
    }
    return uploaded;
  };

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [hint, setHint] = useState<string>("");

  const [detailAddress, setDetailAddress] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDetailAddressOpen, setIsDetailAddressOpen] = useState(false);

  const isFormValid =
    hint === "사용 가능한 사용자명입니다." &&
    agreements.terms &&
    agreements.privacy;

  useEffect(() => {
    const validateUsername = async () => {
      if (debounceUsername.length === 0) {
        setHint("");
        return;
      }

      if (!USERNAME_REGEX.test(debounceUsername)) {
        setHint("최소 2글자 이상 20자 미만의 닉네임을 입력해주세요.");
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/check-username?name=${encodeURIComponent(
            debounceUsername,
          )}`,
        );
        const { exists } = await res.json();

        if (exists) {
          setHint("중복된 사용자명입니다.");
        } else {
          setHint("사용 가능한 사용자명입니다.");
        }
      } catch (error) {
        console.error("닉네임 확인 중 오류:", error);
        setHint("닉네임 확인 중 오류가 발생했습니다. 관리자에게 문의해주세요.");
      }
    };

    validateUsername();
  }, [debounceUsername]);

  const onChangePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length >= 3 && digits.length <= 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(
        7,
      )}`;
    }
    setPhone(formatted);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const imageUrl = imgUrl
      ? await uploadImageToStorage("avatar", user.id, imgUrl)
      : profileImage || null;

    mutate({
      id: user.id,
      email: user.email || "",
      username: username.trim().toLowerCase(),
      phone,
      address: address
        ? address + (detailAddress ? `, ${detailAddress}` : "")
        : "",
      profile_image_url: imageUrl || "",
    });
  };

  return (
    <div className="max-w-[500px] mx-auto p-5">
      <h1 className="text-2xl font-bold mb-1">계정 설정</h1>
      <p className="text-sm text-gray-600 mb-6">
        처음 오셨네요! 사용자 정보를 입력해주세요.
      </p>

      <form onSubmit={onSubmit} className="w-full flex flex-col gap-5">
        <div className="flex gap-4 sm:flex-row flex-col">
          <div className="flex-1 flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-1">
              <label className="block text-sm font-medium mb-1">이메일</label>
              <input
                className="w-full border rounded px-3 py-2 bg-gray-50"
                value={user.email}
                readOnly
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="block text-sm font-medium mb-1">
                사용자명 *
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="영문/숫자/-/_ 1~16자"
                maxLength={16}
              />
              <p
                className={`text-xs ${
                  hint === "중복된 사용자명입니다."
                    ? "text-red-600"
                    : hint === "사용 가능한 사용자명입니다."
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {hint ? hint : "영문/숫자/-/_ 만 허용됩니다."}
              </p>
            </div>
          </div>

          <ImagePreviews
            variant="circle"
            imageSrc={imageSrc || ""}
            onUpload={handleProfileImageChange}
            className="w-20 h-20 sm:w-24 sm:h-24"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="block text-sm font-medium mb-1">휴대폰</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={phone}
            onChange={(e) => onChangePhone(e.target.value)}
            inputMode="numeric"
            placeholder="- 없이 숫자만 입력"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex gap-4 items-center">
              <label className="font-bold text-xl">기본 배송 주소</label>
              <button
                type="button"
                className="rounded border-gray-300 px-2 py-1 text-sm text-white hover:bg-gray-600 transition-colors bg-gray-500"
                onClick={() => setIsAddressModalOpen(!isAddressModalOpen)}
              >
                {isAddressModalOpen ? "취소" : "배송지 추가"}
              </button>
            </div>
            <p
              className={`text-sm ${address ? "text-black" : "text-gray-500"}`}
            >
              {address || "등록된 주소 없음"}
            </p>

            {isDetailAddressOpen && (
              <input
                type="text"
                placeholder="상세 주소 (선택)"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                className="border-b py-1 text-sm"
              />
            )}
          </div>
          {isAddressModalOpen && (
            <DaumPostcode
              onComplete={(data) => {
                setAddress(data.address);
                setIsAddressModalOpen(false);
                setIsDetailAddressOpen(true);
              }}
            />
          )}
        </div>

        <PolicyForm agreements={agreements} setAgreements={setAgreements} />

        <div className="pt-2 flex justify-between">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`font-bold transition-all duration-200 ease-in-out
              px-4 py-2 rounded border hover:bg-gray-300 disabled:opacity-60 ${
                isFormValid
                  ? "bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
                  : "bg-gray-300 text-white cursor-default"
              }`}
          >
            저장하고 시작하기
          </button>

          <button
            type="button"
            onClick={() => handleLogout()}
            className="font-bold transition-all duration-200 ease-in-out
              px-4 py-2 rounded border hover:bg-gray-400 disabled:opacity-60 bg-gray-700 text-white cursor-pointer"
          >
            가입 취소
          </button>
        </div>
      </form>
    </div>
  );
}
