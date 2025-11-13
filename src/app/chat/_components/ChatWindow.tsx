"use client";

import { useState, useRef, useEffect } from "react";
import { ChatRoom, Message } from "@/global/stores/useChatStore";
import { mockMessages } from "../_lib/mock-data";
import MessageInput from "./MessageInput";
import { MoreVertical, Phone, Video } from "lucide-react";

type ChatWindowProps = {
  room: ChatRoom | null;
};

export default function ChatWindow({ room }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (room) {
      setMessages(mockMessages[room.id] || []);
    } else {
      setMessages([]);
    }
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    if (!room) return;

    const newMessage: Message = {
      id: `msg-user-${Date.now()}`,
      text,
      sender: { name: "You", avatar: "" },
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);

    // Mock AI or other user's reply
    setTimeout(() => {
      const reply: Message = {
        id: `msg-reply-${Date.now()}`,
        text: "This is a mock reply.",
        sender: { name: room.name, avatar: room.avatar },
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1000);
  };

  if (!room) {
    return (
      <main className="flex-1 flex items-center justify-center text-center">
        <div>
          <div className="text-3xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold text-gray-300">
            Select a chat to start messaging
          </h2>
          <p className="text-gray-500 mt-2">
            Choose a friend, group, or AI tutor from the sidebar.
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
              {room.avatar}
            </div>
            {room.type === "1v1" && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-gray-850"></span>
            )}
          </div>
          <div className="ml-4">
            <h2 className="font-semibold text-white">{room.name}</h2>
            <p className="text-xs text-gray-400">
              {room.type === "1v1"
                ? "Online"
                : `${Object.keys(mockMessages[room.id] || {}).length} members`}
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
        {messages.map((msg, index) => {
          const isUser = msg.sender.name === "You";
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showSender =
            !prevMsg || prevMsg.sender.name !== msg.sender.name;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && showSender && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm flex-shrink-0">
                  {msg.sender.avatar}
                </div>
              )}
              {!isUser && !showSender && <div className="w-8 flex-shrink-0" />}

              <div
                className={`flex flex-col max-w-md ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                {showSender && !isUser && (
                  <p className="text-xs text-gray-400 mb-1">
                    {msg.sender.name}
                  </p>
                )}
                <div
                  className={`px-4 py-2 rounded-xl ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-gray-700 text-gray-200 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">{msg.timestamp}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </main>
  );
}
