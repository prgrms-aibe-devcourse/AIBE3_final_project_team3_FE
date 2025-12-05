export type AiChatRoomType = "ROLE_PLAY" | "TUTOR_PERSONAL" | "TUTOR_SIMILAR";

export interface ChatRoomMember {
  id: number;
  nickname: string;
  isFriend: boolean;
  profileImageUrl?: string;
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
  lastMessageAt?: string;
  lastMessageContent?: string;
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
  lastMessageAt?: string;
  lastMessageContent?: string;
}

export interface CreateAIChatReq {
  roomName: string;
  personaId: number;
  roomType: AiChatRoomType;
}

export interface JoinGroupChatReq {
  password?: string;
}

export interface AIChatRoomResp {
  id: number;
  name: string;
  aiPersona: number;
}

export interface RoomLastMessageUpdateResp {
  roomId: number;
  chatRoomType: "DIRECT" | "GROUP" | "AI";
  lastMessageAt: string;
  unreadCount: number;
  lastMessageContent: string;
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

export interface AiFeedbackReq {
  originalContent: string;
  translatedContent: string;
}

export interface AiFeedbackItem {
  tag: string;
  problem: string;
  correction: string;
  extra: string;
}

export interface AiFeedbackResp {
  correctedContent: string;
  feedback: AiFeedbackItem[];
}
