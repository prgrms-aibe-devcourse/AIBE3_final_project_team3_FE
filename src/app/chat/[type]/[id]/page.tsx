"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useChatMessagesQuery } from "@/global/api/useChatQuery";
import { getStompClient, connect, disconnect } from "@/global/stomp/stompClient";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MessageResp } from "@/global/types/chat.types";
import type { IMessage } from "@stomp/stompjs";

export default function ChatRoomPage() {
  const params = useParams();
  const conversationType = params.type as string;
  const roomId = Number(params.id);
  const member = useLoginStore((state) => state.member);

  const { data, isLoading, error } = useChatMessagesQuery(roomId, conversationType);
  const [messages, setMessages] = useState<MessageResp[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId || !member || !conversationType) return;

    const { accessToken } = useLoginStore.getState();
    if (!accessToken) {
      console.error("Access token is not available. Cannot connect to STOMP.");
      return;
    }

    let subscription: any;

    connect(accessToken, () => {
      const client = getStompClient();
      const destination = `/topic/${conversationType}/rooms/${roomId}`;
      subscription = client.subscribe(
        destination,
        (message: IMessage) => {
          const receivedMessage: MessageResp = JSON.parse(message.body);
          setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        }
      );
      console.log(`Subscribed to ${destination}`);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log(`Unsubscribed from /topic/${conversationType}/rooms/${roomId}`);
      }
      disconnect();
    };
  }, [roomId, member, conversationType]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (newMessage.trim() === "" || !member) {
      return;
    }

    const client = getStompClient();

    if (client.connected) {
      client.publish({
        destination: "/app/chats/sendMessage",
        body: JSON.stringify({
          roomId: roomId,
          content: newMessage,
          messageType: "TEXT",
          senderId: member.memberId,
          conversationType: conversationType.toUpperCase(),
        }),
      });
      setNewMessage("");
    } else {
      console.error("Client is not connected.");
      alert("웹소켓 연결이 활성화되지 않았습니다. 페이지를 새로고침 해주세요.");
    }
  };

  if (isLoading || !member) {
    return <div className="text-center text-white p-8">Loading Chat Room...</div>;
  }
  if (error) return <div className="text-center text-red-400 p-8">Error: {error.message}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Chat Room #{roomId} ({conversationType})</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.senderId === member?.memberId ? "justify-end" : "justify-start"
            }`}
          >
            {msg.senderId !== member?.memberId && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0"></div>
            )}
            <div
              className={`max-w-md p-3 rounded-lg ${
                msg.senderId === member?.memberId
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-700 text-gray-200"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-500"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
