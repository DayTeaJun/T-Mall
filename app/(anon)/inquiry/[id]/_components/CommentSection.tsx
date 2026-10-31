"use client";

import React, { useState } from "react";
import { User } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import {
  usePostInquiryCommentMutation,
  useUpdateInquiryCommentMutation,
  useDeleteInquiryCommentMutation,
} from "@/lib/queries/inquiry";

interface CommentSectionProps {
  inquiry: {
    id: number;
    status: string | null;
    answer_content: string | null;
    answered_at: string | null;
  };
}

export default function CommentSection({ inquiry }: CommentSectionProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.level === 3;

  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(inquiry.answer_content || "");

  const { mutate: postComment, isPending: isPosting } =
    usePostInquiryCommentMutation();
  const { mutate: updateComment, isPending: isUpdating } =
    useUpdateInquiryCommentMutation();
  const { mutate: deleteComment, isPending: isDeleting } =
    useDeleteInquiryCommentMutation();

  const handleSendComment = () => {
    if (!comment.trim()) {
      toast.warning("답변 내용을 입력해주세요.");
      return;
    }
    if (!user?.id) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    postComment(
      { userId: user.id, inquiryId: inquiry.id, comment },
      {
        onSuccess: () => setComment(""),
      },
    );
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      toast.warning("내용을 입력해주세요.");
      return;
    }

    updateComment(
      { inquiryId: inquiry.id, comment: editContent },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleDeleteComment = () => {
    if (confirm("답변을 삭제하시겠습니까?")) {
      deleteComment(inquiry.id, {
        onSuccess: () => {
          setEditContent("");
          setIsEditing(false);
        },
      });
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-2 mt-5">
      <div className="flex justify-between w-full border-b border-gray-100 pb-2">
        <p className="font-bold w-[80px] text-base border-b-4 border-gray-900 pb-2">
          문의 답변
        </p>
      </div>

      {inquiry.answer_content ? (
        <div className="flex flex-col gap-4 p-2 mt-2">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <User size={12} className="text-gray-600" />
              <p className="text-sm font-semibold text-gray-700">관리자</p>
              <p className="ml-2 text-xs text-gray-400">
                {inquiry.answered_at
                  ? new Date(inquiry.answered_at).toLocaleDateString()
                  : ""}
              </p>
            </div>

            {isAdmin && (
              <div className="flex gap-1 text-xs text-gray-500">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isUpdating}
                      className="hover:font-bold hover:text-black disabled:text-gray-300"
                      type="button"
                    >
                      {isUpdating ? "저장 중..." : "저장"}
                    </button>
                    <p className="text-gray-200">|</p>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(inquiry.answer_content || "");
                      }}
                      disabled={isUpdating}
                      className="hover:font-bold hover:text-black disabled:text-gray-300"
                      type="button"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditContent(inquiry.answer_content || "");
                        setIsEditing(true);
                      }}
                      className="hover:font-bold hover:text-black"
                      type="button"
                    >
                      수정
                    </button>
                    <p className="text-gray-200">|</p>
                    <button
                      onClick={handleDeleteComment}
                      disabled={isDeleting}
                      className="hover:font-bold hover:text-red-600 disabled:text-gray-300"
                      type="button"
                    >
                      {isDeleting ? "삭제 중..." : "삭제"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <textarea
              spellCheck={false}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isUpdating}
              className="border p-4 border-solid border-gray-200 text-sm w-full min-h-[180px] outline-none resize-none leading-7 focus:border-black disabled:bg-gray-50"
            />
          ) : (
            <div className="bg-[#f9f8f9] p-4 border border-gray-50">
              <p className="text-base whitespace-pre-wrap leading-8 text-[#555555] font-medium">
                {inquiry.answer_content}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-2 h-[80px] justify-center items-center">
          <p className="w-full text-gray-400 text-sm text-center">
            아직 작성된 답변이 없습니다.
          </p>
        </div>
      )}

      <div className="mb-6" />

      {isAdmin && !inquiry.answer_content && (
        <div className="mt-4">
          <p className="font-bold w-[70px] text-base border-b-4 border-gray-900 pb-2 mb-4">
            답변 작성
          </p>
          <div className="w-full flex border border-gray-200 rounded-sm overflow-hidden focus-within:border-black transition-all">
            <textarea
              spellCheck={false}
              value={comment}
              placeholder="답변을 작성해주세요."
              onChange={(e) => setComment(e.target.value)}
              disabled={isPosting}
              className="p-3 text-sm w-full h-[120px] outline-none resize-none leading-6 text-gray-800 disabled:bg-gray-50"
            />
            <button
              type="button"
              onClick={handleSendComment}
              disabled={isPosting}
              className="w-[100px] h-[120px] font-bold text-white text-sm bg-[#222]/80 hover:bg-[#111] duration-200 transition-all flex justify-center items-center shrink-0 disabled:bg-gray-400"
            >
              {isPosting ? "등록 중" : "등록"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
