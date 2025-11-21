import type { components } from "../backend/schema";

export type NotificationApiPayload = components["schemas"]["NotificationResp"];

export type NotificationType = Lowercase<NotificationApiPayload["type"]>;

export interface NotificationItem {
  id: NotificationApiPayload["id"];
  type: NotificationType;
  message: NotificationApiPayload["content"];
  title?: string;
  createdAt: NotificationApiPayload["createdAt"];
  isRead: NotificationApiPayload["isRead"];
  senderId: NotificationApiPayload["senderId"] | null;
  senderNickname: NotificationApiPayload["senderNickname"] | null;
  receiverId?: NotificationApiPayload["receiverId"] | null;
  metadata?: Record<string, unknown> | null;
}
