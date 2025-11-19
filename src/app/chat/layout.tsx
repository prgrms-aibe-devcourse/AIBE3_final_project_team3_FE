"use client";

import ChatSidebar from "./_components/ChatSidebar";
import { useChatStore } from "@/global/stores/useChatStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserChatRoomsQuery } from "@/global/api/useChatQuery";
import { useLoginStore } from "@/global/stores/useLoginStore";

// 로딩 중에 표시할 스켈레톤 컴포넌트
const SidebarSkeleton = () => (
  <aside className="w-1/4 min-w-[300px] max-w-[400px] bg-gray-800 flex flex-col border-r border-gray-700 p-4">
    <div className="h-8 bg-gray-700 rounded w-1/3 mb-6 animate-pulse"></div>
    <div className="h-10 bg-gray-700 rounded-lg w-full mb-4 animate-pulse"></div>
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center p-2 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-700"></div>
          <div className="ml-4 flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </aside>
);


export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeTab, setActiveTab, rooms, selectedRoomId, setSelectedRoomId, setChatRooms } =
    useChatStore();
  const { accessToken } = useLoginStore();
  const router = useRouter();

  // 1. API로부터 채팅방 목록을 가져옵니다.
  const { data: apiRooms, isLoading, error, isSuccess } = useUserChatRoomsQuery();

  // 2. API 호출이 성공하면, 스토어의 상태를 업데이트합니다.
  useEffect(() => {
    if (isSuccess && apiRooms) {
      setChatRooms(apiRooms);
    }
  }, [isSuccess, apiRooms, setChatRooms]);


  const handleSetSelectedRoom = (roomId: string | null) => {
    setSelectedRoomId(roomId);
    if (roomId) {
      router.push(`/chat/${roomId}`);
    } else {
      // 해당 탭에 방이 없을 경우 기본 채팅 페이지로 이동
      router.push('/chat');
    }
  };

  const handleSetActiveTab = (tab: "1v1" | "group" | "ai") => {
    setActiveTab(tab);
    // 탭 변경 시, 해당 탭의 첫번째 방을 선택하거나 방이 없으면 null로 설정
    const firstRoomInTab = rooms[tab]?.[0];
    handleSetSelectedRoom(firstRoomInTab?.id || null);
  };
  
  // 3. 데이터 로딩 완료 후, 선택된 방이 없으면 첫번째 방을 선택
  useEffect(() => {
    // 데이터 로딩이 완료되고, accessToken이 있으며, 아직 방이 선택되지 않았을 때만 실행
    if (isSuccess && accessToken && !selectedRoomId && rooms[activeTab].length > 0) {
      const firstRoomId = rooms[activeTab][0].id;
      setSelectedRoomId(firstRoomId);
      router.replace(`/chat/${firstRoomId}`);
    }
  }, [activeTab, rooms, selectedRoomId, setSelectedRoomId, router, isSuccess, accessToken]);

  // 4. 로딩 및 에러 상태 처리
  if (isLoading) {
    return (
      <div className="flex h-full bg-gray-900 text-white">
        <SidebarSkeleton />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full bg-gray-900 text-white">
        <aside className="w-1/4 min-w-[300px] max-w-[400px] bg-gray-800 p-4 border-r border-gray-700">
          <h1 className="text-xl font-bold text-red-500">Error</h1>
          <p className="text-gray-300 mt-4">Failed to load chat rooms.</p>
          <p className="text-xs text-red-400 mt-2">{error.message}</p>
        </aside>
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    );
  }

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
