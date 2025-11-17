export interface ChatRoomMember {
  id: number;
  nickname: string;
}

export interface ChatRoomResp {
  id: number;
  name: string;
  roomType: 'DIRECT' | 'GROUP';
  members: ChatRoomMember[];
}
