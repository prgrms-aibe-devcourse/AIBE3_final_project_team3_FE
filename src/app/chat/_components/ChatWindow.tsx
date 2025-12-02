"use client";

import { useLeaveChatRoom, useUploadFileMutation } from "@/global/api/useChatQuery";
import { MemberSummaryResp } from "@/global/types/auth.types";
import { MessageResp } from "@/global/types/chat.types";
import { Loader2, LogOut, LucideIcon, MoreVertical, Phone, ShieldAlert, Users, Video } from "lucide-react"; // LucideIcon 추가
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import MembersModal from "./MembersModal";
import MessageInput from "./MessageInput";

// Define props for the component
interface ChatWindowProps {
  messages: MessageResp[];
  member: MemberSummaryResp | null;
  onSendMessage: (message: { text: string; isTranslateEnabled: boolean }) => void;
  isLoading: boolean;
  error: Error | null;
  roomDetails: {
    id: number;
    name: string;
    type: string;
    avatar?: string;
    ownerId?: number;
    members?: any[];
  } | null;
  subscriberCount?: number;
  totalMemberCount?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

type MenuActionItem = { // MenuActionItem 타입 정의도 추가 (만약 누락되었다면)
  label: string;
  icon: LucideIcon;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export default function ChatWindow({
  messages,
  member,
  onSendMessage,
  isLoading,
  error,
  roomDetails,
  subscriberCount = 0,
  totalMemberCount = 0,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const previousScrollHeightRef = useRef<number>(0);

  // State for dropdown and modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // State to track which messages should show original text instead of translation
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(new Set());

  const menuRef = useRef<HTMLDivElement>(null);

  const toggleOriginal = (messageId: string) => {
    setShowOriginalIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const { mutate: leaveRoom, isPending: isLeaving } = useLeaveChatRoom();
  const { mutate: uploadFile, isPending: isUploadingFile } = useUploadFileMutation();

  // --- Dropdown Menu Logic ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileSelect = (file: File) => {
    if (file && roomDetails) {
      const messageType = file.type.startsWith("image/") ? "IMAGE" : "FILE";
      uploadFile({
        roomId: roomDetails.id,
        chatRoomType: roomDetails.type,
        file: file,
        messageType: messageType,
      });
    }
  };

  const handleBlockUser = () => {
    // TODO: Implement block user logic
    alert("사용자를 차단합니다. (구현 필요)");
    setIsMenuOpen(false);
  };

  const handleReportUser = () => {
    // TODO: Implement report user logic
    alert("사용자를 신고합니다. (구현 필요)");
    setIsMenuOpen(false);
  };

  const handleLeaveRoom = () => {
    if (!roomDetails) return;
    if (confirm("정말로 이 채팅방을 나가시겠습니까? 채팅 기록이 모두 삭제되며 복구할 수 없습니다.")) {
      leaveRoom({
        roomId: roomDetails.id,
        chatRoomType: roomDetails.type,
      });
    }
    setIsMenuOpen(false);
  };
  // --- End Dropdown Menu Logic ---


  // On initial load or when room changes, scroll to bottom.
  useLayoutEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
      shouldScrollRef.current = true;
    }
  }, [roomDetails?.id]);

