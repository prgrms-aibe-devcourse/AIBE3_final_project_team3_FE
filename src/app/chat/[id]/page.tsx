"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useChatMessagesQuery } from "@/global/api/useChatQuery";
import { getStompClient, connect, disconnect } from "@/global/stomp/stompClient";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MessageResp } from "@/global/types/chat.types"; // MessageResp 임포트
import { components } from "@/global/backend/schema"; // components 임포트 유지
import type { IMessage } from "@stomp/stompjs";

// type MessageResp = components["schemas"]["MessageResp"]; // 이 줄은 이제 필요 없음

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = Number(params.id);
  const { member } = useLoginStore(); // Removed setMember as it's not used here

  const { data: initialMessages, isLoading, error } = useChatMessagesQuery(roomId);
  const [messages, setMessages] = useState<MessageResp[]>([]);
  const [newMessage, setNewMessage] = useState("");
  //const [isSocketConnected, setIsSocketConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId || !member) return;

    const { accessToken } = useLoginStore.getState();
    if (!accessToken) {
      console.error("Access token is not available. Cannot connect to STOMP.");
      return;
    }
    console.log("ChatRoomPage: Calling connect with accessToken (first 10 chars):", accessToken ? accessToken.substring(0, 10) + "..." : "null"); // 로그 추가

    let subscription: any;

    connect(accessToken, () => {
      const client = getStompClient();
      subscription = client.subscribe(
        `/topic/rooms/${roomId}`,
        (message: IMessage) => {
          const receivedMessage: MessageResp = JSON.parse(message.body);
          setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        }
      );
      console.log(`Subscribed to /topic/rooms/${roomId}`);
      //setIsSocketConnected(true);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log(`Unsubscribed from /topic/rooms/${roomId}`);
      }
      disconnect();
      //setIsSocketConnected(false);
    };
  }, [roomId, member]); // Dependency array: roomId and member. accessToken is retrieved inside connect.

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSendMessage triggered");

    if (newMessage.trim() === "") {
      console.log("Exiting: newMessage is empty.");
      return;
    }
    if (!member) {
      console.error("Exiting: User member data is not available. Please wait for it to load.");
      alert("사용자 정보가 로딩중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    console.log("Member object in handleSendMessage:", member); // 로그 추가
    console.log("Current member ID:", member.memberId); //로그 추가
      console.log("Getting STOMP client...");
    const client = getStompClient();

    if (client.connected) { //isSocketConnected &&
      console.log("Client is connected. Publishing message...");
      client.publish({
        destination: "/app/chats/sendMessage",
        body: JSON.stringify({
          roomId: roomId,
          content: newMessage,
          messageType: "TEXT",
          senderId: member.memberId,
        }),
      });
      console.log("Message published.");
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
        <h1 className="text-xl font-bold text-white">Chat Room #{roomId}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
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
        <div ref={messagesEndRef} />
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
            disabled={!newMessage.trim()} // || !isSocketConnected
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
