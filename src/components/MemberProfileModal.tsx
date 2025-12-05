"use client";

import { X, UserPlus, MessageSquare, ShieldAlert, UserMinus } from "lucide-react";
import { ChatRoomMember } from "@/global/types/chat.types";
import { useState } from "react";
import { useSendFriendRequest } from "@/global/api/useFriendshipMutation";
import { useCreateDirectChat } from "@/global/api/useChatQuery";
import { useToastStore } from "@/global/stores/useToastStore";
import ReportModal from "./ReportModal";

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
        className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-slide-in-right"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Close Button */}
          <div className="p-6 flex justify-end border-b border-gray-700">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>

          {/* Profile Section */}
          <div className="p-6 flex flex-col items-center">
            {/* Profile Image */}
            <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg overflow-hidden">
              {member.profileImageUrl && member.profileImageUrl.trim() !== '' ? (
                <img
                  src={member.profileImageUrl}
                  alt={member.nickname}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.textContent = member.nickname.charAt(0).toUpperCase();
                  }}
                />
              ) : (
                member.nickname.charAt(0).toUpperCase()
              )}
            </div>

            {/* Nickname */}
            <h2 className="text-2xl font-bold text-white mb-2">
              {member.nickname}
            </h2>

            {/* Friend Badge */}
            {member.isFriend && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-full">
                <UserMinus size={14} />
                친구
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {!isCurrentUser && (
            <div className="p-6 border-t border-gray-700 space-y-3">
              {!member.isFriend && (
                <button
                  onClick={handleSendFriendRequest}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <UserPlus size={18} />
                  친구 추가
                </button>
              )}

              <button
                onClick={handleStartDirectChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare size={18} />
                1:1 대화
              </button>

              <button
                onClick={handleReport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 text-red-400 font-semibold rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30"
              >
                <ShieldAlert size={18} />
                신고하기
              </button>
            </div>
          )}

          {/* Current User Message */}
          {isCurrentUser && (
            <div className="p-6 border-t border-gray-700">
              <p className="text-center text-gray-400 text-sm">
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
