"use client";

import ChatSidebar from "./_components/ChatSidebar";
import { useChatStore } from "@/global/stores/useChatStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeTab, setActiveTab, rooms, selectedRoomId, setSelectedRoomId } =
    useChatStore();
  const router = useRouter();

  const handleSetSelectedRoom = (roomId: string | null) => {
    setSelectedRoomId(roomId);
    if (roomId) {
      router.push(`/chat/${roomId}`);
    } else {
      router.push('/chat');
    }
  };

  const handleSetActiveTab = (tab: "1v1" | "group" | "ai") => {
    setActiveTab(tab);
    const firstRoomInTab = rooms[tab][0];
    if (firstRoomInTab) {
      handleSetSelectedRoom(firstRoomInTab.id);
    } else {
      handleSetSelectedRoom(null);
    }
  };
  
  // Ensure a room is selected on initial load if there isn't one
  useEffect(() => {
    if (!selectedRoomId && rooms[activeTab].length > 0) {
      const firstRoomId = rooms[activeTab][0].id;
      setSelectedRoomId(firstRoomId);
      router.replace(`/chat/${firstRoomId}`);
    }
  }, [activeTab, rooms, selectedRoomId, setSelectedRoomId, router]);


  return (
    <div className="flex h-full bg-gray-900 text-white">
      <ChatSidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        rooms={rooms[activeTab]}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={handleSetSelectedRoom}
      />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}