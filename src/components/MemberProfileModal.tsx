"use client";

import { useCreateDirectChat } from "@/global/api/useChatQuery";
import { useSendFriendRequest } from "@/global/api/useFriendshipMutation";
import { useToastStore } from "@/global/stores/useToastStore";
import { ChatRoomMember } from "@/global/types/chat.types";
import { MessageSquare, ShieldAlert, UserMinus, UserPlus, X } from "lucide-react";
import Image, { ImageLoaderProps } from "next/image";
import { useState } from "react";
import ReportModal from "./ReportModal";

const remoteImageLoader = ({ src }: ImageLoaderProps) => src;

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: ChatRoomMember;
  isCurrentUser: boolean;
}

export default function MemberProfileModal({
  isOpen,
  onClose,
  member,
  isCurrentUser,
}: MemberProfileModalProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAvatarError, setIsAvatarError] = useState(false);
  const { mutate: sendFriendRequest } = useSendFriendRequest();
  const { mutate: createDirectChat } = useCreateDirectChat();
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const handleSendFriendRequest = () => {
    sendFriendRequest(
      { receiverId: member.id },
      {
        onSuccess: () => {
          addToast(`${member.nickname}님에게 친구 요청을 보냈습니다.`, "success");
        },
        onError: (error) => {
          const errorMessage = error.message || "";
          if (errorMessage.includes("처리할 수 없는 상태")) {
            addToast("이미 친구 신청을 보낸 상태입니다.", "info");
          } else {
            addToast(errorMessage || "친구 요청을 보내지 못했습니다.", "error");
          }
        },
      }
    );
  };

  const handleStartDirectChat = () => {
    onClose();
    createDirectChat({ partnerId: member.id });
  };

  const handleReport = () => {
    setIsReportModalOpen(true);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "var(--surface-overlay)" }}
        onClick={onClose}
      >
        <div
          className="theme-card rounded-3xl shadow-2xl w-full max-w-md flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Close Button */}
          <div className="p-6 flex justify-end border-b" style={{ borderColor: "var(--surface-border)" }}>
            <button
              onClick={onClose}
              className="text-[var(--surface-muted-text)] hover:text-emerald-400 transition-colors"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>

          {/* Profile Section */}
          <div className="p-6 flex flex-col items-center">
            {/* Profile Image */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg overflow-hidden border"
              style={{ background: "var(--surface-panel-muted)", color: "var(--page-text)", borderColor: "var(--surface-border)" }}
            >
              {!member.profileImageUrl || member.profileImageUrl.trim() === '' || isAvatarError ? (
                member.nickname.charAt(0).toUpperCase()
              ) : (
                <Image
                  loader={remoteImageLoader}
                  unoptimized
                  src={member.profileImageUrl}
                  alt={member.nickname}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  onError={() => setIsAvatarError(true)}
                />
              )}
            </div>

            {/* Nickname */}
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--page-text)" }}>
              {member.nickname}
            </h2>

            {/* Friend Badge */}
            {member.isFriend && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm font-semibold rounded-full">
                <UserMinus size={14} />
                친구
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {!isCurrentUser && (
            <div className="p-6 border-t space-y-3" style={{ borderColor: "var(--surface-border)" }}>
              {!member.isFriend && (
                <button
                  onClick={handleSendFriendRequest}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
                >
                  <UserPlus size={18} />
                  친구 추가
                </button>
              )}

              <button
                onClick={handleStartDirectChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-colors"
              >
                <MessageSquare size={18} />
                1:1 대화
              </button>

              <button
                onClick={handleReport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-500/40 text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
              >
                <ShieldAlert size={18} />
                신고하기
              </button>
            </div>
          )}

          {/* Current User Message */}
          {isCurrentUser && (
            <div className="p-6 border-t" style={{ borderColor: "var(--surface-border)" }}>
              <p className="text-center text-sm" style={{ color: "var(--surface-muted-text)" }}>
                내 프로필입니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetMemberId={member.id}
        targetNickname={member.nickname}
      />
    </>
  );
}
