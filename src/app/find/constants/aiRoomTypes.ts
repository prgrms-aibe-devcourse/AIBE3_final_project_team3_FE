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
    description: "실전 상황을 연기하며 표현력을 키우는 AI 역할놀이 모드",
    details: "카페 주문부터 업무 협상까지, 세분화된 role_play_type에 맞춘 시나리오를 제공합니다.",
    badge: "추천",
  },
  {
    type: "TUTOR_PERSONAL",
    title: "개인화 튜터",
    description: "내 학습 이력과 관심사에 맞춘 RAG 기반 개인 튜터",
    details: "학습 노트와 관심사를 반영해 피드백과 과제를 제안합니다.",
  },
  {
    type: "TUTOR_SIMILAR",
    title: "유사도 튜터",
    description: "비슷한 실력/목표를 가진 학습자와 매칭된 튜터",
    details: "목표별 추천 표현과 예문을 제공하는 AI 컨설턴트입니다.",
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
