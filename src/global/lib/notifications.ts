import { NotificationItem, NotificationType } from "@/global/types/notification.types";

const normaliseNumericId = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const parseDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
};

const resolveSenderLabel = (nickname: unknown, senderId: number | null): string => {
  if (typeof nickname === "string" && nickname.trim().length > 0) {
    return nickname.trim();
  }

  if (typeof senderId === "number" && Number.isFinite(senderId)) {
    return `ID ${senderId}`;
  }

  return "상대방";
};

const buildDefaultMessage = (type: NotificationType, senderLabel: string): string => {
  switch (type) {
    case "friend_request":
      return `${senderLabel}님이 친구 요청을 보냈습니다.`;
    case "friend_request_accept":
      return `${senderLabel}님에게 보낸 친구 요청이 수락되었습니다.`;
    case "friend_request_reject":
      return `${senderLabel}님에게 보낸 친구 요청이 거절되었습니다.`;
    case "chat_invitation":
      return `${senderLabel}님이 그룹 채팅에 초대했습니다.`;
    case "chat_message":
      return `${senderLabel}님이 새로운 메시지를 보냈습니다.`;
    case "system_alert":
    default:
      return "새로운 시스템 알림이 도착했습니다.";
  }
};

const normaliseNotificationType = (value: unknown): NotificationType => {
  const fallback: NotificationType = "system_alert";

  if (!value) {
    return fallback;
  }

  const normalised = String(value).toLowerCase().replace(/[-\s]+/g, "_");

  switch (normalised) {
    case "friend_request":
    case "friendrequest":
      return "friend_request";
    case "friend_request_accept":
    case "friend_request_accepted":
    case "friendaccepted":
    case "friend_accept":
      return "friend_request_accept";
    case "friend_request_reject":
    case "friend_request_rejected":
    case "friendrejected":
    case "friend_reject":
      return "friend_request_reject";
    case "chat_invitation":
    case "chatinvitation":
    case "room_invitation":
    case "roominvitation":
      return "chat_invitation";
    case "chat_message":
    case "chatmessage":
      return "chat_message";
    case "system_alert":
    case "system":
      return "system_alert";
    default:
      return fallback;
  }
};

export const normaliseNotificationPayload = (payload: unknown): NotificationItem => {
  const record = (payload ?? {}) as Record<string, unknown>;

  const id = normaliseNumericId(record.id ?? record.notificationId) ?? Date.now();
  const senderId = normaliseNumericId(record.senderId ?? record.memberId ?? record.fromMemberId);
  const rawMessageCandidate = record.message ?? record.content ?? record.body ?? record.description;

  const titleCandidate = record.title ?? record.summary ?? record.subject ?? null;

  const createdAtCandidate =
    record.createdAt ??
    record.created_at ??
    record.createdDate ??
    record.timestamp ??
    Date.now();

  const receiverId = normaliseNumericId(record.receiverId ?? record.toMemberId ?? record.targetMemberId);

  const metadata = (() => {
    const metaCandidate = record.metadata ?? record.meta ?? record.data;
    if (metaCandidate && typeof metaCandidate === "object") {
      return metaCandidate as Record<string, unknown>;
    }
    return null;
  })();

  const isReadCandidate = record.isRead ?? record.read ?? record.is_read;
  const type = normaliseNotificationType(record.type ?? record.notificationType);
  const senderNickname =
    typeof record.senderNickname === "string"
      ? record.senderNickname
      : typeof record.senderName === "string"
        ? record.senderName
        : typeof record.from === "string"
          ? record.from
          : null;

  const message = (() => {
    if (typeof rawMessageCandidate === "string" && rawMessageCandidate.trim().length > 0) {
      return rawMessageCandidate;
    }

    const senderLabel = resolveSenderLabel(senderNickname, senderId ?? null);
    return buildDefaultMessage(type, senderLabel);
  })();

  return {
    id,
    type,
    message,
    title: typeof titleCandidate === "string" && titleCandidate.trim().length > 0 ? titleCandidate : undefined,
    createdAt: parseDate(createdAtCandidate),
    isRead: Boolean(isReadCandidate),
    senderId: senderId ?? null,
    senderNickname,
    receiverId: receiverId ?? null,
    metadata,
  };
};

export const mergeNotifications = (
  existing: NotificationItem[],
  incoming: NotificationItem[],
): NotificationItem[] => {
  const map = new Map<number, NotificationItem>();

  for (const item of existing) {
    map.set(item.id, item);
  }
  for (const item of incoming) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};
