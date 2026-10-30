"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AdminChatListProps } from "@/components/ToolComponents/chat/admin/AdminChatList";
import { createBrowserSupabaseClient } from "../config/supabase/client";

interface Message {
  id: number;
  room_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_admin?: boolean;
}

// 채팅 메시지 "더보기" 1회당 불러올 개수
export const CHAT_MESSAGES_PAGE_SIZE = 30;

// 특정 방의 최신 메시지부터 limit개 조회 후, 화면 표시 순서(오래된 것 먼저)로 뒤집음
async function fetchRoomMessages(roomId: number, limit: number) {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const sortedMessages = ((data as Message[]) || []).reverse();

  return {
    messages: sortedMessages,
    hasMore: sortedMessages.length === limit,
  };
}

const getUserChatMsg = async (userId: string, limit: number) => {
  const supabase = createBrowserSupabaseClient();

  // 유저의 가장 최근(또는 활성) 채팅방 조회
  const { data: existingRoom, error: roomError } = await supabase
    .from("chat_rooms")
    .select("id, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roomError) throw new Error(roomError.message);

  // 방이 아예 없으면 roomId는 null, 메시지도 빈 배열 반환
  if (!existingRoom) {
    return { roomId: null, messages: [], isClosed: false, hasMore: false };
  }

  const { messages, hasMore } = await fetchRoomMessages(
    existingRoom.id,
    limit,
  );

  return {
    roomId: existingRoom.id,
    messages,
    isClosed: existingRoom.status === "CLOSED",
    hasMore,
  };
};

export function useUserChat(
  userId: string,
  limit: number = CHAT_MESSAGES_PAGE_SIZE,
) {
  return useQuery({
    queryKey: ["userChat", userId, limit],
    queryFn: () => getUserChatMsg(userId, limit),
    enabled: !!userId,
    // limit이 늘어날 때(더보기) 새 데이터가 올 때까지 이전 목록을 그대로 보여줌
    // - 없으면 messages가 잠깐 빈 배열로 떨어졌다가 다시 채워지면서
    //   스크롤 위치 보정 로직이 엉뚱한 타이밍에 소모돼버림
    placeholderData: (prev) => prev,
  });
}

// 관리자 채팅 목록
export const getAdminChatList = async (
  userId: string,
  page = 0,
  limit = 10,
) => {
  const supabase = createBrowserSupabaseClient();
  const from = page * limit;
  const to = from + limit - 1;

  const { data: roomsData, error: roomError } = await supabase
    .from("chat_rooms")
    .select(
      `
        *,
        user:public_profiles!user_id (
          user_name,
          profile_image_url
        )
      `,
    )
    .eq("status", "OPEN")
    .order("last_message_at", { ascending: false })
    .range(from, to);

  if (roomError) throw roomError;

  if (!roomsData || roomsData.length === 0) return [];

  const roomsWithUnread = await Promise.all(
    roomsData.map(async (room) => {
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)
        .eq("is_read", false)
        .neq("sender_id", userId);

      return {
        ...room,
        status: room.status as "OPEN" | "CLOSED",
        user: Array.isArray(room.user) ? room.user[0] : room.user,
        unread_count: count || 0,
      };
    }),
  );

  return roomsWithUnread as AdminChatListProps[];
};

export function useInfiniteAdminChatList(userId: string) {
  return useInfiniteQuery({
    queryKey: ["adminChatList", userId],
    // pageParam은 useInfiniteQuery에서 제공하는 매개변수로, 다음 페이지를 가져올 때 사용 기본값은 0으로 설정, allPages.length를 반환하여 다음 페이지 번호를 계산
    queryFn: ({ pageParam = 0 }) => getAdminChatList(userId, pageParam, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // 마지막으로 받아온 데이터가 10개 미만이면 다음 페이지가 없는 것으로 판단
      if (!lastPage || lastPage.length < 10) return undefined;
      return allPages.length; // 다음 페이지 번호 ([[],[...],[]])의 길이를 반환
    },
    enabled: !!userId,
  });
}

// 채팅상담 메시지 목록 (관리자)
const getAdminChatMsg = (roomId: number, limit: number) =>
  fetchRoomMessages(roomId, limit);

export function useAdminChatMsg(
  roomId: number,
  limit: number = CHAT_MESSAGES_PAGE_SIZE,
) {
  return useQuery({
    queryKey: ["adminChat", roomId, limit],
    queryFn: () => getAdminChatMsg(roomId, limit),
    enabled: !!roomId,
    // 같은 방 안에서 limit만 늘어난 경우(더보기)에만 이전 데이터를 유지하고,
    // 방 자체가 바뀐 경우엔 이전 방 메시지가 잠깐 보이지 않도록 placeholder를 쓰지 않음
    placeholderData: (prev, prevQuery) =>
      prevQuery?.queryKey[1] === roomId ? prev : undefined,
  });
}
