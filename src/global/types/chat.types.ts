export interface ChatRoomMember {
  id: number;
  nickname: string;
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
