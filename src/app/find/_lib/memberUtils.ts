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

type EnglishLevelMeta = {
  labelKey: string;
  badgeStyle: {
    backgroundColor: string;
    borderColor: string;
    color?: string;
  };
};

const ENGLISH_LEVEL_META: Record<EnglishLevelKey, EnglishLevelMeta> = {
  BEGINNER: {
    labelKey: "find.profile.englishLevels.BEGINNER",
    badgeStyle: {
      backgroundColor: "rgba(16,185,129,0.15)",
      borderColor: "rgba(16,185,129,0.45)",
      color: "var(--page-text)",
    },
  },
  INTERMEDIATE: {
    labelKey: "find.profile.englishLevels.INTERMEDIATE",
    badgeStyle: {
      backgroundColor: "rgba(59,130,246,0.12)",
      borderColor: "rgba(59,130,246,0.4)",
      color: "var(--page-text)",
    },
  },
  ADVANCED: {
    labelKey: "find.profile.englishLevels.ADVANCED",
    badgeStyle: {
      backgroundColor: "rgba(168,85,247,0.12)",
      borderColor: "rgba(168,85,247,0.4)",
      color: "var(--page-text)",
    },
  },
  NATIVE: {
    labelKey: "find.profile.englishLevels.NATIVE",
    badgeStyle: {
      backgroundColor: "rgba(251,191,36,0.18)",
      borderColor: "rgba(251,191,36,0.5)",
      color: "var(--page-text)",
    },
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

export const formatFriendSince = (value: string, locale = "ko-KR"): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const resolvedLocale = typeof locale === "string" && locale.length > 0 ? locale : "ko-KR";

  return new Intl.DateTimeFormat(resolvedLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const formatLastSeen = (value: string, locale = "ko-KR"): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);
  const resolvedLocale = typeof locale === "string" && locale.length > 0 ? locale : "ko-KR";
  const isKorean = resolvedLocale.toLowerCase().startsWith("ko");

  if (diffMinutes < 1) {
    return isKorean ? "방금 전" : "just now";
  }

  if (diffMinutes < 60) {
    return isKorean ? `${diffMinutes}분 전` : `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return isKorean ? `${diffHours}시간 전` : `${diffHours}h ago`;
  }

  const formatted = new Intl.DateTimeFormat(resolvedLocale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return formatted;
};

export const FRIENDSHIP_STATUS_LABELS: Record<FriendshipState, string> = {
  FRIEND: "find.profile.friendship.status.FRIEND",
  REQUEST_SENT: "find.profile.friendship.status.REQUEST_SENT",
  REQUEST_RECEIVED: "find.profile.friendship.status.REQUEST_RECEIVED",
  NONE: "find.profile.friendship.status.NONE",
};

export const FRIENDSHIP_STATUS_DESCRIPTIONS: Record<FriendshipState, string> = {
  FRIEND: "find.profile.friendship.descriptions.FRIEND",
  REQUEST_SENT: "find.profile.friendship.descriptions.REQUEST_SENT",
  REQUEST_RECEIVED: "find.profile.friendship.descriptions.REQUEST_RECEIVED",
  NONE: "find.profile.friendship.descriptions.NONE",
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
