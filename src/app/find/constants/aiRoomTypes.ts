import { AiChatRoomType } from "@/global/types/chat.types";

export interface AiRoomTypeOption {
  type: AiChatRoomType;
  title: string;
  description: string;
  details: string;
  badge?: string;
}

export const AI_ROOM_TYPE_OPTIONS: AiRoomTypeOption[] = [
  {
    type: "ROLE_PLAY",
    title: "상황극 역할놀이",
    description: "처음 이용자에게 추천되는 실전 상황 연습 모드",
    details: "카페 주문부터 업무 협상까지, role_play_type에 맞춘 시나리오로 바로 말하기 감각을 살립니다.",
    badge: "신규 추천",
  },
  {
    type: "TUTOR_PERSONAL",
    title: "개인화 튜터",
    description: "내 학습노트 데이터만으로 맞춤 코칭을 제공하는 개인 튜터",
    details: "작성해 둔 학습노트 문장·피드백을 컨텍스트로 삼아 필요한 표현과 과제를 제안합니다.",
    badge: "내 노트 추천",
  },
  {
    type: "TUTOR_SIMILAR",
    title: "유사도 튜터",
    description: "나와 비슷한 학습 패턴을 가진 사례를 찾아주는 RAG 튜터",
    details: "유사 학습자의 노트를 컨텍스트로 넣어 새로운 표현, 예문, 피드백을 제안합니다.",
    badge: "유사 노트 추천",
  },
];

export const formatAiRoomTypeLabel = (roomType?: AiChatRoomType | null) => {
  if (!roomType) {
    return "AI 튜터";
  }
  const option = AI_ROOM_TYPE_OPTIONS.find((item) => item.type === roomType);
  return option?.title ?? roomType;
};

export const findAiRoomTypeOption = (roomType?: AiChatRoomType | null) =>
  AI_ROOM_TYPE_OPTIONS.find((item) => item.type === roomType);
