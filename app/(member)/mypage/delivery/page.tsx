"use client";

import {
  useDelDeliveryAddressMutation,
  useGetAddressList,
  usePostDefaultDeliveryAddressMutation,
} from "@/lib/queries/delivery";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, MapPin } from "lucide-react";

interface AddrType {
  address: string;
  address_name: string;
  created_at: string | null;
  delivery_instruction: string | null;
  detail_address: string | null;
  id: string;
  is_default: boolean | null;
  postal_code: string;
  receiver_name: string;
  receiver_phone: string;
  user_id: string | null;
}

export default function DeliveryPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: addresses, isLoading } = useGetAddressList(user?.id);

  const { mutate: setDefaultAddress } = usePostDefaultDeliveryAddressMutation(
    user?.id || "",
  );

  const { mutate: deleteAddress } = useDelDeliveryAddressMutation(
    user?.id || "",
  );

  const handleDelete = (addr: AddrType) => {
    if (addr.is_default) {
      toast.error("기본 배송지는 삭제할 수 없습니다.");
      return;
    }

    if (confirm(`'${addr.address_name}' 배송지를 삭제하시겠습니까?`)) {
      deleteAddress(addr.id, {
        onSuccess: () => {
          toast.success("배송지가 삭제되었습니다.");
        },
        onError: () => {
          toast.error("삭제 중 오류가 발생했습니다.");
        },
      });
    }
  };

  return (
    <section className="flex flex-col gap-2 p-2 sm:p-0">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">배송지 관리</h2>

      <div className="border-4 border-gray-100 p-4 sm:p-5 rounded-sm mb-4 text-[13px] sm:text-sm text-gray-600 leading-relaxed">
        <h2 className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1 flex items-center gap-2">
          <MapPin size={16} className="text-slate-500" /> 배송 주소록 유의사항
        </h2>
        <ul className="space-y-1">
          <li>
            - 배송 주소록은 최대{" "}
            <span className="font-semibold text-slate-700">10개</span>까지
            등록할 수 있습니다.
          </li>
          <li>
            - 기본 배송지 설정 시 결제 페이지에서 최상단에 자동으로 노출됩니다.
          </li>
          <li>
            - 기본 배송지는 삭제할 수 없으며, 다른 배송지를 기본으로 설정한 후
            삭제가 가능합니다.
          </li>
        </ul>
      </div>

      <div className="hidden lg:block overflow-x-auto border-t-2 border-slate-700">
        <div className="flex items-end justify-between mt-6 mb-2">
          <p className="text-sm text-gray-500">
            등록된 배송지:{" "}
            <span className="font-bold text-slate-700">
              {addresses?.length || 0}
            </span>{" "}
            / 10
          </p>
          <button
            onClick={() => router.push("/mypage/delivery/regist")}
            className="flex gap-2 items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded hover:bg-slate-700 shadow-sm transition-all"
          >
            <Plus size={16} /> 새 배송지 등록
          </button>
        </div>

        <table className="w-full text-sm text-center border-collapse border-b border-gray-200">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-gray-700 font-medium">
              <th className="py-3 px-2 w-28">기본 설정</th>
              <th className="py-3 px-2 w-24 border-gray-200">배송지명</th>
              <th className="py-3 px-2 w-20 border-gray-200">수령인</th>
              <th className="py-3 px-2 w-32 border-gray-200">휴대전화</th>
              <th className="py-3 px-2 border-gray-200">주소</th>
              <th className="py-3 px-2 w-44">관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-gray-400">
                  배송지 정보를 불러오는 중입니다...
                </td>
              </tr>
            ) : addresses?.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-gray-400">
                  등록된 배송지가 없습니다. 새 배송지를 추가해주세요.
                </td>
              </tr>
            ) : (
              addresses?.map((addr: AddrType) => (
                <tr
                  key={addr.id}
                  className="hover:bg-slate-50 transition-colors text-sm border-b border-gray-100"
                >
                  <td className="py-4 px-2">
                    {addr.is_default ? (
                      <span className="inline-block bg-blue-50 text-blue-600 text-[11px] px-2 py-1 border border-blue-200 font-bold rounded">
                        기본 배송지
                      </span>
                    ) : (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-[11px] px-2 py-1 bg-white border border-gray-300 text-gray-500 rounded hover:bg-gray-100 hover:text-gray-800 transition-all"
                      >
                        기본 설정
                      </button>
                    )}
                  </td>

                  <td className="py-4 px-2 font-medium text-gray-800 border-x border-gray-50">
                    {addr.address_name}
                  </td>
                  <td className="py-4 px-2 text-gray-600 border-r border-gray-50">
                    {addr.receiver_name}
                  </td>
                  <td className="py-4 px-2 text-gray-600 border-r border-gray-50 font-mono text-[13px]">
                    {addr.receiver_phone || "-"}
                  </td>
                  <td className="py-4 px-4 text-left border-r border-gray-50 leading-snug">
                    <div className="text-blue-600 font-bold text-[12px] mb-0.5">
                      [{addr.postal_code}]
                    </div>
                    <div className="text-gray-700">
                      {addr.address} {addr.detail_address}
                    </div>
                  </td>

                  <td className="py-4 px-2">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() =>
                          router.push(`/mypage/delivery/edit/${addr.id}`)
                        }
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-white text-xs rounded hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 size={12} /> 수정
                      </button>
                      <button
                        onClick={() => handleDelete(addr)}
                        disabled={addr.is_default || false}
                        className={`flex items-center gap-1 px-3 py-1.5 border text-xs rounded transition-colors ${
                          addr.is_default
                            ? "bg-gray-50 text-gray-300 border-gray-100 pointer-events-none"
                            : "border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                        }`}
                      >
                        <Trash2 size={12} /> 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden flex flex-col gap-3 border-t-2 border-slate-700 pt-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-gray-500 font-medium">
            총 {addresses?.length || 0}개
          </p>
          <button
            onClick={() => router.push("/mypage/delivery/regist")}
            className="flex gap-1 items-center px-3 py-1.5 bg-slate-600 text-white text-xs font-medium rounded shadow-sm"
          >
            <Plus size={14} /> 새 배송지 등록
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            정보를 불러오는 중입니다...
          </div>
        ) : addresses?.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            등록된 배송지가 없습니다.
          </div>
        ) : (
          addresses?.map((addr: AddrType) => (
            <div
              key={addr.id}
              className="border border-gray-200 p-4 bg-white rounded-sm shadow-sm relative"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">
                    {addr.address_name}
                  </h3>
                  {addr.is_default && (
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                      기본
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(addr)}
                  disabled={addr.is_default || false}
                  className={
                    addr.is_default
                      ? "text-gray-200"
                      : "text-gray-400 hover:text-red-500"
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-1.5 text-[13px] text-gray-600 mb-4">
                <p className="font-medium text-gray-800">
                  {addr.receiver_name} | {addr.receiver_phone || "-"}
                </p>
                <p className="text-gray-500 leading-relaxed">
                  <span className="text-blue-600 font-bold text-xs mr-1">
                    [{addr.postal_code}]
                  </span>
                  {addr.address} {addr.detail_address}
                </p>
              </div>

              <div className="flex gap-2 mt-4 border-t border-gray-50 pt-3">
                {!addr.is_default && (
                  <button
                    onClick={() => setDefaultAddress(addr.id)}
                    className="flex-1 py-2 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white active:bg-gray-50"
                  >
                    기본 설정
                  </button>
                )}
                <button
                  onClick={() =>
                    router.push(`/mypage/delivery/edit/${addr.id}`)
                  }
                  className={`py-2 text-xs font-medium rounded shadow-sm text-white bg-slate-700 active:bg-slate-800 ${addr.is_default ? "w-full" : "flex-1"}`}
                >
                  수정하기
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
