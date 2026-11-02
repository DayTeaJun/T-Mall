"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { usePostDeliveryAddressMutation } from "@/lib/queries/delivery";
import DaumPostcode, {
  DaumPostcodeData,
} from "@/components/common/AddressSearch";
import { toast } from "sonner";
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/utils/phone";

export interface DeliveryAddressForm {
  address: string;
  address_name: string;
  delivery_instruction: string | null;
  detail_address: string | null;
  is_default: boolean | null;
  postal_code: string;
  receiver_name: string;
  receiver_phone: string;
}

export default function DeliveryRegisterPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const { mutate, isPending } = usePostDeliveryAddressMutation(user?.id || "");

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

    mutate({
      ...formData,
      detail_address: formData.detail_address?.trim() || null,
      delivery_instruction: formData.delivery_instruction?.trim() || null,
    });
  };

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold mb-2">배송지 등록</h2>

      <form
        onSubmit={handleSubmit}
        className="w-full border border-gray-200 bg-white overflow-hidden"
      >
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-200">
            <tr className="flex flex-col md:table-row">
              <th className="md:w-44 bg-gray-50 p-4 text-left font-medium text-gray-700 border-r border-gray-200">
                배송지명
              </th>
              <td className="p-4">
                <input
                  type="text"
                  className="w-full md:w-64 border border-gray-300 p-2 rounded-sm focus:outline-slate-500"
                  value={formData.address_name}
                  onChange={(e) =>
                    setFormData({ ...formData, address_name: e.target.value })
                  }
                  required
                  disabled={isPending}
                />
              </td>
            </tr>

            <tr className="flex flex-col md:table-row">
              <th className="md:w-44 bg-gray-50 p-4 text-left font-medium text-gray-700 border-r border-gray-200">
                수령인
              </th>
              <td className="p-4">
                <input
                  type="text"
                  className="w-full md:w-64 border border-gray-300 p-2 rounded-sm focus:outline-slate-500"
                  value={formData.receiver_name}
                  onChange={(e) =>
                    setFormData({ ...formData, receiver_name: e.target.value })
                  }
                  required
                  disabled={isPending}
                />
              </td>
            </tr>

            <tr className="flex flex-col md:table-row">
              <th className="md:w-44 bg-gray-50 p-4 text-left font-medium text-gray-700 border-r border-gray-200">
                주소
              </th>
              <td className="p-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    placeholder="우편번호"
                    className="w-24 bg-gray-50 border border-gray-300 p-2 rounded-sm text-gray-500"
                    value={formData.postal_code}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(!isAddressModalOpen)}
                    className="px-4 py-2 bg-slate-700 text-white text-xs rounded-sm hover:bg-slate-800 disabled:bg-slate-400"
                    disabled={isPending}
                  >
                    주소검색
                  </button>
                </div>

                {isAddressModalOpen && (
                  <div className="border border-gray-300 mt-2 rounded-sm overflow-hidden shadow-inner">
                    <DaumPostcode onComplete={handleAddressComplete} />
                  </div>
                )}

                <input
                  type="text"
                  readOnly
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-sm text-gray-500"
                  value={formData.address}
                  required
                />

                <input
                  type="text"
                  placeholder="상세주소(동, 호수 등)"
                  className="w-full border border-gray-300 p-2 rounded-sm focus:outline-slate-500"
                  value={formData.detail_address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, detail_address: e.target.value })
                  }
                  disabled={isPending}
                />
              </td>
            </tr>

            <tr className="flex flex-col md:table-row">
              <th className="md:w-44 bg-gray-50 p-4 text-left font-medium text-gray-700 border-r border-gray-200">
                휴대전화
              </th>
              <td className="p-4">
                <input
                  type="tel"
                  className="w-full md:w-64 border border-gray-300 p-2 rounded-sm focus:outline-slate-500"
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

            <tr className="flex flex-col md:table-row">
              <th className="md:w-44 bg-gray-50 p-4 text-left font-medium text-gray-700 border-r border-gray-200">
                배송 메시지
              </th>
              <td className="p-4">
                <textarea
                  className="w-full border border-gray-300 p-2 rounded-sm focus:outline-slate-500 h-20 resize-none"
                  placeholder="배송 시 요청사항을 입력해주세요."
                  value={formData.delivery_instruction || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delivery_instruction: e.target.value,
                    })
                  }
                  disabled={isPending}
                />
              </td>
            </tr>

            <tr className="flex flex-col md:table-row">
              <th className="md:w-44 bg-gray-50 p-4 text-left font-medium text-gray-700 border-r border-gray-200">
                설정
              </th>
              <td className="p-4">
                <label className="flex items-center gap-2 cursor-pointer">
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
              </td>
            </tr>
          </tbody>
        </table>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 sm:px-10 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-100 disabled:opacity-50"
            disabled={isPending}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 sm:px-10 py-2.5 bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:bg-slate-500 flex items-center gap-2"
            disabled={isPending}
          >
            {isPending ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </form>
    </section>
  );
}
