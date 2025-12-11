"use client";

import NewGroupChatModal from "@/app/find/components/NewGroupChatModal";
import { ChatRoom } from "@/global/stores/useChatStore";
import {
  Bot,
  MessageSquare,
  Plus,
  Search,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChatSearchQuery } from "@/global/api/useChatQuery";

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
  const { t } = useLanguage();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const { data: searchResults = [], isLoading: isSearching, isError: isSearchError } = useChatSearchQuery(
    debouncedTerm,
    activeTab
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const showingSearch = debouncedTerm.length >= 2;
  const searchHitMap = useMemo(() => {
    if (!showingSearch) return new Map<string, any>();
    const map = new Map<string, any>();
    searchResults.forEach((hit: any) => {
      const key = `${activeTab}-${hit.chatRoomId}`;
      if (!map.has(key)) {
        map.set(key, hit);
      }
    });
    return map;
  }, [activeTab, searchResults, showingSearch]);

  const displayedRooms = useMemo(() => {
    if (!showingSearch) return rooms;

    const matchedIds = new Set(
      searchResults.map((hit: any) => `${activeTab}-${hit.chatRoomId}`)
    );
    const fromSearch = rooms.filter((room) => matchedIds.has(room.id));

    if (fromSearch.length > 0) return fromSearch;

    // Fallback: 클라이언트에서 방 이름/마지막 메시지로 단순 필터
    const keyword = debouncedTerm.toLowerCase();
    return rooms.filter((room) => {
      const name = room.name?.toLowerCase() || "";
      const last = room.lastMessage?.toLowerCase() || "";
      return name.includes(keyword) || last.includes(keyword);
    });
  }, [rooms, searchResults, activeTab, showingSearch, debouncedTerm]);

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
        router.push('/chat');
        setActiveTab(tabName);
        setIsDropdownOpen(false);
      }}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${activeTab === tabName
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 bg-gray-900 border-b border-gray-700 grid grid-cols-3">
          <TabButton tabName="direct" label="1:1 Chat" Icon={MessageSquare} />
          <TabButton tabName="group" label="Group Chat" Icon={Users} />
          <TabButton tabName="ai" label="AI Chat" Icon={Bot} />
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {isSearching ? (
              <div className="text-sm text-gray-400 px-3 py-2">Searching...</div>
            ) : isSearchError ? (
              <div className="text-sm text-red-400 px-3 py-2">Search failed.</div>
            ) : showingSearch && displayedRooms.length === 0 ? (
              <div className="text-sm text-gray-400 px-3 py-2">No results.</div>
            ) : (
              displayedRooms.map((room) => {
                const roomId = room.id;
                const roomName = room.name;
                const matchingHit = searchHitMap.get(roomId);
                const lastMessage = matchingHit
                  ? matchingHit.translatedContent || matchingHit.content || room.lastMessage
                  : room.lastMessage;
                const [type, actualId] = roomId.split('-');
                const href = `/chat/${type}/${actualId}`;

                return (
                  <Link
                    href={href}
                    key={roomId}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedRoomId === roomId
                      ? "bg-emerald-600/20"
                      : "hover:bg-gray-700/50"
                      }`}
                    onClick={() => setSelectedRoomId(roomId)}
                  >
                    <div className="relative">
                      {(() => {
                        const src = room.avatar?.trim() ?? "";
                        const isImageAvatar =
                          src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/");

                        if (isImageAvatar) {
                          return (
                            <Image
                              src={src}
                              alt={roomName}
                              width={48}
                              height={48}
                              unoptimized
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          );
                        }

                        const fallbackLabel = src || roomName.charAt(0).toUpperCase();
                        return (
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl font-semibold text-white">
                            {fallbackLabel}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-white truncate">
                          {roomName}
                        </h3>
                      </div>
                      <div className="flex justify-between items-start">
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {(() => {
                            try {
                              if (!lastMessage) return "";
                              const parsed = JSON.parse(lastMessage);
                              if (parsed.type && parsed.params) {
                                return t(`system.${parsed.type}`, parsed.params);
                              }
                              return lastMessage;
                            } catch (e) {
                              return lastMessage;
                            }
                          })()}
                        </p>
                        {room.type !== "ai" && room.unreadCount && room.unreadCount > 0 ? (
                          <span className="ml-2 mt-1 bg-emerald-500 text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center flex-shrink-0">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </aside>
      <NewGroupChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
