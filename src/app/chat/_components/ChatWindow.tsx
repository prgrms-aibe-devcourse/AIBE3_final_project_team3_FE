"use client";

import Image, { ImageLoaderProps } from "next/image";

import ChatRoomInfoModal from "@/components/ChatRoomInfoModal";
import MemberProfileModal from "@/components/MemberProfileModal";
import ReportModal from "@/components/ReportModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAiFeedbackMutation, useGetGroupChatRoomDetailQuery, useLeaveChatRoom, useUploadFileMutation } from "@/global/api/useChatQuery";
import { MemberSummaryResp } from "@/global/types/auth.types";
import { AiFeedbackResp, ChatRoomMember, MessageResp } from "@/global/types/chat.types";
import { Loader2, LogOut, LucideIcon, MoreVertical, Phone, ShieldAlert, Sparkles, UserPlus, Users, Video } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InviteFriendModal from "./InviteFriendModal";
import LearningNoteModal from "./LearningNoteModal";
import MembersModal from "./MembersModal";
import MessageInput from "./MessageInput";
import Avatar from "boring-avatars";

const remoteImageLoader = ({ src }: ImageLoaderProps) => src;

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
    topic?: string;
  } | null;
  subscriberCount?: number;
  totalMemberCount?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

type MenuActionItem = {
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
  const { t, language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const previousScrollHeightRef = useRef<number>(0);

  // 그룹 채팅방 상세 정보 조회 (멤버 목록 포함)
  const isGroupChat = roomDetails?.type === 'group';
  const { data: groupDetailData } = useGetGroupChatRoomDetailQuery(
    isGroupChat && roomDetails ? roomDetails.id : null
  );

  // State for dropdown and modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRoomInfoModalOpen, setIsRoomInfoModalOpen] = useState(false);
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<ChatRoomMember | null>(null);

  // State for Learning Note Modal
  const [isLearningNoteModalOpen, setIsLearningNoteModalOpen] = useState(false);
  const [selectedMessageForAnalysis, setSelectedMessageForAnalysis] = useState<{ original: string; translated: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AiFeedbackResp | null>(null);

  // State to track which messages should show original text instead of translation
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(new Set());
  const [failedAvatarIds, setFailedAvatarIds] = useState<Set<number>>(new Set());

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

  const markAvatarAsFailed = (memberId: number) => {
    setFailedAvatarIds((prev) => {
      if (prev.has(memberId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(memberId);
      return next;
    });
  };

  const { mutate: leaveRoom, isPending: isLeaving } = useLeaveChatRoom();
  const { mutate: uploadFile, isPending: isUploadingFile } = useUploadFileMutation();
  const { mutate: analyzeFeedback, isPending: isAnalyzing } = useAiFeedbackMutation();

  const handleAnalyzeClick = (original: string, translated: string) => {
    setSelectedMessageForAnalysis({ original, translated });
    analyzeFeedback(
      { originalContent: original, translatedContent: translated },
      {
        onSuccess: (data) => {
          setAnalysisResult(data);
          setIsLearningNoteModalOpen(true);
        },
      }
    );
  };

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
    alert(t('chat.ui.block_user_todo'));
    setIsMenuOpen(false);
  };

  const handleReportUser = () => {
    setIsReportModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleLeaveRoom = () => {
    if (!roomDetails) return;
    if (confirm(t('chat.ui.leave_confirm'))) {
      leaveRoom({
        roomId: roomDetails.id,
        chatRoomType: roomDetails.type,
      });
    }
    setIsMenuOpen(false);
  };
  // --- End Dropdown Menu Logic ---

  // Scroll to bottom helper
  const scrollToBottom = () => {
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

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
      scrollToBottom();
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
      <main
        className="flex-1 flex items-center justify-center text-center h-full"
        style={{ background: "var(--surface-panel)" }}
      >
        <div>
          <div className="text-3xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold text-gray-300">
            {t('chat.ui.select_chat_title')}
          </h2>
          <p className="text-gray-500 mt-2">
            {t('chat.ui.select_chat_desc')}
          </p>
        </div>
      </main>
    );
  }

  // --- Dynamic Menu Items ---
  const groupMenuItems = [
    { label: t('chat.ui.invite'), icon: UserPlus, action: () => { setIsMenuOpen(false); setIsInviteModalOpen(true); } },
    { label: t('chat.ui.members'), icon: Users, action: () => { setIsMenuOpen(false); setIsMembersModalOpen(true); } },
    { label: t('chat.ui.leave'), icon: LogOut, action: handleLeaveRoom, danger: true, disabled: isLeaving },
  ];

  const directMenuItems = [
    { label: t('chat.ui.block'), icon: ShieldAlert, action: handleBlockUser, danger: true },
    { label: t('chat.ui.report'), icon: ShieldAlert, action: handleReportUser, danger: true },
    { label: t('chat.ui.leave'), icon: LogOut, action: handleLeaveRoom, danger: true, disabled: isLeaving },
  ];

  const menuItems = roomDetails.type === 'group' ? groupMenuItems : directMenuItems;
  const normalizeMemberId = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return null;
  };

  const resolvedMemberId = (() => {
    if (!member) {
      return null;
    }

    const rawMemberId = normalizeMemberId((member as { memberId?: unknown }).memberId);
    if (rawMemberId !== null) {
      return rawMemberId;
    }

    const fallbackId = normalizeMemberId((member as { id?: unknown }).id);
    return fallbackId;
  })();

  // 그룹 채팅방이면 상세 데이터의 ownerId 사용
  const effectiveOwnerId = isGroupChat && groupDetailData ? groupDetailData.ownerId : roomDetails?.ownerId;
  const isOwner = typeof effectiveOwnerId === "number" && resolvedMemberId === effectiveOwnerId;
  const isAiRoom = roomDetails?.type === "ai";

  const roomStatusLabel = (() => {
    if (!roomDetails) return "";
    if (roomDetails.type === "direct") {
      return subscriberCount === 2 ? t('chat.ui.online') : t('chat.ui.offline');
    }
    if (roomDetails.type === "ai") {
      return t('chat.ui.ai_tutor');
    }
    return t('chat.ui.participants_count', { count: subscriberCount.toString(), total: totalMemberCount.toString() });
  })();
  // --- End Dynamic Menu Items ---

  const loggedInNickname = typeof member?.nickname === "string" ? member.nickname : null;
  const directPartner = roomDetails?.type === 'direct' && Array.isArray(roomDetails.members)
    ? ((roomDetails.members as ChatRoomMember[]).find((m) => {
        const candidateId = normalizeMemberId(m.id);
        if (resolvedMemberId !== null) {
          return candidateId !== null && candidateId !== resolvedMemberId;
        }
        if (loggedInNickname) {
          return m.nickname !== loggedInNickname;
        }
        return true;
      }) ?? (roomDetails.members as ChatRoomMember[])[0])
    : null;

  const headerDisplayName = roomDetails
    ? roomDetails.type === 'direct'
      ? directPartner?.nickname || roomDetails.name
      : roomDetails.name
    : "";

  return (
    <main
      className="flex flex-col overflow-hidden h-full"
      style={{ background: "var(--surface-panel)" }}
    >
      {/* Chat Header */}
      <header
        className="flex items-center justify-between p-4 border-b flex-shrink-0"
        style={{ borderColor: "var(--surface-border)" }}
      >
        <button
          onClick={() => setIsRoomInfoModalOpen(true)}
          className="flex items-center min-w-0 rounded-lg p-2 -m-2 transition-colors group hover:bg-[var(--surface-panel-muted)]"
        >
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg group-hover:ring-2 group-hover:ring-emerald-400 transition-all overflow-hidden"
              style={{ background: "var(--surface-panel-muted)" }}
            >
              {roomDetails.type === 'group' ? (
                <Avatar
                  size={40}
                  name={roomDetails.topic || roomDetails.name}
                  variant="beam"
                  colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                />
              ) : (
                directPartner?.profileImageUrl || roomDetails.avatar
              )}
            </div>
          </div>
          <div className="ml-4 min-w-0 text-left">
            <h2 className="font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{headerDisplayName}</h2>
            {roomStatusLabel && (
              <p className="text-xs text-gray-400">{roomStatusLabel}</p>
            )}
          </div>
        </button>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white"><Video size={20} /></button>
          <button className="text-gray-400 hover:text-white"><Phone size={20} /></button>

          {/* Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-400 hover:text-white">
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 theme-popover rounded-md z-20">
                <ul className="py-1">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={item.action}
                        disabled={item.disabled}
                        className={`w-full text-left flex items-center px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${item.danger
                          ? "text-red-400 hover:bg-red-500 hover:text-white"
                          : "text-gray-300 hover:bg-[var(--surface-panel-muted)]"
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
          <div className="text-center text-red-400">{t('chat.ui.error_loading')}</div>
        ) : (
          <>
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            )}
            {!hasMore && messages.length > 0 && (
              <div className="text-center text-xs text-gray-500 py-2">{t('chat.ui.start_conversation')}</div>
            )}
            {messages.map((msg, idx) => {
              const messageKey = msg.id ?? `msg-${msg.sequence ?? idx}`;

              if (msg.messageType === 'SYSTEM') {
                let systemMessage = msg.content;
                try {
                  const parsed = JSON.parse(msg.content);
                  if (parsed.type && parsed.params) {
                    systemMessage = t(`chat.system.${parsed.type}`, parsed.params);
                  } else if (parsed.fallback) {
                    systemMessage = parsed.fallback;
                  }
                } catch (e) {
                  // Fallback to original content if not JSON
                }

                return (
                  <div key={messageKey} className="text-center my-2">
                    <p className="text-xs text-gray-500 italic px-4 py-1 inline-block rounded-full theme-surface-muted">
                      {systemMessage}
                    </p>
                  </div>
                );
              }

              const isUser = resolvedMemberId !== null && msg.senderId === resolvedMemberId;
              const hasTranslation = !!msg.translatedContent;
              // If it has translation, show translation by default. If user toggled, show original.
              // If no translation, always show original (msg.content).
              const isShowingOriginal = !hasTranslation || showOriginalIds.has(msg.id);
              const displayContent = isShowingOriginal ? msg.content : msg.translatedContent;
              const bubbleStyles = isUser
                ? {
                  background: "var(--chat-self-bg)",
                  color: "var(--chat-self-text)",
                  borderColor: "var(--chat-self-border)",
                  boxShadow: "var(--chat-self-shadow)",
                }
                : {
                  background: "var(--chat-other-bg)",
                  color: "var(--chat-other-text)",
                  borderColor: "var(--chat-other-border)",
                  boxShadow: "var(--chat-other-shadow)",
                };

              return (
                <div key={messageKey} className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (() => {
                    const activeMembers = isGroupChat ? groupDetailData?.members : roomDetails?.members;
                    const senderMember = activeMembers?.find((m: ChatRoomMember) => m.id === msg.senderId);
                    const hasProfileImage = Boolean(senderMember?.profileImageUrl && senderMember.profileImageUrl.trim() !== "");
                    const senderMemberId = typeof senderMember?.id === "number" ? senderMember.id : null;
                    const shouldShowFallback = !hasProfileImage || (senderMemberId != null && failedAvatarIds.has(senderMemberId));
                    const senderName = typeof msg.sender === "string" && msg.sender.trim().length > 0 ? msg.sender : "Unknown";
                    const senderInitial = senderName.charAt(0).toUpperCase();
                    return (
                      <button
                        onClick={() => senderMember && setSelectedMemberForProfile(senderMember)}
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-gray-400 transition-all overflow-hidden cursor-pointer mt-5"
                        style={{ background: "var(--surface-panel-muted)" }}
                        title={t('chat.ui.view_profile', { name: senderName })}
                      >
                        {shouldShowFallback || !senderMemberId ? (
                          senderInitial
                        ) : (
                          <Image
                            loader={remoteImageLoader}
                            unoptimized
                            src={senderMember!.profileImageUrl}
                            alt={senderName}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            onError={() => markAvatarAsFailed(senderMemberId)}
                          />
                        )}
                      </button>
                    );
                  })()}
                  <div className="flex flex-col gap-1 max-w-md">
                    {!isUser && (
                      <p className="text-xs font-semibold text-gray-400 px-1">{typeof msg.sender === "string" ? msg.sender : t('chat.ui.unknown_sender')}</p>
                    )}
                    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`p-3 rounded-2xl relative group border ${hasTranslation ? "cursor-pointer hover:opacity-95 transition" : ""}`}
                        onClick={() => hasTranslation && toggleOriginal(msg.id)}
                        title={hasTranslation ? t('chat.ui.toggle_translation') : ""}
                        style={bubbleStyles}
                      >

                        {msg.messageType === 'IMAGE' ? (
                          <div
                            className="max-w-full max-h-64 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(msg.content, '_blank');
                            }}
                          >
                            <Image
                              loader={remoteImageLoader}
                              unoptimized
                              src={msg.content}
                              alt="Sent image"
                              width={512}
                              height={512}
                              className="rounded-lg object-contain bg-black/20 max-h-64 w-auto"
                              sizes="(max-width: 768px) 80vw, 400px"
                              onLoadingComplete={() => shouldScrollRef.current && scrollToBottom()}
                            />
                          </div>
                        ) : msg.messageType === 'FILE' ? (
                          <a
                            href={msg.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 text-blue-300 underline break-all"
                          >
                            <span className="text-xl">📁</span>
                            {decodeURIComponent(msg.content.split('/').pop() || 'File')}
                          </a>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayContent}</p>
                        )}

                        {hasTranslation && (
                          <>
                            <div className="flex justify-end mt-1">
                              <span
                                className="text-[10px] tracking-wide px-1 rounded"
                                style={{ border: "1px solid currentColor", opacity: 0.75 }}
                              >
                                {isShowingOriginal ? t('chat.ui.original_label') : t('chat.ui.translated_label')}
                              </span>
                            </div>
                            {/* Learning Note Analysis Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent bubble click (toggle translation)
                                if (msg.translatedContent) {
                                  handleAnalyzeClick(msg.content, msg.translatedContent);
                                }
                              }}
                              disabled={isAnalyzing}
                              className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full theme-popover text-yellow-400 transition-all opacity-0 group-hover:opacity-100 z-10 ${isUser ? "-left-10" : "-right-10"
                                } ${isAnalyzing ? "opacity-50 cursor-wait" : ""}`}
                              title={t('chat.ui.ai_analysis')}
                            >
                              {isAnalyzing && selectedMessageForAnalysis?.original === msg.content ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Sparkles size={16} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-center space-y-1">
                        {msg.unreadCount > 0 && (
                          <p className="text-xs text-yellow-400 font-semibold">
                            {msg.unreadCount}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
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
        showTranslateToggle={!isAiRoom}
      />

      {/* Member List Modal */}
      {roomDetails && roomDetails.type === 'group' && (
        <>
          <MembersModal
            isOpen={isMembersModalOpen}
            onClose={() => setIsMembersModalOpen(false)}
            roomId={roomDetails.id}
            members={groupDetailData?.members || []}
            ownerId={groupDetailData?.ownerId || 0}
            currentUserId={resolvedMemberId ?? 0}
            isOwner={isOwner}
            onSelectMemberForProfile={setSelectedMemberForProfile} // Pass the function here
          />
          <InviteFriendModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            roomId={roomDetails.id}
            existingMembers={groupDetailData?.members || []}
          />
        </>
      )}

      {/* Learning Note Modal */}
      {selectedMessageForAnalysis && (
        <LearningNoteModal
          isOpen={isLearningNoteModalOpen}
          onClose={() => setIsLearningNoteModalOpen(false)}
          originalContent={selectedMessageForAnalysis.original}
          translatedContent={selectedMessageForAnalysis.translated}
          feedbackData={analysisResult}
        />
      )}

      {/* Report Modal (Direct Chat Only) */}
      {roomDetails?.type === 'direct' && member && (() => {
        // Find the partner (the other person in the direct chat)
        const safeMemberId = resolvedMemberId ?? undefined;
        const partnerIdFromMembers = normalizeMemberId(directPartner?.id);
        const partnerId = partnerIdFromMembers ?? messages.find(msg => safeMemberId === undefined || msg.senderId !== safeMemberId)?.senderId;
        const partnerName = directPartner?.nickname ?? roomDetails.name;
        return partnerId ? (
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetMemberId={partnerId}
            targetNickname={partnerName}
          />
        ) : null;
      })()}

      {/* Member Profile Modal */}
      {selectedMemberForProfile && (
        <MemberProfileModal
          isOpen={!!selectedMemberForProfile}
          onClose={() => setSelectedMemberForProfile(null)}
          member={selectedMemberForProfile}
          isCurrentUser={resolvedMemberId !== null && resolvedMemberId === selectedMemberForProfile.id}
        />
      )}

      {/* Chat Room Info Modal */}
      <ChatRoomInfoModal
        isOpen={isRoomInfoModalOpen}
        onClose={() => setIsRoomInfoModalOpen(false)}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
        roomDetails={roomDetails}
        currentUserId={resolvedMemberId ?? undefined}
        subscriberCount={subscriberCount}
        totalMemberCount={totalMemberCount}
      />
    </main>
  );
}
