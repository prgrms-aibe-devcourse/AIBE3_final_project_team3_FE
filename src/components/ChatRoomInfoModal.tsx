"use client";

import Image, { ImageLoaderProps } from "next/image";
import { X, Users, Lock, Calendar, Crown, UserPlus, MessageSquare, ShieldAlert, Hash } from "lucide-react";
import { ChatRoomMember } from "@/global/types/chat.types";
import { useState } from "react";
import MemberProfileModal from "./MemberProfileModal";
import { useSendFriendRequest } from "@/global/api/useFriendshipMutation";
import { useToastStore } from "@/global/stores/useToastStore";
import ReportModal from "./ReportModal";

const remoteImageLoader = ({ src }: ImageLoaderProps) => src;

interface ChatRoomInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMembersModal?: () => void;
  roomDetails: {
    id: number;
    name: string;
    type: string;
    avatar?: string;
    ownerId?: number;
    members?: ChatRoomMember[];
    description?: string;
    topic?: string;
    hasPassword?: boolean;
    createdAt?: string;
  } | null;
  currentUserId?: number;
  subscriberCount?: number;
  totalMemberCount?: number;
}

export default function ChatRoomInfoModal({
  isOpen,
  onClose,
  onOpenMembersModal,
  roomDetails,
  currentUserId,
  subscriberCount,
  totalMemberCount,
}: ChatRoomInfoModalProps) {
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<ChatRoomMember | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [failedMemberAvatarIds, setFailedMemberAvatarIds] = useState<Set<number>>(new Set());
  const [isPartnerAvatarError, setIsPartnerAvatarError] = useState(false);
  const { mutate: sendFriendRequest } = useSendFriendRequest();
  const { addToast } = useToastStore();

  if (!isOpen || !roomDetails) return null;

  const isGroupChat = roomDetails.type === "group";
  const isDirectChat = roomDetails.type === "direct";
  const isOwner = currentUserId === roomDetails.ownerId;

  // For direct chat, get partner info
  const partner = isDirectChat && roomDetails.members
    ? roomDetails.members.find((m) => m.id !== currentUserId)
    : null;

  const owner = isGroupChat && roomDetails.members
    ? roomDetails.members.find((m) => m.id === roomDetails.ownerId)
    : null;

  const handleSendFriendRequest = () => {
    if (!partner) return;
    sendFriendRequest(
      { receiverId: partner.id },
      {
        onSuccess: () => {
          addToast(`${partner.nickname}님에게 친구 요청을 보냈습니다.`, "success");
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

  const markMemberAvatarFailed = (memberId: number) => {
    setFailedMemberAvatarIds((prev) => {
      if (prev.has(memberId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(memberId);
      return next;
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-slide-in-right"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold text-white">
              {isGroupChat ? "그룹 채팅방 정보" : isDirectChat ? "대화 상대 정보" : "채팅방 정보"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Group Chat Info */}
            {isGroupChat && (
              <>
                {/* Room Title & Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-3xl flex-shrink-0">
                    {roomDetails.avatar || "👥"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-white truncate">
                      {roomDetails.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <Users size={14} />
                      <span>
                        {subscriberCount || 0}명 접속 중 / {totalMemberCount || roomDetails.members?.length || 0}명
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="space-y-3">
                  {/* Description */}
                  {roomDetails.description && (
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-1 font-semibold">설명</p>
                      <p className="text-sm text-gray-200">{roomDetails.description}</p>
                    </div>
                  )}

                  {/* Topic */}
                  {roomDetails.topic && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash size={16} className="text-emerald-400" />
                      <span className="text-gray-400">주제:</span>
                      <span className="text-gray-200 font-medium">{roomDetails.topic}</span>
                    </div>
                  )}

                  {/* Owner */}
                  {owner && (
                    <div className="flex items-center gap-2 text-sm">
                      <Crown size={16} className="text-yellow-400" />
                      <span className="text-gray-400">방장:</span>
                      <button
                        onClick={() => setSelectedMemberForProfile(owner)}
                        className="text-gray-200 font-medium hover:text-emerald-400 transition-colors"
                      >
                        {owner.nickname}
                      </button>
                    </div>
                  )}

                  {/* Password */}
                  {roomDetails.hasPassword && (
                    <div className="flex items-center gap-2 text-sm">
                      <Lock size={16} className="text-red-400" />
                      <span className="text-gray-400">비밀번호로 보호된 방</span>
                    </div>
                  )}

                  {/* Created At */}
                  {roomDetails.createdAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-blue-400" />
                      <span className="text-gray-400">생성일:</span>
                      <span className="text-gray-200">
                        {new Date(roomDetails.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Members Preview */}
                {roomDetails.members && roomDetails.members.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-300">멤버</h4>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenMembersModal?.();
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        전체 보기 →
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {roomDetails.members.slice(0, 8).map((member) => {
                        const isOwner = member.id === roomDetails.ownerId;
                        const hasProfileImage = Boolean(member.profileImageUrl && member.profileImageUrl.trim() !== "");
                        const shouldShowInitial = !hasProfileImage || failedMemberAvatarIds.has(member.id);
                        return (
                          <div key={member.id} className="relative">
                            <button
                              onClick={() => setSelectedMemberForProfile(member)}
                              className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-emerald-400 transition-all overflow-hidden"
                              title={member.nickname}
                            >
                              {shouldShowInitial ? (
                                member.nickname.charAt(0).toUpperCase()
                              ) : (
                                <Image
                                  loader={remoteImageLoader}
                                  unoptimized
                                  src={member.profileImageUrl as string}
                                  alt={member.nickname}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  onError={() => markMemberAvatarFailed(member.id)}
                                />
                              )}
                            </button>
                            {isOwner && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-gray-800 z-10 shadow-lg">
                                <Crown size={12} className="text-gray-900" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {roomDetails.members.length > 8 && (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs">
                          +{roomDetails.members.length - 8}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Direct Chat Info */}
            {isDirectChat && partner && (
              <>
                {/* Partner Profile */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg overflow-hidden">
                    {!partner.profileImageUrl || partner.profileImageUrl.trim() === "" || isPartnerAvatarError ? (
                      partner.nickname.charAt(0).toUpperCase()
                    ) : (
                      <Image
                        loader={remoteImageLoader}
                        unoptimized
                        src={partner.profileImageUrl}
                        alt={partner.nickname}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        onError={() => setIsPartnerAvatarError(true)}
                      />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{partner.nickname}</h3>
                  {partner.isFriend && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-full">
                      친구
                    </span>
                  )}
                </div>

                {/* Actions for Direct Chat */}
                <div className="space-y-2">
                  {!partner.isFriend && (
                    <button
                      onClick={handleSendFriendRequest}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <UserPlus size={18} />
                      친구 추가
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      setIsReportModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 text-red-400 font-semibold rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30"
                  >
                    <ShieldAlert size={18} />
                    신고하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Member Profile Modal */}
      {selectedMemberForProfile && (
        <MemberProfileModal
          isOpen={!!selectedMemberForProfile}
          onClose={() => setSelectedMemberForProfile(null)}
          member={selectedMemberForProfile}
          isCurrentUser={currentUserId === selectedMemberForProfile.id}
        />
      )}

      {/* Report Modal */}
      {isDirectChat && partner && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetMemberId={partner.id}
          targetNickname={partner.nickname}
        />
      )}
    </>
  );
}
