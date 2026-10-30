"use client";

import { SendHorizonal, MessageSquareMore } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import { CHAT_MESSAGES_PAGE_SIZE, useUserChat } from "@/lib/queries/chat";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  id: number;
  room_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_admin?: boolean;
}

interface ChatData {
  roomId: number | null;
  messages: Message[];
  isClosed: boolean;
  hasMore: boolean;
}

const supabase = createBrowserSupabaseClient();

export default function UserChatRoom() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limit, setLimit] = useState(CHAT_MESSAGES_PAGE_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // "더보기"로 과거 메시지를 불러오는 중엔, 불러오기 직전 scrollHeight와
  // 그때의 scrollTop을 여기 저장해뒀다가 메시지가 추가된 뒤 스크롤 위치를 보정하는 데 씀
  const prevScrollRef = useRef<{ height: number; top: number } | null>(null);

  // React Query를 통해 roomId, messages, isClosed를 한 번에 가져옴
  const { data, isFetching } = useUserChat(user?.id || "", limit);
  const roomId = data?.roomId ?? null;
  const isClosed = data?.isClosed ?? false;
  const hasMore = data?.hasMore ?? false;

  const messages = useMemo(() => {
    return data?.messages ?? [];
  }, [data?.messages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (prevScrollRef.current !== null) {
      // 더보기로 과거 메시지가 위에 추가된 경우: 눌렀던 시점의 scrollTop에
      // 새로 추가된 높이만큼 더해서, 보던 위치가 화면상 그대로 유지되도록 보정
      const { height: prevHeight, top: prevTop } = prevScrollRef.current;
      container.scrollTop = prevTop + (container.scrollHeight - prevHeight);
      prevScrollRef.current = null;
    } else {
      // 최초 로드 / 새 메시지 수신: 맨 아래로
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleLoadMore = () => {
    const container = scrollContainerRef.current;
    if (container) {
      prevScrollRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
    }
    setLimit((prev) => prev + CHAT_MESSAGES_PAGE_SIZE);
  };

  // 실시간 구독 (roomId가 생기면 활성화)
  useEffect(() => {
    if (!roomId) return;

    const msgChannel = supabase
      .channel(`chat_messages_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // React Query 캐시를 직접 업데이트하여 실시간 반영
          // (limit이 쿼리키에 포함돼 있어, 현재 활성화된 limit 값과 무관하게
          // "userChat"로 시작하는 캐시 전부에 반영되도록 setQueriesData 사용)
          queryClient.setQueriesData(
            { queryKey: ["userChat", user?.id] },
            (oldData: ChatData) => {
              if (!oldData) return oldData;
              if (oldData.messages.some((m: Message) => m.id === newMsg.id))
                return oldData;
              return {
                ...oldData,
                messages: [...oldData.messages, newMsg],
              };
            },
          );
        },
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`chat_room_delete_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_rooms",
          filter: `id=eq.${roomId}`,
        },
        async (payload) => {
          const updatedRoom = payload.new;
          // 관리자가 상담 종료(status를 'CLOSED'로 변경)를 누른 경우 즉시 0으로 리셋
          if (updatedRoom && updatedRoom.status === "CLOSED") {
            toast.info("상담이 종료되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["userChat", user?.id] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, user?.id, queryClient]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !user?.id || isSubmitting) return;

    if (isClosed) {
      toast.warning("종료된 상담입니다.");
      return;
    }

    const messageContent = inputText.trim();
    setInputText("");
    setIsSubmitting(true);

    try {
      let activeRoomId = roomId;

      // 💡 방이 없다면 새로 생성
      if (!activeRoomId) {
        const { data: newRoom, error: createError } = await supabase
          .from("chat_rooms")
          .insert({ user_id: user.id, status: "OPEN" })
          .select("id")
          .single();

        if (createError) throw createError;
        activeRoomId = newRoom.id;
      }

      // 메시지 삽입
      const { error: msgError } = await supabase
        .from("chat_messages")
        .insert({
          room_id: activeRoomId,
          sender_id: user.id,
          is_admin: false,
          content: messageContent,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // 채팅방의 최근 메시지 정보 업데이트
      await supabase
        .from("chat_rooms")
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", activeRoomId);

      // React Query 캐시를 최신 상태로 갱신 (새로 생성된 방 정보 및 메시지 반영)
      queryClient.invalidateQueries({ queryKey: ["userChat", user.id] });
    } catch (err) {
      console.error("메시지 전송 에러:", err);
      toast.error("메시지 전송 실패");
      setInputText(messageContent);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewChat = () => {
    // 새 상담은 다시 최초 페이지 크기부터 보여주도록 limit도 초기화
    setLimit(CHAT_MESSAGES_PAGE_SIZE);
    // 캐시를 초기화하여 새로운 상담을 시작할 수 있도록 유도
    queryClient.setQueriesData({ queryKey: ["userChat", user?.id] }, () => ({
      roomId: null,
      messages: [],
      isClosed: false,
      hasMore: false,
    }));
    toast.info("메시지를 입력하면 새로운 상담이 시작됩니다.");
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="flex flex-col justify-between h-full bg-white">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-3"
      >
        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="mx-auto px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching ? "불러오는 중..." : "이전 메시지 더보기"}
          </button>
        )}

        {roomId === null && (
          <div className="h-full flex flex-col items-center justify-center gap-4 my-2">
            <MessageSquareMore
              size={40}
              strokeWidth={1.5}
              className="text-gray-400"
            />
            <span className="px-3 text-xs font-medium text-gray-400 shrink-0">
              새로운 상담을 시작하려면 메시지를 입력해주세요.
            </span>
          </div>
        )}

        {messages.map((msg: Message, index: number) => {
          const isMyMsg = msg.sender_id === user?.id;
          const showDateHeader =
            index === 0 ||
            formatDate(messages[index - 1].created_at) !==
              formatDate(msg.created_at);

          return (
            <React.Fragment key={msg.id}>
              {showDateHeader && (
                <div className="flex items-center my-2">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="px-3 text-xs font-medium text-gray-400 shrink-0">
                    {formatDate(msg.created_at)}
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              )}

              {isMyMsg ? (
                <div className="ml-auto flex items-end gap-1.5 max-w-[80%]">
                  <p className="text-[10px] text-gray-400 shrink-0">
                    {formatTime(msg.created_at)}
                  </p>
                  <div className="bg-gray-500 text-white p-2.5 rounded-xl rounded-br-none text-xs leading-relaxed break-all">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="mr-auto flex items-end gap-1.5 max-w-[80%]">
                  <div className="bg-gray-200 text-gray-800 p-2.5 rounded-xl rounded-bl-none text-xs leading-relaxed break-all">
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-gray-400 shrink-0">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {isClosed && roomId !== null && (
          <div className="flex items-center justify-center my-4">
            <span className="px-3 text-xs font-medium text-gray-400 bg-gray-50 py-1 rounded-full border border-gray-100 shrink-0">
              상담이 종료되었습니다.
            </span>
          </div>
        )}
      </div>

      {isClosed && roomId !== null ? (
        <div className="w-full p-2 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={handleStartNewChat}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-2.5 bg-gray-500 hover:bg-gray-700 text-white text-xs rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
          >
            <span>새로운 상담 시작하기</span>
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="w-full flex justify-between items-center p-2 gap-2 border-t border-gray-200 bg-white"
        >
          <div className="flex items-center gap-1 w-full relative">
            <input
              type="text"
              maxLength={300}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="메시지를 입력해주세요."
              className="text-xs p-2.5 pr-16 w-full border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
            />
            <p className="absolute right-[10px] text-gray-300 text-xs">
              {inputText.length} / 300
            </p>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-200 p-2.5 text-white rounded-md transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <SendHorizonal size={18} />
          </button>
        </form>
      )}
    </div>
  );
}
