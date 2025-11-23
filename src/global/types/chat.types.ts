export interface ChatRoomMember {
  id: number;
  nickname: string;
}

export interface CreateGroupChatReq {
  roomName: string;
  memberIds: number[];
  password?: string; // Optional
}

export interface DirectChatRoomResp {
  id: number;
  user1: ChatRoomMember;
  user2: ChatRoomMember;
}

export interface GroupChatRoomResp {
  id: number;
  name: string;
  description: string;
  topic: string;
  members: ChatRoomMember[];
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
  createdAt: string; // ISO 8601 형식의 문자열
  messageType: "TALK" | "IMAGE" | "FILE" | "SYSTEM"; // 백엔드 ChatMessage.MessageType enum 값에 따라
};

export type CustomResponse<T> = {
  msg: string;
  data?: T;
};

export interface ChatRoomDataResp {
  conversationType: "DIRECT" | "GROUP" | "AI";
  messages: MessageResp[];
}
