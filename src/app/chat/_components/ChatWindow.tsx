"use client";

import { useRef, useEffect, FormEvent, useLayoutEffect } from "react";
import { MessageResp } from "@/global/types/chat.types";
import { Loader2, MoreVertical, Phone, Video } from "lucide-react";
import { MemberSummaryResp } from "@/global/types/auth.types";

// Define props for the component
interface ChatWindowProps {
  messages: MessageResp[];
  member: MemberSummaryResp | null;
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  error: Error | null;
  roomDetails: {
    id: number;
    name: string;
    type: string;
    avatar?: string;
    members?: any[]; // Simplified for now
  } | null;
  subscriberCount?: number;
  totalMemberCount?: number;
}

export default function ChatWindow({
  messages,
  member,
  onSendMessage,
  isLoading,
  error,
  roomDetails,
  subscriberCount = 0,
  totalMemberCount = 0,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

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

  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (container) {
      const threshold = 50; // pixels from bottom
      const position = container.scrollTop + container.clientHeight;
      const height = container.scrollHeight;
      shouldScrollRef.current = position >= height - threshold;
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("messageInput") as HTMLInputElement;
    const text = input.value;
    if (text.trim()) {
      shouldScrollRef.current = true; // Always scroll when we send a message
      onSendMessage(text);
      form.reset();
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

  return (
    <main className="flex flex-col bg-gray-850 overflow-hidden h-full">
      {/* Chat Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
              {roomDetails.avatar}
            </div>
            {roomDetails.type === "direct" && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-gray-850"></span>
            )}
          </div>
          <div className="ml-4">
            <h2 className="font-semibold text-white">{roomDetails.name}</h2>
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
          <button className="text-gray-400 hover:text-white"><MoreVertical size={20} /></button>
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
          messages.map((msg) => {
            const isUser = msg.senderId === member?.memberId;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0" />
                )}
                <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`max-w-md p-3 rounded-lg ${isUser ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-200"}`}>
                    {!isUser && <p className="text-xs font-semibold pb-1">{msg.sender}</p>}
                    <p className="text-sm">{msg.content}</p>
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            name="messageInput"
            type="text"
            placeholder="Type a message..."
            autoComplete="off"
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
