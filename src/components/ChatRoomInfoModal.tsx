"use client";

import { useGetGroupChatRoomDetailQuery, useUpdateGroupChatPasswordMutation } from "@/global/api/useChatQuery";
import { useSendFriendRequest } from "@/global/api/useFriendshipMutation";
import { useToastStore } from "@/global/stores/useToastStore";
import { ChatRoomMember } from "@/global/types/chat.types";
import { Calendar, Crown, Hash, Key, Lock, ShieldAlert, UserPlus, Users, X } from "lucide-react";
import Image, { ImageLoaderProps } from "next/image";
import { useState } from "react";
import MemberProfileModal from "./MemberProfileModal";
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

  // Password Change State
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { mutate: updatePassword } = useUpdateGroupChatPasswordMutation();

  const { mutate: sendFriendRequest } = useSendFriendRequest();
  const { addToast } = useToastStore();

  // 그룹 채팅방일 때 상세 정보 조회
  const isGroupChat = roomDetails?.type === "group";
  const { data: groupDetailData } = useGetGroupChatRoomDetailQuery(
    isOpen && isGroupChat && roomDetails ? roomDetails.id : null
  );

  if (!isOpen || !roomDetails) return null;

  // 그룹 채팅방이면 상세 데이터 사용, 아니면 기본 roomDetails 사용
  const effectiveRoomDetails = isGroupChat && groupDetailData ? groupDetailData : roomDetails;

  const isDirectChat = roomDetails.type === "direct";
  const isOwner = currentUserId === effectiveRoomDetails.ownerId;

  // For direct chat, get partner info
  const partner = isDirectChat && effectiveRoomDetails.members
    ? effectiveRoomDetails.members.find((m) => m.id !== currentUserId)
    : null;

  const owner = isGroupChat && effectiveRoomDetails.members
    ? effectiveRoomDetails.members.find((m) => m.id === effectiveRoomDetails.ownerId)
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

  const handlePasswordUpdate = () => {
    if (!newPassword.trim()) {
      if (!confirm("비밀번호를 비워두면 공개방으로 전환됩니다. 계속하시겠습니까?")) {
        return;
      }
    }

    updatePassword(
      { roomId: effectiveRoomDetails.id, newPassword: newPassword.trim() },
      {
        onSuccess: () => {
          setIsPasswordChangeModalOpen(false);
          setNewPassword("");
          // Toast or Alert is handled by mutation hook
        },
      }
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "var(--surface-overlay)" }}
        onClick={onClose}
      >
        <div
          className="theme-card rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--surface-border)" }}>
            <h2 className="text-xl font-bold" style={{ color: "var(--page-text)" }}>
              {isGroupChat ? "그룹 채팅방 정보" : isDirectChat ? "대화 상대 정보" : "채팅방 정보"}
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--surface-muted-text)] hover:text-emerald-400 transition-colors"
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
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0 border"
                    style={{ background: "var(--surface-panel-muted)", borderColor: "var(--surface-border)", color: "var(--page-text)" }}
                  >
                    {roomDetails.avatar || "👥"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold truncate" style={{ color: "var(--page-text)" }}>
                      {effectiveRoomDetails.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm mt-1" style={{ color: "var(--surface-muted-text)" }}>
                      <Users size={14} />
                      <span>
                        {subscriberCount || 0}명 접속 중 / {totalMemberCount || effectiveRoomDetails.members?.length || 0}명
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="space-y-3">
                  {/* Description */}
                  {effectiveRoomDetails.description && (
                    <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel)] p-4">
                      <p className="text-xs mb-1 font-semibold" style={{ color: "var(--surface-muted-text)" }}>설명</p>
                      <p className="text-sm" style={{ color: "var(--page-text)" }}>{effectiveRoomDetails.description}</p>
                    </div>
                  )}

                  {/* Topic */}
                  {effectiveRoomDetails.topic && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--surface-muted-text)" }}>
                      <Hash size={16} className="text-emerald-400" />
                      <span>주제:</span>
                      <span className="font-medium" style={{ color: "var(--page-text)" }}>{effectiveRoomDetails.topic}</span>
                    </div>
                  )}

                  {/* Owner */}
                  {owner && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--surface-muted-text)" }}>
                      <Crown size={16} className="text-yellow-400" />
                      <span>방장:</span>
                      <button
                        onClick={() => setSelectedMemberForProfile(owner)}
                        className="font-medium hover:text-emerald-400 transition-colors"
                        style={{ color: "var(--page-text)" }}
                      >
                        {owner.nickname}
                      </button>
                    </div>
                  )}

                  {/* Password */}
                  {effectiveRoomDetails.hasPassword && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--surface-muted-text)" }}>
                      <Lock size={16} className="text-red-400" />
                      {isOwner ? (
                        <button
                          onClick={() => setIsPasswordChangeModalOpen(true)}
                          className="hover:text-emerald-400 transition-colors"
                          style={{ color: "var(--surface-muted-text)" }}
                        >
                          비밀번호 설정됨 (변경하려면 클릭)
                        </button>
                      ) : (
                        <span>비밀번호 설정됨</span>
                      )}
                    </div>
                  )}

                  {/* Password Set Option for Owner if no password */}
                  {!effectiveRoomDetails.hasPassword && isOwner && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--surface-muted-text)" }}>
                      <Lock size={16} className="text-[var(--surface-muted-text)]" />
                      <button
                        onClick={() => setIsPasswordChangeModalOpen(true)}
                        className="hover:text-emerald-400 transition-colors"
                        style={{ color: "var(--surface-muted-text)" }}
                      >
                        비밀번호 설정하기
                      </button>
                    </div>
                  )}

                  {/* Created At */}
                  {effectiveRoomDetails.createdAt && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--surface-muted-text)" }}>
                      <Calendar size={16} className="text-blue-400" />
                      <span>생성일:</span>
                      <span style={{ color: "var(--page-text)" }}>
                        {new Date(effectiveRoomDetails.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Members Preview */}
                {effectiveRoomDetails.members && effectiveRoomDetails.members.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold" style={{ color: "var(--page-text)" }}>멤버</h4>
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
                      {effectiveRoomDetails.members.slice(0, 8).map((member) => {
                        const isOwner = member.id === effectiveRoomDetails.ownerId;
                        const hasProfileImage = Boolean(member.profileImageUrl && member.profileImageUrl.trim() !== "");
                        const shouldShowInitial = !hasProfileImage || failedMemberAvatarIds.has(member.id);
                        return (
                          <div key={member.id} className="relative">
                            <button
                              onClick={() => setSelectedMemberForProfile(member)}
                              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm hover:ring-2 hover:ring-emerald-400 transition-all overflow-hidden"
                              style={{ background: "var(--surface-panel-muted)", color: "var(--page-text)" }}
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
                      {effectiveRoomDetails.members.length > 8 && (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs"
                          style={{ background: "var(--surface-panel-muted)", color: "var(--page-text)" }}
                        >
                          +{effectiveRoomDetails.members.length - 8}
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
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg overflow-hidden border"
                    style={{ background: "var(--surface-panel-muted)", borderColor: "var(--surface-border)", color: "var(--page-text)" }}
                  >
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
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--page-text)" }}>{partner.nickname}</h3>
                  {partner.isFriend && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm font-semibold rounded-full">
                      친구
                    </span>
                  )}
                </div>

                {/* Actions for Direct Chat */}
                <div className="space-y-2">
                  {!partner.isFriend && (
                    <button
                      onClick={handleSendFriendRequest}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-500/40 text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
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

      {/* Password Change Modal */}
      {isPasswordChangeModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: "var(--surface-overlay)" }}
          onClick={() => setIsPasswordChangeModalOpen(false)}
        >
          <div
            className="theme-card rounded-3xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--page-text)" }}>
                <Key size={20} className="text-emerald-400" />
                비밀번호 변경
              </h3>
              <button
                onClick={() => setIsPasswordChangeModalOpen(false)}
                className="text-[var(--surface-muted-text)] hover:text-emerald-400"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--surface-muted-text)" }}>
              새로운 비밀번호를 입력하세요. <br />
              <span className="text-xs text-yellow-500/80 mt-1 block">
                * 비워두면 비밀번호가 제거되어 공개방이 됩니다.
              </span>
            </p>

            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 입력"
              className="w-full px-4 py-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] text-[var(--page-text)] placeholder-[var(--surface-muted-text)] focus:outline-none focus:ring-2 focus:ring-emerald-400/70 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsPasswordChangeModalOpen(false)}
                className="px-4 py-2 rounded-2xl border border-[var(--surface-border)] text-sm text-[var(--page-text)] hover:border-emerald-400"
              >
                취소
              </button>
              <button
                onClick={handlePasswordUpdate}
                className="px-4 py-2 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

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
