"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatRoom } from "@/global/stores/useChatStore";
import {
  MessageSquare,
  Users,
  Bot,
  Search,
  Plus,
} from "lucide-react";
import Link from "next/link";
import NewGroupChatModal from "@/app/find/components/NewGroupChatModal";

type ChatSidebarProps = {
  activeTab: "direct" | "group" | "ai";
  setActiveTab: (tab: "direct" | "group" | "ai") => void;
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  setSelectedRoomId: (roomId: string | null) => void;
};

export default function ChatSidebar({
  activeTab,
  setActiveTab,
  rooms,
  selectedRoomId,
  setSelectedRoomId,
}: ChatSidebarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlusClick = () => {
    if (activeTab === "direct") {
      router.push("/find");
    } else if (activeTab === "group") {
      setIsDropdownOpen(!isDropdownOpen);
    } else if (activeTab === "ai") {
      router.push("/find?tab=ai");
    }
  };

  const TabButton = ({
    tabName,
    label,
    Icon,
  }: {
    tabName: "direct" | "group" | "ai";
    label: string;
    Icon: React.ElementType;
  }) => (
    <button
      onClick={() => {
        setActiveTab(tabName);
        setIsDropdownOpen(false);
      }}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
        activeTab === tabName
          ? "text-emerald-400"
          : "text-gray-400 hover:text-white"
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <>
      <aside className="w-1/4 min-w-[300px] max-w-[400px] bg-gray-800 flex flex-col border-r border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Chat</h1>
            <div className="relative">
              <button
                onClick={handlePlusClick}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={22} />
              </button>
              {activeTab === "group" && isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                  >
                    NEW GROUP CHAT
                  </button>
                  <Link
                    href="/find?tab=group"
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-600"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    FIND GROUP CHAT
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="relative mt-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {rooms.map((room) => {
              const [type, actualId] = room.id.split('-');
              const href = `/chat/${type}/${actualId}`;

              return (
                <Link
                  href={href}
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRoomId === room.id
                      ? "bg-emerald-600/20"
                      : "hover:bg-gray-700/50"
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                      {room.avatar}
                    </div>
                    {room.type === "direct" && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-gray-800"></span>
                    )}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-sm text-white truncate">
                        {room.name}
                      </h3>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {room.lastMessageTime}
                      </p>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {room.lastMessage}
                      </p>
                      {room.unreadCount && room.unreadCount > 0 ? (
                        <span className="ml-2 mt-1 bg-emerald-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700 grid grid-cols-3">
          <TabButton tabName="direct" label="1:1 Chat" Icon={MessageSquare} />
          <TabButton tabName="group" label="Group Chat" Icon={Users} />
          <TabButton tabName="ai" label="AI Chat" Icon={Bot} />
        </div>
      </aside>
      <NewGroupChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
