"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { usePostDeliveryAddressMutation } from "@/lib/queries/delivery";
import DaumPostcode, {
  DaumPostcodeData,
} from "@/components/common/AddressSearch";
import { toast } from "sonner";
import { DeliveryAddressForm } from "@/app/(member)/mypage/delivery/regist/page";
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/utils/phone";

interface RegistDeliveryFormProps {
  onCancel: () => void;
}

export default function RegistDeliveryForm({
  onCancel,
}: RegistDeliveryFormProps) {
  const { user } = useAuthStore();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const { mutate, isPending } = usePostDeliveryAddressMutation(
    user?.id || "",
    true,
  );

  const [formData, setFormData] = useState<DeliveryAddressForm>({
    address: "",
    address_name: "",
    delivery_instruction: "",
    detail_address: "",
    is_default: false,
    postal_code: "",
    receiver_name: "",
    receiver_phone: "",
  });

  const handleAddressComplete = (data: DaumPostcodeData) => {
    const fullAddress =
      data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
    setFormData((prev) => ({
      ...prev,
      postal_code: data.zonecode,
      address: fullAddress,
    }));
    setIsAddressModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPhoneNumber(formData.receiver_phone)) {
      toast.error("올바른 휴대전화 번호를 입력해주세요.");
      return;
    }

    mutate(
      {
        ...formData,
        detail_address: formData.detail_address?.trim() || null,
        delivery_instruction: formData.delivery_instruction?.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("배송지가 성공적으로 등록되었습니다.");
          onCancel();
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-2 h-full max-h-full overflow-hidden">
      <form className="w-full bg-white flex-1 overflow-y-auto p-3">
        <table className="w-full text-sm">
          <tbody className="flex flex-col gap-2 divide-y divide-gray-200">
            <tr className="flex flex-col">
              <th className="bg-gray-50 p-3 text-left font-medium text-gray-700">
                배송지명
              </th>
              <td className="py-3">
                <input
                  type="text"
                  className="w-full border border-gray-300 p-2"
                  value={formData.address_name}
                  onChange={(e) =>
                    setFormData({ ...formData, address_name: e.target.value })
                  }
                  required
                  disabled={isPending}
                />
              </td>
            </tr>
            <tr className="flex flex-col">
              <th className="bg-gray-50 p-3 text-left font-medium text-gray-700">
                수령인
              </th>
              <td className="py-3">
                <input
                  type="text"
                  className="w-full border border-gray-300 p-2"
                  value={formData.receiver_name}
                  onChange={(e) =>
                    setFormData({ ...formData, receiver_name: e.target.value })
                  }
                  required
                  disabled={isPending}
                />
              </td>
            </tr>
            <tr className="flex flex-col">
              <th className="bg-gray-50 p-3 text-left font-medium text-gray-700">
                주소
              </th>
              <td className="py-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    className="w-24 bg-gray-50 border border-gray-300 p-2 text-gray-500"
                    value={formData.postal_code}
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(!isAddressModalOpen)}
                    className="px-3 py-1 bg-slate-700 text-white text-xs"
                    disabled={isPending}
                  >
                    주소검색
                  </button>
                </div>
                {isAddressModalOpen && (
                  <div className="border border-gray-300 rounded-sm">
                    <DaumPostcode onComplete={handleAddressComplete} />
                  </div>
                )}
                <input
                  type="text"
                  readOnly
                  className="w-full bg-gray-50 border border-gray-300 p-2 text-gray-500"
                  value={formData.address}
                />
                <input
                  type="text"
                  placeholder="상세주소"
                  className="w-full border border-gray-300 p-2"
                  value={formData.detail_address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, detail_address: e.target.value })
                  }
                  disabled={isPending}
                />
              </td>
            </tr>
            <tr className="flex flex-col">
              <th className="bg-gray-50 p-3 text-left font-medium text-gray-700">
                휴대전화
              </th>
              <td className="py-3">
                <input
                  type="tel"
                  className="w-full border border-gray-300 p-2"
                  value={formData.receiver_phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receiver_phone: formatPhoneNumber(e.target.value),
                    })
                  }
                  maxLength={13}
                  placeholder="010-1234-5678"
                  required
                  disabled={isPending}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <label className="flex items-center gap-2 cursor-pointer py-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-slate-700 focus:ring-slate-500"
            checked={!!formData.is_default}
            onChange={(e) =>
              setFormData({ ...formData, is_default: e.target.checked })
            }
            disabled={isPending}
          />
          <span className="text-gray-600">기본 배송지로 저장</span>
        </label>

        <div className="pt-4 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 bg-white text-sm"
            disabled={isPending}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-slate-800 text-white text-sm"
            disabled={isPending}
          >
            {isPending ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </form>
    </section>
  );
}