  // After messages update, scroll to bottom only if we were already at the bottom.
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container && shouldScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Restore scroll position after loading more messages
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container && isLoadingMore === false && previousScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeightRef.current;
      if (scrollDifference > 0) {
        container.scrollTop = scrollDifference;
        console.log(`[Pagination] Restored scroll position: ${scrollDifference}px`);
      }
      previousScrollHeightRef.current = 0;
    }
  }, [isLoadingMore]);

  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (container) {
      // Check if we're at the bottom (for auto-scroll on new messages)
      const threshold = 50;
      const position = container.scrollTop + container.clientHeight;
      const height = container.scrollHeight;
      shouldScrollRef.current = position >= height - threshold;

      // Check if we're at the top (for loading more messages)
      const scrollTop = container.scrollTop;
      if (scrollTop < 100 && hasMore && !isLoadingMore && onLoadMore) {
        console.log('[Pagination] Loading more messages...');
        previousScrollHeightRef.current = container.scrollHeight;
        onLoadMore();
      }
    }
  };


  if (!roomDetails) {
    return (
      <main className="flex-1 flex items-center justify-center text-center bg-gray-850 h-full">
        <div>
          <div className="text-3xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold text-gray-300">
            채팅을 선택하여 메시지를 시작하세요
          </h2>
          <p className="text-gray-500 mt-2">
            사이드바에서 친구, 그룹 또는 AI 튜터를 선택하세요.
          </p>
        </div>
      </main>
    );
  }

  // --- Dynamic Menu Items ---
  const groupMenuItems = [
    { label: "멤버 보기", icon: Users, action: () => { setIsMenuOpen(false); setIsMembersModalOpen(true); } },
    { label: "채팅방 나가기", icon: LogOut, action: handleLeaveRoom, danger: true, disabled: isLeaving },
  ];

  const directMenuItems = [
    { label: "차단하기", icon: ShieldAlert, action: handleBlockUser, danger: true },
    { label: "신고하기", icon: ShieldAlert, action: handleReportUser, danger: true },
    { label: "채팅방 나가기", icon: LogOut, action: handleLeaveRoom, danger: true, disabled: isLeaving },
  ];

  const menuItems = roomDetails.type === 'group' ? groupMenuItems : directMenuItems;
  const isOwner = member?.id === roomDetails?.ownerId;
  // --- End Dynamic Menu Items ---

  return (
    <main className="flex flex-col bg-gray-850 overflow-hidden h-full">
      {/* Chat Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
              {roomDetails.avatar}
            </div>
            {roomDetails.type === "direct" && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-gray-850"></span>
            )}
          </div>
          <div className="ml-4 min-w-0">
            <h2 className="font-semibold text-white truncate">{roomDetails.name}</h2>
            <p className="text-xs text-gray-400">
              {roomDetails.type === "direct"
                ? (subscriberCount === 2 ? "온라인" : "오프라인")
                : `${subscriberCount}명 접속 중 / ${totalMemberCount}명`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white"><Video size={20} /></button>
          <button className="text-gray-400 hover:text-white"><Phone size={20} /></button>

          {/* Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-400 hover:text-white">
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg z-20 border border-gray-700">
                <ul className="py-1">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={item.action}
                        disabled={item.disabled}
                        className={`w-full text-left flex items-center px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${item.danger
                            ? "text-red-400 hover:bg-red-500 hover:text-white"
                            : "text-gray-300 hover:bg-gray-700"
                          }`}
                      >
                        <item.icon size={16} className="mr-3" />
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={messageContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400">메시지를 불러오는 중 오류가 발생했습니다.</div>
        ) : (
          <>
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            )}
            {!hasMore && messages.length > 0 && (
              <div className="text-center text-xs text-gray-500 py-2">대화의 시작입니다.</div>
            )}
            {messages.map((msg) => {
              if (msg.messageType === 'SYSTEM') {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <p className="text-xs text-gray-500 italic px-4 py-1 bg-gray-800 rounded-full inline-block">
                      {msg.content}
                    </p>
                  </div>
                );
              }

              const isUser = msg.senderId === member?.id;
              const hasTranslation = !!msg.translatedContent;
              // If it has translation, show translation by default. If user toggled, show original.
              // If no translation, always show original (msg.content).
              const isShowingOriginal = !hasTranslation || showOriginalIds.has(msg.id);
              const displayContent = isShowingOriginal ? msg.content : msg.translatedContent;

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0" />
                  )}
                  <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`max-w-md p-3 rounded-lg relative group ${isUser ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-200"
                        } ${hasTranslation ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
                      onClick={() => hasTranslation && toggleOriginal(msg.id)}
                      title={hasTranslation ? "클릭하여 원문/번역 전환" : ""}
                    >
                      {!isUser && <p className="text-xs font-semibold pb-1">{msg.sender}</p>}
                      <p className="text-sm whitespace-pre-wrap">{displayContent}</p>

                      {hasTranslation && (
                        <div className="flex justify-end mt-1">
                          <span className="text-[10px] opacity-60 border border-white/20 rounded px-1">
                            {isShowingOriginal ? "Original" : "Translated"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      {msg.unreadCount > 0 && (
                        <p className="text-xs text-yellow-400 font-semibold">
                          {msg.unreadCount}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={(message) => {
          shouldScrollRef.current = true; // Always scroll when we send a message
          onSendMessage(message);
        }}
        onFileSelect={handleFileSelect}
        isUploading={isUploadingFile}
      />

      {/* Member List Modal */}
      {roomDetails && roomDetails.type === 'group' && (
        <MembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          roomId={roomDetails.id}
          members={roomDetails.members || []}
          ownerId={roomDetails.ownerId || 0}
          currentUserId={member?.id ?? 0}
          isOwner={isOwner}
        />
      )}
    </main>
  );
}