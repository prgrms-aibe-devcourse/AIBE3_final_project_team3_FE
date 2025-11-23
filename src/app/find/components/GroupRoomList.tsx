"use client";

import { useGetPublicGroupChatRoomsQuery } from "@/global/api/useChatQuery";
import { GroupChatRoomResp } from "@/global/types/chat.types";
import { Users, Lock, Hash } from "lucide-react";
import { useRouter } from "next/navigation";

// Individual Group Room Card Component
const GroupRoomCard = ({ room }: { room: GroupChatRoomResp }) => {
  const router = useRouter();

  const handleJoinRoom = () => {
    // Here you would handle the logic to join a room.
    // If the room has a password, you might show a prompt.
    // After successfully joining, you would navigate to the chat room.
    if (room.hasPassword) {
      const password = prompt("이 채팅방은 비밀번호가 필요합니다. 비밀번호를 입력하세요:");
      // Add logic to verify password and join
      if (password) {
        alert("비밀번호 입력 기능은 추후 구현될 예정입니다.");
        // router.push(`/chat/group/${room.id}`);
      }
    } else {
      alert("공개 채팅방 참여 기능은 추후 구현될 예정입니다.");
      // router.push(`/chat/group/${room.id}`);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col justify-between hover:border-emerald-500 transition-all duration-300">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white break-all">{room.name}</h3>
          {room.hasPassword && <Lock size={16} className="text-gray-400 flex-shrink-0 ml-2" />}
        </div>
        <p className="text-sm text-gray-400 mb-3 line-clamp-2 h-[40px]">{room.description || "채팅방 설명이 없습니다."}</p>
        <div className="flex items-center text-xs text-gray-400 mb-4">
          <Hash size={14} className="mr-1" />
          <span>{room.topic || "자유 주제"}</span>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center text-sm text-gray-300">
          <Users size={16} className="mr-2" />
          <span>{room.memberCount} / 50</span>
        </div>
        <button
          onClick={handleJoinRoom}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Join
        </button>
      </div>
    </div>
  );
};


// Main Component to Fetch and Display the List
export default function GroupRoomList() {
  const { data: rooms, isLoading, error } = useGetPublicGroupChatRoomsQuery();

  if (isLoading) {
    return (
      <div className="text-center text-white">
        <p>Loading group chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400">
        <p>Error loading groups: {error.message}</p>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center text-gray-400">
        <p>No public group chats found. Why not create one?</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {rooms.map((room) => (
        <GroupRoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
