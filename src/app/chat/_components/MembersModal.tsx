"use client";

import { Users, UserPlus, MessageSquare, Shield, ShieldAlert } from "lucide-react";
import { ChatRoomMember } from "@/global/types/chat.types";

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ChatRoomMember[];
  ownerId: number;
  currentUserId: number;
}

export default function MembersModal({ isOpen, onClose, members, ownerId, currentUserId }: MembersModalProps) {
  if (!isOpen) return null;

  // Sort members to show the current user first, then by nickname
  const sortedMembers = [...members].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return a.nickname.localeCompare(b.nickname);
  });

  const handleActionClick = (action: string, memberName: string) => {
    // TODO: Implement actual actions
    alert(`${memberName}님에게 ${action} 액션을 실행합니다. (구현 필요)`);
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
                  {/* TODO: This should be replaced with real profile images when available */}
                  {member.nickname.charAt(0).toUpperCase()}
                </div>
                <p className="ml-4 font-medium text-gray-200">
                  {member.nickname}
                  {member.id === currentUserId && <span className="ml-2 text-sm font-semibold text-cyan-400">(나)</span>}
                  {member.id === ownerId && <span className="ml-1 text-sm font-semibold text-yellow-400">(방장)</span>}
                </p>
              </div>
              {member.id !== currentUserId && (
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => handleActionClick('친구추가', member.nickname)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors">
                    <UserPlus size={18} />
                  </button>
                  <button onClick={() => handleActionClick('1:1대화', member.nickname)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors">
                    <MessageSquare size={18} />
                  </button>
                  <button onClick={() => handleActionClick('차단하기', member.nickname)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-full transition-colors">
                    <Shield size={18} />
                  </button>
                  <button onClick={() => handleActionClick('신고하기', member.nickname)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-full transition-colors">
                    <ShieldAlert size={18} />
                  </button>
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
    </div>
  );
}
