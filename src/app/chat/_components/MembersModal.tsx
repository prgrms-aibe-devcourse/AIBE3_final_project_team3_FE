"use client";

import ReportModal from "@/components/ReportModal";
import { useCreateDirectChat, useKickMemberMutation, useTransferOwnershipMutation } from "@/global/api/useChatQuery";
import { useSendFriendRequest } from "@/global/api/useFriendshipMutation";
import { useToastStore } from "@/global/stores/useToastStore";
import { ChatRoomMember } from "@/global/types/chat.types";
import { Crown, MessageSquare, MoreVertical, Shield, ShieldAlert, UserPlus, Users, UserX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  members: ChatRoomMember[];
  ownerId: number;
  currentUserId: number;
  isOwner: boolean;
  onSelectMemberForProfile: (member: ChatRoomMember) => void; // New prop
}

export default function MembersModal({ isOpen, onClose, roomId, members, ownerId, currentUserId, isOwner, onSelectMemberForProfile }: MembersModalProps) {
  const { t } = useLanguage();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [reportTargetMember, setReportTargetMember] = useState<ChatRoomMember | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { mutate: kickMember } = useKickMemberMutation();
  const { mutate: transferOwnership } = useTransferOwnershipMutation();
  const { mutate: createDirectChat } = useCreateDirectChat();
  const { mutate: sendFriendRequest } = useSendFriendRequest();
  const { addToast } = useToastStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  if (!isOpen) return null;

  // Sort members to show the current user first, then by nickname
  const sortedMembers = [...members].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return a.nickname.localeCompare(b.nickname);
  });

  const handleActionClick = (action: string, member: ChatRoomMember) => {
    setOpenMenuId(null); // Close menu after action

    switch (action) {
      case '강퇴하기':
        if (window.confirm(t('chat.ui.kick_confirm', { nickname: member.nickname }))) {
          kickMember(
            { roomId, memberId: member.id },
            {
              onSuccess: () => {
                if (member.id === currentUserId) {
                  addToast(t('chat.ui.you_have_been_kicked', { roomName: roomId.toString() }), 'error');
                  onClose(); // Close the modal if the current user is kicked
                } else {
                  addToast(t('chat.ui.member_kicked_success', { nickname: member.nickname }), 'success');
                }
              },
              onError: (error) => {
                addToast(error.message || t('chat.ui.kick_member_failed'), 'error');
              }
            }
          );
        }
        break;
      case '방장 위임':
        if (window.confirm(t('chat.ui.transfer_ownership_confirm', { nickname: member.nickname }))) {
          transferOwnership({ roomId, newOwnerId: member.id });
        }
        break;
      case '1:1대화':
        onClose(); // Close the modal first
        createDirectChat({ partnerId: member.id });
        break;
      case '친구추가':
        sendFriendRequest(
          { receiverId: member.id },
          {
            onSuccess: () => {
              addToast(t('chat.ui.friend_request_sent', { nickname: member.nickname }), 'success');
            },
            onError: (error) => {
              const errorMessage = error.message || '';
              // "해당 요청을 처리할 수 없는 상태입니다" = 이미 친구 요청을 보낸 경우
              if (errorMessage.includes('처리할 수 없는 상태')) {
                addToast(t('chat.ui.friend_request_already_sent'), 'info');
              } else {
                addToast(errorMessage || t('chat.ui.friend_request_failed'), 'error');
              }
            }
          }
        );
        break;
      case '신고하기':
        setReportTargetMember(member);
        break;
      // TODO: Implement other actions (차단하기 등)
      default:
        alert(t('chat.ui.action_not_implemented', { nickname: member.nickname, action: action }));
        break;
    }
  };

  const toggleMenu = (memberId: number) => {
    setOpenMenuId(openMenuId === memberId ? null : memberId);
  };

  const handleMemberClick = (member: ChatRoomMember) => {
    onSelectMemberForProfile(member);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-overlay)" }}
      onClick={onClose}
    >
      <div
        className="theme-card rounded-3xl shadow-2xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex-shrink-0" style={{ borderColor: "var(--surface-border)" }}>
          <h2 className="text-lg font-semibold flex items-center" style={{ color: "var(--page-text)" }}>
            <Users size={20} className="mr-3 text-[var(--surface-muted-text)]" />
            {t('chat.ui.chat_members_count', { count: members.length.toString() })}
          </h2>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">
          {sortedMembers.map((member) => (
            <div key={member.id} className="group flex items-center justify-between p-2 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel)] hover:border-emerald-400 transition-colors">
              <div className="flex items-center cursor-pointer" onClick={() => handleMemberClick(member)}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
                  style={{ background: "var(--surface-panel-muted)", color: "var(--page-text)" }}
                >
                  {member.profileImageUrl ? (
                    <img src={member.profileImageUrl} alt={member.nickname} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.nickname.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="ml-4 font-medium" style={{ color: "var(--page-text)" }}>
                  {member.nickname}
                  {member.id === currentUserId && <span className="ml-2 text-sm font-semibold text-cyan-400">{t('chat.ui.me')}</span>}
                  {member.id === ownerId && <span className="ml-1 text-sm font-semibold text-yellow-400">{t('chat.ui.owner')}</span>}
                </p>
              </div>
              {member.id !== currentUserId && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {!member.isFriend && (
                    <button onClick={() => handleActionClick('친구추가', member)} className="p-2 text-[var(--surface-muted-text)] rounded-full transition-colors hover:bg-[var(--surface-panel-muted)]" title={t('chat.ui.add_friend')}>
                      <UserPlus size={18} />
                    </button>
                  )}
                  <button onClick={() => handleActionClick('1:1대화', member)} className="p-2 text-[var(--surface-muted-text)] rounded-full transition-colors hover:bg-[var(--surface-panel-muted)]" title={t('chat.ui.direct_chat')}>
                    <MessageSquare size={18} />
                  </button>
                  <div className="relative" ref={openMenuId === member.id ? menuRef : null}>
                    <button onClick={() => toggleMenu(member.id)} className="p-2 text-[var(--surface-muted-text)] rounded-full transition-colors hover:bg-[var(--surface-panel-muted)]" title={t('chat.ui.more_options')}>
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === member.id && (
                      <div className="absolute right-0 mt-2 w-48 theme-card rounded-2xl z-20 shadow-lg">
                        <ul className="py-1">
                          <li>
                            <button onClick={() => handleActionClick('차단하기', member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-[var(--surface-muted-text)] hover:bg-red-500/10 hover:text-red-400">
                              <Shield size={16} className="mr-3" /> {t('chat.ui.block')}
                            </button>
                          </li>
                          <li>
                            <button onClick={() => handleActionClick('신고하기', member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-[var(--surface-muted-text)] hover:bg-red-500/10 hover:text-red-400">
                              <ShieldAlert size={16} className="mr-3" /> {t('chat.ui.report')}
                            </button>
                          </li>
                          {isOwner && (
                            <>
                              <div className="my-1 h-px" style={{ background: "var(--surface-border)" }} />
                              <li>
                                <button onClick={() => handleActionClick('강퇴하기', member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                                  <UserX size={16} className="mr-3" /> {t('chat.ui.kick')}
                                </button>
                              </li>
                              <li>
                                <button onClick={() => handleActionClick('방장 위임', member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10">
                                  <Crown size={16} className="mr-3" /> {t('chat.ui.transfer_ownership')}
                                </button>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex-shrink-0 text-right" style={{ borderColor: "var(--surface-border)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
          >
            {t('chat.ui.close')}
          </button>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportTargetMember}
        onClose={() => setReportTargetMember(null)}
        targetMemberId={reportTargetMember?.id || 0}
        targetNickname={reportTargetMember?.nickname || ""}
      />
    </div>
  );
}
