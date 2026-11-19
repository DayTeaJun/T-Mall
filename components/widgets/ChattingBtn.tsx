"use client";

import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useChatUnread } from "@/hooks/useChatUnread";
import ChattingModal from "./chat/ChattingModal";

function ChattingBtn({ compact = false }: { compact?: boolean }) {
  const [isChatting, setIsChatting] = useState(false);
  const { unreadCount, markOpen } = useChatUnread();

  // 버튼 클릭 시 (채팅창 토글)
  const handleToggleChat = async () => {
    const nextState = !isChatting;
    setIsChatting(nextState);
    await markOpen(nextState);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleChat}
        type="button"
        className={`bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 transition-colors relative flex items-center justify-center ${
          compact ? "p-1.5" : "p-3 shadow-md"
        }`}
      >
        <MessageCircle size={compact ? 16 : 22} />
        {unreadCount > 0 && (
          <span
            className={`absolute bg-red-500 text-white font-bold rounded-full flex items-center justify-center animate-pulse ${
              compact
                ? "-top-1 -right-1 text-[9px] w-3.5 h-3.5"
                : "-top-1 -right-1 text-xs w-5 h-5"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isChatting && <ChattingModal onClose={() => setIsChatting(false)} />}
    </div>
  );
}

export default ChattingBtn;
