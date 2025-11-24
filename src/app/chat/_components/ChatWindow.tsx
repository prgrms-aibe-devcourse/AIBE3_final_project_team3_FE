"use client";

import { useRef, useEffect } from "react";
import { useChatMessagesQuery } from "@/global/api/useChatQuery";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MessageResp } from "@/global/types/chat.types";
import MessageInput from "./MessageInput";
import { MoreVertical, Phone, Video, Loader2 } from "lucide-react";
import { useChatStore } from "@/global/stores/useChatStore";

export default function ChatWindow() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { selectedRoomId, rooms } = useChatStore(); // Get selectedRoomId and rooms
  const member = useLoginStore((state) => state.member); // Correctly get member

  const selectedRoom = selectedRoomId ? rooms[selectedRoomId.split('-')[0] as '1v1' | 'group' | 'ai']?.find(room => room.id === selectedRoomId) : null;

  const roomId = selectedRoom ? Number(selectedRoom.id.split('-')[1]) : 0;
  const conversationType = selectedRoom?.type || '';

  const { data: chatData, isLoading, error } = useChatMessagesQuery(roomId, conversationType);

  const messages = chatData?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    // TODO: Implement real message sending logic via WebSocket
    console.log("Sending message:", text);
  };

  if (!selectedRoom) {
    return (
      <main className="flex-1 flex items-center justify-center text-center bg-gray-850">
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
    <main className="flex-1 flex flex-col bg-gray-850">
      {/* Chat Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
              {selectedRoom.avatar}
            </div>
            {selectedRoom.type === "1v1" && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-gray-850"></span>
            )}
          </div>
          <div className="ml-4">
            <h2 className="font-semibold text-white">{selectedRoom.name}</h2>
            <p className="text-xs text-gray-400">
              {selectedRoom.type === "1v1" ? "온라인" : `${(selectedRoom as any).members?.length || 0}명`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white">
            <Video size={20} />
          </button>
          <button className="text-gray-400 hover:text-white">
            <Phone size={20} />
          </button>
          <button className="text-gray-400 hover:text-white">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400">메시지를 불러오는 중 오류가 발생했습니다.</div>
        ) : (
          messages.map((msg: MessageResp, index) => {
            const isUser = msg.senderId === member?.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && showSender && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm flex-shrink-0">
                    {/* Placeholder for partner avatar */}
                  </div>
                )}
                {!isUser && !showSender && <div className="w-8 flex-shrink-0" />}

                <div className={`flex flex-col max-w-md ${isUser ? "items-end" : "items-start"}`}>
                  {showSender && !isUser && (
                    <p className="text-xs text-gray-400 mb-1">{msg.sender}</p>
                  )}
                  <div className={`px-4 py-2 rounded-xl ${isUser ? "bg-emerald-600 text-white rounded-br-none" : "bg-gray-700 text-gray-200 rounded-bl-none"}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </main>
  );
}
