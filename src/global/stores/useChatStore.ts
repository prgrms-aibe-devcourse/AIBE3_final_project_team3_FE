import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mockAiRooms, mockGroupRooms, mockUsers } from '@/app/chat/_lib/mock-data';

export type ChatRoomType = 'direct' | 'group' | 'ai';

export interface ChatRoom {
  id: string;
  name: string;
  topic?: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  type: ChatRoomType;
}

export type Message = {
  id: string;
  text: string;
  sender: {
    name: string;
    avatar: string;
  };
  timestamp: string;
};

interface ChatState {
  activeTab: ChatRoomType;
  rooms: Record<ChatRoomType, ChatRoom[]>;
  selectedRoomId: string | null;
  setActiveTab: (tab: ChatRoomType) => void;
  setSelectedRoomId: (roomId: string | null) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      activeTab: 'ai',
      rooms: {
        direct: mockUsers.map((user) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          lastMessage: 'See you tomorrow!',
          lastMessageTime: '10:42 PM',
          unreadCount: 0,
          type: 'direct',
        })),
        group: mockGroupRooms,
        ai: mockAiRooms,
      },
      selectedRoomId: mockAiRooms[0]?.id || null,
      setActiveTab: (tab) => set((state) => {
        const newRooms = state.rooms[tab];
        return {
          activeTab: tab,
          selectedRoomId: newRooms.length > 0 ? newRooms[0].id : null
        };
      }),
      setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeTab: state.activeTab }),
    }
  )
);
