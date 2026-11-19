"use client";

import { SendHorizonal } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/config/supabase/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import { CHAT_MESSAGES_PAGE_SIZE, useAdminChatMsg } from "@/lib/queries/chat";
import { queryClient } from "@/components/providers/ReactQueryProvider";

interface Message {
  id: number;
  room_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_admin: boolean;
}

interface ChatData {
  messages: Message[];
  hasMore: boolean;
}

interface AdminChatRoomProps {
  roomId: number;
  roomStatus?: string;
}

export default function AdminChatRoom({
  roomId,
  roomStatus = "OPEN",
}: AdminChatRoomProps) {
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limit, setLimit] = useState(CHAT_MESSAGES_PAGE_SIZE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // "더보기"로 과거 메시지를 불러오는 중엔, 불러오기 직전 scrollHeight와
  // 그때의 scrollTop을 여기 저장해뒀다가 메시지가 추가된 뒤 스크롤 위치를 보정하는 데 씀
  const prevScrollRef = useRef<{ height: number; top: number } | null>(null);

  // realtime 구독 콜백(roomId가 바뀔 때만 재생성됨) 안에서 최신 user.id를
  // 참조하기 위한 ref - user 객체를 의존성에 넣으면 구독이 불필요하게 재생성됨
  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  // 다른 방으로 옮기면 더보기로 늘려둔 limit을 다시 최초 크기로
  useEffect(() => {
    setLimit(CHAT_MESSAGES_PAGE_SIZE);
  }, [roomId]);

  const { data, isFetching } = useAdminChatMsg(roomId, limit);
  const hasMore = data?.hasMore ?? false;

  const supabase = createBrowserSupabaseClient();

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

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
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
          // "adminChat"로 시작하는 캐시 전부에 반영되도록 setQueriesData 사용)
          queryClient.setQueriesData(
            { queryKey: ["adminChat", roomId] },
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

          // 지금 이 방을 보고 있는 중에 유저가 보낸 새 메시지가 오면
          // 목록에서 방을 다시 클릭하지 않아도 바로 읽음 처리
          if (!newMsg.is_admin) {
            supabase
              .rpc("mark_room_messages_as_read", { target_room_id: roomId })
              .then(({ error }) => {
                if (error) {
                  console.error("메시지 읽음 처리 오류:", error);
                  return;
                }
                if (userIdRef.current) {
                  queryClient.invalidateQueries({
                    queryKey: ["adminChatList", userIdRef.current],
                  });
                }
              });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !user?.id || !roomId || isSubmitting) return;

    if (roomStatus === "CLOSED") {
      toast.warning("종료된 상담입니다.");
      return;
    }

    const messageContent = inputText.trim();
    setInputText("");
    setIsSubmitting(true);

    try {
      const { error: msgError } = await supabase.from("chat_messages").insert({
        room_id: roomId,
        sender_id: user.id,
        is_admin: true,
        content: messageContent,
      });

      if (msgError) throw msgError;

      await supabase
        .from("chat_rooms")
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString(),
          admin_id: user.id,
        })
        .eq("id", roomId);
    } catch (err) {
      console.error(err);
      toast.error("메시지 전송 실패");
      setInputText(messageContent);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="flex flex-col justify-between h-full">
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

        {messages.map((msg, index) => {
          const isMyMsg = msg.is_admin || msg.sender_id === user?.id;
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
      </div>

      <form
        onSubmit={handleSendMessage}
        className="w-full flex justify-between items-center p-2 gap-2 border-t border-gray-200 bg-white shrink-0"
      >
        <div className="flex items-center gap-1 w-full relative">
          <input
            type="text"
            maxLength={300}
            value={inputText}
            disabled={roomStatus === "CLOSED"}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              roomStatus === "CLOSED"
                ? "종료된 상담입니다."
                : "답변을 입력해주세요."
            }
            className="text-xs p-2.5 pr-16 w-full border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
          />

          <p className="absolute right-[10px] text-gray-300 text-xs">
            {inputText.length} / 300
          </p>
        </div>

        <button
          type="submit"
          disabled={
            !inputText.trim() || isSubmitting || roomStatus === "CLOSED"
          }
          className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-200 p-2.5 text-white rounded-md transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          <SendHorizonal size={18} />
        </button>
      </form>
    </div>
  );
}
