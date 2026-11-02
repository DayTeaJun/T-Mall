import React, { useState } from "react";
import { Loader2, Truck, Plus } from "lucide-react";
import {
  useGetAddressList,
  usePostDefaultDeliveryAddressMutation,
} from "@/lib/queries/delivery";
import EditDeliveryForm from "./EditDeliveryForm";
import RegistDeliveryForm from "./RegistDeliveryForm";

export interface DeliveryAddress {
  id: string;
  address: string;
  address_name: string;
  delivery_instruction: string | null;
  detail_address: string | null;
  is_default: boolean | null;
  postal_code: string;
  receiver_name: string;
  receiver_phone: string;
  user_id: string | null;
  created_at: string | null;
}

interface Props {
  userId?: string;
  onClose: () => void;
}

export default function AddressListModal({ userId, onClose }: Props) {
  const [editingAddr, setEditingAddr] = useState<DeliveryAddress | null>(null);
  const [registingAddr, setRegistingAddr] = useState(false);

  const { data: addresses, isLoading } = useGetAddressList(userId);
  const { mutate: setDefaultAddress } = usePostDefaultDeliveryAddressMutation(
    userId || "",
  );

  const handleDeliveryChange = (id: string) => {
    setDefaultAddress(id);
    onClose();
  };

  const handleDeliveryEdit = (addr: DeliveryAddress) => {
    setEditingAddr(addr);
  };

  const handleDeliveryRegist = () => {
    setRegistingAddr(true);
  };

  if (isLoading) {
    return (
      <section className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-gray-300" size={32} />
      </section>
    );
  }

  if (editingAddr) {
    return (
      <EditDeliveryForm
        initialData={editingAddr}
        onCancel={() => setEditingAddr(null)}
      />
    );
  }

  if (registingAddr) {
    return <RegistDeliveryForm onCancel={() => setRegistingAddr(false)} />;
  }

  return (
    <section className="flex flex-col gap-2">
      {!isLoading && addresses?.length === 0 ? (
        <div className="py-6 mx-4 sm:mx-0 flex flex-col items-center gap-2 text-gray-500 text-[12px] sm:text-[14px] border-dashed border-2 border-gray-200 rounded-sm">
          <Truck size={25} className="sm:w-8 sm:h-8" />
          등록된 배송지가 없습니다.
          <br />새 배송지를 추가해주세요.
        </div>
      ) : (
        addresses?.map((addr: DeliveryAddress) => (
          <div
            key={addr.id}
            className={`${
              addr.is_default ? "border-green-400 border-2" : "border-gray-200"
            } border p-3 flex flex-col gap-2`}
          >
            <div className="flex gap-4">
              <p className="font-bold">{addr.address_name}</p>
              <p className="text-gray-500">-</p>
              <p className="text-gray-500">{addr.receiver_name}</p>
            </div>

            {addr.is_default && (
              <p className="text-[13px] font-bold border border-gray-200 rounded-2xl px-2 py-0.5 w-fit -ml-1">
                기본 배송지
              </p>
            )}

            <p className="text-[16px]">{`(${addr.postal_code}) ${addr.address}, ${addr.detail_address ?? ""}`}</p>
            {addr.delivery_instruction && (
              <p className="text-gray-600">{addr.delivery_instruction}</p>
            )}

            <div className="flex justify-between text-[14px] mt-2">
              <button
                className="px-5 py-2 border border-gray-200 text-green-500 hover:bg-green-50 transition-colors"
                type="button"
                onClick={() => handleDeliveryEdit(addr)}
              >
                수정
              </button>
              {!addr.is_default && (
                <button
                  onClick={() => handleDeliveryChange(addr.id)}
                  className="px-5 py-2 border border-transparent text-white bg-green-400 hover:bg-green-500 transition-colors"
                  type="button"
                >
                  선택
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        className="flex gap-2 p-3 w-full border justify-center items-center border-dashed border-gray-300 hover:bg-gray-50 duration-200 mt-2"
        onClick={handleDeliveryRegist}
      >
        <Plus size={18} /> 새 배송지 추가하기
      </button>
    </section>
  );
}
