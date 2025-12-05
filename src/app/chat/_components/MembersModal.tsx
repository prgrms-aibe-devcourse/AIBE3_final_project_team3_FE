"use client";

import { useState, useEffect, useRef } from "react";
import { Users, UserPlus, MessageSquare, Shield, ShieldAlert, MoreVertical, UserX, Crown } from "lucide-react";
import { ChatRoomMember } from "@/global/types/chat.types";
import { useKickMemberMutation, useTransferOwnershipMutation, useCreateDirectChat } from "@/global/api/useChatQuery";
import { useSendFriendRequest } from "@/global/api/useFriendshipMutation";
import { useToastStore } from "@/global/stores/useToastStore";
import ReportModal from "@/components/ReportModal";

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  members: ChatRoomMember[];
  ownerId: number;
  currentUserId: number;
  isOwner: boolean;
}

export default function MembersModal({ isOpen, onClose, roomId, members, ownerId, currentUserId, isOwner }: MembersModalProps) {
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
        if (window.confirm(`'${member.nickname}'님을 정말로 강퇴하시겠습니까?`)) {
          kickMember({ roomId, memberId: member.id });
        }
        break;
      case '방장 위임':
        if (window.confirm(`'${member.nickname}'님에게 방장을 위임하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
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
              addToast(`${member.nickname}님에게 친구 요청을 보냈습니다.`, 'success');
            },
            onError: (error) => {
              const errorMessage = error.message || '';
              // "해당 요청을 처리할 수 없는 상태입니다" = 이미 친구 요청을 보낸 경우
              if (errorMessage.includes('처리할 수 없는 상태')) {
                addToast('이미 친구 신청을 보낸 상태입니다.', 'info');
              } else {
                addToast(errorMessage || '친구 요청을 보내지 못했습니다.', 'error');
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
        alert(`${member.nickname}님에게 ${action} 액션을 실행합니다. (구현 필요)`);
        break;
    }
  };

  const toggleMenu = (memberId: number) => {
    setOpenMenuId(openMenuId === memberId ? null : memberId);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Users size={20} className="mr-3 text-gray-400" />
            채팅방 멤버 ({members.length}명)
          </h2>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">
          {sortedMembers.map((member) => (
            <div key={member.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-semibold text-white">
                  {member.nickname.charAt(0).toUpperCase()}
                </div>
                <p className="ml-4 font-medium text-gray-200">
                  {member.nickname}
                  {member.id === currentUserId && <span className="ml-2 text-sm font-semibold text-cyan-400">(나)</span>}
                  {member.id === ownerId && <span className="ml-1 text-sm font-semibold text-yellow-400">(방장)</span>}
                </p>
              </div>
              {member.id !== currentUserId && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {!member.isFriend && (
                    <button onClick={() => handleActionClick('친구추가', member)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors" title="친구 추가">
                      <UserPlus size={18} />
                    </button>
                  )}
                  <button onClick={() => handleActionClick('1:1대화', member)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors" title="1:1 대화">
                    <MessageSquare size={18} />
                  </button>
                  <div className="relative" ref={openMenuId === member.id ? menuRef : null}>
                    <button onClick={() => toggleMenu(member.id)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors" title="더 보기">
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === member.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-20">
                        <ul className="py-1">
                          <li>
                            <button onClick={() => handleActionClick('차단하기', member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400">
                              <Shield size={16} className="mr-3" /> 차단하기
                            </button>
                          </li>
                          <li>
                            <button onClick={() => handleActionClick('신고하기', member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400">
                              <ShieldAlert size={16} className="mr-3" /> 신고하기
                            </button>
                          </li>
                          {isOwner && (
                            <>
                              <div className="my-1 h-px bg-gray-700" />
                              <li>
                                <button onClick={() => handleActionClick('강퇴하기', member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/20">
                                  <UserX size={16} className="mr-3" /> 강퇴하기
                                </button>
                              </li>
                              <li>
                                <button onClick={() => handleActionClick('방장 위임', member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/20">
                                  <Crown size={16} className="mr-3" /> 방장 위임
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
        <div className="p-4 border-t border-gray-700 flex-shrink-0 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            닫기
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
