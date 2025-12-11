import { AiChatRoomType } from "@/global/types/chat.types";

type TranslateFn = (key: string, params?: Record<string, string>) => string;

export interface AiRoomTypeOption {
  type: AiChatRoomType;
  titleKey: string;
  descriptionKey: string;
  detailsKey: string;
  badgeKey?: string;
}

export const AI_ROOM_TYPE_OPTIONS: AiRoomTypeOption[] = [
  {
    type: "ROLE_PLAY",
    titleKey: "find.aiRoomTypes.ROLE_PLAY.title",
    descriptionKey: "find.aiRoomTypes.ROLE_PLAY.description",
    detailsKey: "find.aiRoomTypes.ROLE_PLAY.details",
    badgeKey: "find.aiRoomTypes.ROLE_PLAY.badge",
  },
  {
    type: "TUTOR_PERSONAL",
    titleKey: "find.aiRoomTypes.TUTOR_PERSONAL.title",
    descriptionKey: "find.aiRoomTypes.TUTOR_PERSONAL.description",
    detailsKey: "find.aiRoomTypes.TUTOR_PERSONAL.details",
    badgeKey: "find.aiRoomTypes.TUTOR_PERSONAL.badge",
  },
  {
    type: "TUTOR_SIMILAR",
    titleKey: "find.aiRoomTypes.TUTOR_SIMILAR.title",
    descriptionKey: "find.aiRoomTypes.TUTOR_SIMILAR.description",
    detailsKey: "find.aiRoomTypes.TUTOR_SIMILAR.details",
    badgeKey: "find.aiRoomTypes.TUTOR_SIMILAR.badge",
  },
];

export const formatAiRoomTypeLabel = (
  roomType?: AiChatRoomType | null,
  t?: TranslateFn,
) => {
  if (!roomType) {
    return t ? t("find.tabs.ai") : "AI Tutor";
  }
  const option = AI_ROOM_TYPE_OPTIONS.find((item) => item.type === roomType);
  if (!option) {
    return roomType;
  }
  return t ? t(option.titleKey) : option.type;
};

export const findAiRoomTypeOption = (roomType?: AiChatRoomType | null) =>
  AI_ROOM_TYPE_OPTIONS.find((item) => item.type === roomType);
