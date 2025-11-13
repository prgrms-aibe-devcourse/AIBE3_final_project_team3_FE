import { create } from 'zustand';
import { mockAiRooms, mockGroupRooms, mockUsers } from '@/app/chat/_lib/mock-data';

export type ChatRoomType = '1v1' | 'group' | 'ai';

export interface ChatRoom {
  id: string;
  name: string;
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

export const useChatStore = create<ChatState>((set) => ({
  activeTab: 'ai',
  rooms: {
    '1v1': mockUsers.map((user) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      lastMessage: 'See you tomorrow!',
      lastMessageTime: '10:42 PM',
      unreadCount: 0,
      type: '1v1',
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
}));
