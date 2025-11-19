import { create } from 'zustand';
import { mockAiRooms } from '@/app/chat/_lib/mock-data';
import { ChatRoomResp } from '../types/chat.types';
import { useLoginStore } from './useLoginStore'; // 현재 사용자 정보를 가져오기 위해 import

export type ChatRoomType = '1v1' | 'group' | 'ai';

// 프론트엔드 UI에서 사용하는 ChatRoom 객체 타입
export interface ChatRoom {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  type: ChatRoomType;
}

interface ChatState {
  activeTab: ChatRoomType;
  rooms: Record<ChatRoomType, ChatRoom[]>;
  selectedRoomId: string | null;
  setActiveTab: (tab: ChatRoomType) => void;
  setSelectedRoomId: (roomId: string | null) => void;
  setChatRooms: (apiRooms: ChatRoomResp[]) => void; // API 응답을 받아 채팅방 목록을 설정하는 액션
}

export const useChatStore = create<ChatState>((set) => ({
  activeTab: '1v1', // 기본 탭을 1v1으로 변경
  rooms: {
    '1v1': [], // 초기 상태는 빈 배열
    group: [],
    ai: mockAiRooms, // AI 채팅방은 목 데이터 유지
  },
  selectedRoomId: null,
  setActiveTab: (tab) => set((state) => {
    const newRooms = state.rooms[tab];
    return { 
      activeTab: tab,
      selectedRoomId: newRooms.length > 0 ? newRooms[0].id : null
    };
  }),
  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
  setChatRooms: (apiRooms) => set(state => {
    // 현재 로그인한 사용자 정보 가져오기
    const currentUser = useLoginStore.getState().member;

    // API 응답(ChatRoomResp)을 UI에서 사용하는 ChatRoom 타입으로 변환하고 분류
    const directRooms = apiRooms
      .filter(room => room.roomType === 'DIRECT')
      .map(room => {
        // members 배열에서 현재 사용자가 아닌 다른 사용자 찾기
        const otherUser = room.members.find(member => member.id !== currentUser?.memberId);
        
        return {
          id: String(room.id),
          // 다른 사용자가 있으면 그 사람의 닉네임을, 없으면 기존 방 이름을 이름으로 사용
          name: otherUser ? otherUser.nickname : room.name,
          avatar: '👤', // TODO: 실제 상대방 프로필 이미지로 변경 필요
          type: '1v1' as ChatRoomType,
          lastMessage: room.lastMessageContent,
          lastMessageTime: room.lastMessageCreatedAt,
        };
      });

    const groupRooms = apiRooms
      .filter(room => room.roomType === 'GROUP')
      .map(room => ({
        id: String(room.id),
        name: room.name,
        avatar: '👥', // 그룹 채팅방 기본 아바타
        type: 'group' as ChatRoomType,
        lastMessage: room.lastMessageContent,
        lastMessageTime: room.lastMessageCreatedAt,
      }));

    return {
      rooms: {
        '1v1': directRooms,
        group: groupRooms,
        ai: state.rooms.ai, // AI 채팅방은 그대로 유지
      }
    };
  }),
}));
