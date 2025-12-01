export interface ChatRoomMember {
  id: number;
  nickname: string;
  isFriend: boolean;
}

export interface CreateGroupChatReq {
  roomName: string;
  memberIds: number[];
  password?: string; // Optional
  description?: string;
  topic?: string;
}

export interface DirectChatRoomResp {
  id: number;
  user1: ChatRoomMember;
  user2: ChatRoomMember;
  unreadCount: number;
}

export interface GroupChatRoomResp {
  id: number;
  name: string;
  description: string;
  topic: string;
  hasPassword: boolean;
  memberCount: number;
  createdAt: string;
  ownerId: number;
  members: ChatRoomMember[];
  unreadCount: number;
}

export interface JoinGroupChatReq {
  password?: string;
}

export interface AIChatRoomResp {
  id: number;
  name: string;
  aiModelId: string;
  aiPersona: string;
}

export interface ChatRoomResp {
  id: number;
  name: string;
  roomType: "DIRECT" | "GROUP";
  members: ChatRoomMember[];
}

export type MessageResp = {
  id: string;
  senderId: number;
  sender: string;
  content: string;
  translatedContent?: string;
  isTranslateEnabled?: boolean;
  createdAt: string; // ISO 8601 형식의 문자열
  messageType: "TEXT" | "IMAGE" | "FILE" | "SYSTEM"; // 백엔드 ChatMessage.MessageType enum 값에 따라
  sequence: number;
  unreadCount: number;
};

export type CustomResponse<T> = {
  msg: string;
  data?: T;
};

export interface ChatRoomDataResp {
  chatRoomType: "DIRECT" | "GROUP" | "AI";
  messages: MessageResp[];
}

export interface MessagePageResp {
  messages: MessageResp[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface ChatRoomPageDataResp {
  chatRoomType: "DIRECT" | "GROUP" | "AI";
  messages: MessageResp[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface ReadStatusUpdateEvent {
  readerId: number;
  readSequence: number;
}

export interface MessageUnreadCountResp {
  messageId: string;
  unreadCount: number;
}

export interface UnreadCountUpdateEvent {
  updates: MessageUnreadCountResp[];
}

export interface SubscriberCountUpdateResp {
  subscriberCount: number;
  totalMemberCount: number;
}
