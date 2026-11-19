"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { X } from "lucide-react";
import React from "react";
import AdminChatList from "./admin/AdminChatList";
import UserChatRoom from "./user/UserChatRoom";

interface Props {
  onClose: () => void;
  fullScreen?: boolean;
}

function ChattingModal({ onClose, fullScreen = false }: Props) {
  const { user } = useAuthStore();
  const isAdmin = user?.level === 3;

  return (
    <div
      className={
        "fixed inset-0 z-50 flex flex-col bg-white " +
        (fullScreen
          ? ""
          : "sm:absolute sm:right-15 sm:bottom-0 sm:inset-auto " +
            "sm:w-[300px] sm:h-[350px] md:w-[360px] md:h-[430px] sm:shadow-xl sm:border sm:border-gray-200 ") +
        "overflow-hidden"
      }
    >
      <div className="flex justify-between items-center py-2 border-b border-gray-100 px-3 shrink-0">
        <h2 className="font-bold text-lg text-gray-800">채팅 상담</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="h-[460px] flex-1 overflow-hidden flex flex-col">
        {isAdmin ? <AdminChatList /> : <UserChatRoom />}
      </div>
    </div>
  );
}

export default ChattingModal;
