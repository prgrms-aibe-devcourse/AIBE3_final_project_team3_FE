import { MemberPresenceSummaryResp } from "@/global/types/auth.types";
import { FriendSummary } from "@/global/types/member.types";

export type MemberSource = "members" | "friends";
export type MemberListItem = (MemberPresenceSummaryResp | FriendSummary) & {
  name?: string | null;
  lastSeenAt?: string | null;
  profileImageUrl?: string | null;
};

export type FriendshipState = "FRIEND" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE";

type EnglishLevelKey = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";

const ENGLISH_LEVEL_META: Record<
  EnglishLevelKey,
  { label: string; icon: string; badgeClass: string }
> = {
  BEGINNER: {
    label: "초급",
    icon: "A1",
    badgeClass: "bg-emerald-900/40 text-emerald-200 border border-emerald-700/50",
  },
  INTERMEDIATE: {
    label: "중급",
    icon: "B1",
    badgeClass: "bg-blue-900/30 text-blue-200 border border-blue-600/40",
  },
  ADVANCED: {
    label: "고급",
    icon: "C1",
    badgeClass: "bg-purple-900/30 text-purple-200 border border-purple-600/40",
  },
  NATIVE: {
    label: "원어민",
    icon: "PRO",
    badgeClass: "bg-amber-900/30 text-amber-200 border border-amber-600/40",
  },
};

export const resolveEnglishLevelMeta = (level?: string | null) => {
  const upper = typeof level === "string" ? level.toUpperCase() : "";
  const key = (Object.prototype.hasOwnProperty.call(ENGLISH_LEVEL_META, upper)
    ? upper
    : "BEGINNER") as EnglishLevelKey;
  return ENGLISH_LEVEL_META[key];
};

export const getAvatar = (seed: string | number | null | undefined) => {
  const fallback = typeof seed === "string" && seed.length > 0 ? seed : "member";
  return `https://i.pravatar.cc/150?u=${fallback}`;
};

export const resolveProfileImageUrl = (value?: string | null) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
};

export const getPresenceMeta = (isOnline?: boolean) => ({
  badgeClass: isOnline ? "bg-green-500" : "bg-gray-500",
  textClass: isOnline ? "text-emerald-400" : "text-gray-400",
  label: isOnline ? "Online" : "Offline",
});

export const formatFriendSince = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const formatLastSeen = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);

  if (diffMinutes < 1) {
    return "방금 전";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const formatted = new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return formatted;
};

export const FRIENDSHIP_STATUS_LABELS: Record<FriendshipState, string> = {
  FRIEND: "이미 친구",
  REQUEST_SENT: "요청 전송됨",
  REQUEST_RECEIVED: "요청 도착",
  NONE: "친구 아님",
};

export const FRIENDSHIP_STATUS_DESCRIPTIONS: Record<FriendshipState, string> = {
  FRIEND: "현재 서로 친구 상태입니다.",
  REQUEST_SENT: "내가 보낸 친구 요청이 상대의 승인을 기다리고 있습니다.",
  REQUEST_RECEIVED: "상대방이 보낸 친구 요청이 대기 중입니다.",
  NONE: "아직 친구 요청이 오가거나 수락된 내역이 없습니다.",
};

export const FRIENDSHIP_BADGE_STYLE: Record<FriendshipState, string> = {
  FRIEND: "bg-emerald-600 text-white",
  REQUEST_SENT: "bg-blue-600 text-white",
  REQUEST_RECEIVED: "bg-amber-500 text-black",
  NONE: "bg-gray-600 text-white",
};

export const normaliseNumericId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

export const resolveIsOnline = (user?: MemberListItem | null) => {
  if (!user) {
    return undefined;
  }

  if ("isOnline" in user) {
    return Boolean((user as MemberPresenceSummaryResp).isOnline);
  }

  return undefined;
};

export const normaliseInterests = (value?: string[] | null) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter((item) => item.length > 0);
};
