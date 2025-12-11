"use client";

import { Check, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useFriendDetailQuery } from "@/global/api/useMemberQuery";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/global/api/useNotificationQuery";
import { useToastStore } from "@/global/stores/useToastStore";
import { MemberProfileUpdateReq } from "@/global/types/member.types";
import { NotificationItem } from "@/global/types/notification.types";

import { useProfileTabs } from "./ProfileTabsProvider";

const resolveNotificationTitle = (notification: NotificationItem) => {
  return notification.title || notification.type.toUpperCase();
};

const resolveNotificationEmoji = (type: NotificationItem["type"]) => {
  switch (type) {
    case "friend_request":
      return "👤";
    case "friend_request_accept":
      return "✅";
    case "friend_request_reject":
      return "❌";
    case "chat_invitation":
      return "💬";
    case "chat_message":
      return "💭";
    case "room_closed":
      return "🚫";
    default:
      return "📢";
  }
};

const getInitialFromName = (name?: string | null) => {
  if (!name) {
    return "?";
  }
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
};

const formatLastSeenSummary = (timestamp?: string | null) => {
  if (!timestamp) {
    return "-";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

type TranslateFn = (key: string, params?: Record<string, string>) => string;

const ENGLISH_LEVEL_LABEL_KEYS: Record<MemberProfileUpdateReq["englishLevel"], string> = {
  BEGINNER: "profile.info.englishLevels.BEGINNER",
  INTERMEDIATE: "profile.info.englishLevels.INTERMEDIATE",
  ADVANCED: "profile.info.englishLevels.ADVANCED",
  NATIVE: "profile.info.englishLevels.NATIVE",
};

const translateEnglishLevel = (level: string | null | undefined, t: TranslateFn) => {
  const normalized = level?.toString().toUpperCase() as MemberProfileUpdateReq["englishLevel"] | undefined;
  if (normalized && ENGLISH_LEVEL_LABEL_KEYS[normalized]) {
    return t(ENGLISH_LEVEL_LABEL_KEYS[normalized]);
  }
  return level || "-";
};

export function NotificationsPanel() {
  const {
    notificationsQuery,
    notificationPage,
    notificationPageSize,
    setNotificationPage,
  } = useProfileTabs();
  const { language, t } = useLanguage();
  const { data, isLoading, error, refetch, isFetching } = notificationsQuery;
  const notifications = data ?? [];
  const totalCount = notifications.length;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / notificationPageSize);
  const safePage = totalPages === 0 ? 0 : Math.min(notificationPage, totalPages - 1);
  const currentPage = totalPages === 0 ? 0 : safePage + 1;
  const canGoPrev = totalPages > 0 && safePage > 0;
  const canGoNext = totalPages > 0 && safePage < totalPages - 1;
  const pageStart = safePage * notificationPageSize;
  const paginatedNotifications =
    totalPages === 0 ? [] : notifications.slice(pageStart, pageStart + notificationPageSize);
  const maxPageLinks = 5;
  const pageNumbers = (() => {
    if (totalPages === 0) {
      return [];
    }
    if (totalPages <= maxPageLinks) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const offset = Math.floor(maxPageLinks / 2);
    let start = currentPage - offset;
    let end = currentPage + offset;

    if (maxPageLinks % 2 === 0) {
      end -= 1;
    }

    if (start < 1) {
      end += 1 - start;
      start = 1;
    }

    if (end > totalPages) {
      start -= end - totalPages;
      end = totalPages;
    }

    return Array.from({ length: maxPageLinks }, (_, index) => start + index);
  })();

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [language],
  );

  const { addToast } = useToastStore();
  const { mutate: markNotificationReadMutation } = useMarkNotificationRead();
  const { mutate: markAllNotificationsReadMutation, isPending: isMarkingAll } = useMarkAllNotificationsRead();
  const { mutate: deleteNotificationMutation } = useDeleteNotification();
  const { mutate: deleteAllNotificationsMutation, isPending: isDeletingAll } = useDeleteAllNotifications();
  const [pendingReadId, setPendingReadId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [senderDetailId, setSenderDetailId] = useState<number | null>(null);

  useEffect(() => {
    if (totalPages === 0 && notificationPage !== 0) {
      setNotificationPage(0);
      return;
    }

    if (totalPages > 0 && notificationPage > totalPages - 1) {
      setNotificationPage(totalPages - 1);
    }
  }, [notificationPage, totalPages, setNotificationPage]);

  const handlePrevPage = () => {
    if (canGoPrev) {
      setNotificationPage(Math.max(safePage - 1, 0));
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      setNotificationPage(safePage + 1);
    }
  };

  const handlePageSelect = (pageNumber: number) => {
    if (totalPages === 0) {
      return;
    }
    const targetIndex = pageNumber - 1;
    if (targetIndex !== safePage) {
      setNotificationPage(targetIndex);
    }
  };

  const handleMarkNotification = (notification: NotificationItem) => {
    if (notification.isRead) {
      addToast(t("profile.notifications.messages.alreadyRead"), "info");
      return;
    }

    setPendingReadId(notification.id);
    markNotificationReadMutation(notification.id, {
      onSuccess: () => {
        addToast(t("profile.notifications.messages.markSuccess"));
        refetch();
      },
      onError: (mutationError) => {
        addToast(mutationError.message || t("profile.notifications.messages.markFailed"), "error");
      },
      onSettled: () => {
        setPendingReadId(null);
      },
    });
  };

  const handleDeleteNotification = (notification: NotificationItem) => {
    if (!window.confirm(t("profile.notifications.messages.deleteConfirm"))) {
      return;
    }

    setPendingDeleteId(notification.id);
    deleteNotificationMutation(notification.id, {
      onSuccess: () => {
        addToast(t("profile.notifications.messages.deleteSuccess"));
        refetch();
      },
      onError: (mutationError) => {
        addToast(mutationError.message || t("profile.notifications.messages.deleteFailed"), "error");
      },
      onSettled: () => {
        setPendingDeleteId(null);
      },
    });
  };

  const handleMarkAllNotifications = () => {
    if (notifications.length === 0) {
      addToast(t("profile.notifications.messages.noneToProcess"), "info");
      return;
    }

    markAllNotificationsReadMutation(undefined, {
      onSuccess: () => {
        addToast(t("profile.notifications.messages.markAllSuccess"));
        refetch();
      },
      onError: (mutationError) => {
        addToast(mutationError.message || t("profile.notifications.messages.markAllFailed"), "error");
      },
    });
  };

  const handleDeleteAllNotifications = () => {
    if (notifications.length === 0) {
      addToast(t("profile.notifications.messages.noneToDelete"), "info");
      return;
    }

    if (!window.confirm(t("profile.notifications.messages.deleteAllConfirm"))) {
      return;
    }

    deleteAllNotificationsMutation(undefined, {
      onSuccess: () => {
        addToast(t("profile.notifications.messages.deleteAllSuccess"));
        setNotificationPage(0);
        refetch();
      },
      onError: (mutationError) => {
        addToast(mutationError.message || t("profile.notifications.messages.deleteAllFailed"), "error");
      },
    });
  };

  const handleViewSenderProfile = (senderId: NotificationItem["senderId"]) => {
    if (senderId == null) {
      addToast(t("profile.notifications.messages.senderMissing"), "error");
      return;
    }

    const memberId = typeof senderId === "number" ? senderId : Number(senderId);
    if (!Number.isFinite(memberId)) {
      addToast(t("profile.notifications.messages.invalidSender"), "error");
      return;
    }

    setSenderDetailId(memberId);
  };

  const handleCloseSenderDetail = () => {
    setSenderDetailId(null);
  };

  return (
    <div className="theme-card rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--page-text)" }}>{t("profile.notifications.title")}</h2>
          <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.subtitle")}</p>
          <p className="text-xs" style={{ color: "var(--surface-muted-text)" }}>
            {t("profile.notifications.summary", {
              count: String(totalCount),
              pageSize: String(notificationPageSize),
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-sm px-3 py-1.5 rounded-2xl border border-[var(--surface-border)] text-[var(--page-text)] hover:border-emerald-400 disabled:opacity-60"
          >
            {isFetching
              ? t("profile.notifications.buttons.refreshing")
              : t("profile.notifications.buttons.refresh")}
          </button>
          <button
            type="button"
            onClick={handleMarkAllNotifications}
            disabled={isMarkingAll || notifications.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-2xl border border-emerald-400 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {t("profile.notifications.buttons.markAll")}
          </button>
          <button
            type="button"
            onClick={handleDeleteAllNotifications}
            disabled={isDeletingAll || notifications.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-2xl border border-red-400/70 text-red-500 hover:bg-red-500/10 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {t("profile.notifications.buttons.deleteAll")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-[var(--surface-muted-text)]">{t("profile.notifications.messages.loading")}</p>
      ) : error ? (
        <p className="text-red-400">
          {t("profile.notifications.messages.error")}
          {error.message ? `: ${error.message}` : ""}
        </p>
      ) : notifications.length === 0 ? (
        <p className="text-[var(--surface-muted-text)]">{t("profile.notifications.messages.empty")}</p>
      ) : (
        <>
          <ul className="space-y-3">
            {paginatedNotifications.map((notification) => {
              const formattedDate = notification.createdAt
                ? dateFormatter.format(new Date(notification.createdAt))
                : t("profile.notifications.time.justNow");
              const isMarking = pendingReadId === notification.id;
              const isDeleting = pendingDeleteId === notification.id;
              const senderMemberId =
                typeof notification.senderId === "number"
                  ? notification.senderId
                  : notification.senderId != null
                    ? Number(notification.senderId)
                    : null;
              const canViewProfile = typeof senderMemberId === "number" && Number.isFinite(senderMemberId);

              return (
                <li
                  key={notification.id}
                  className={`rounded-2xl border px-4 py-3 bg-[var(--surface-panel)] shadow-sm ${notification.isRead ? "border-[var(--surface-border)]" : "border-emerald-400/70"}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold flex items-center gap-2" style={{ color: "var(--page-text)" }}>
                          <span aria-hidden>{resolveNotificationEmoji(notification.type)}</span>
                          {resolveNotificationTitle(notification)}
                        </p>
                        {!notification.isRead ? (
                          <span className="text-xs text-emerald-500">{t("profile.notifications.status.unread")}</span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.status.read")}</span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "var(--surface-muted-text)" }}>{formattedDate}</p>
                      <p className="text-sm mt-2 whitespace-pre-line" style={{ color: "var(--page-text)" }}>{notification.message}</p>
                      {canViewProfile ? (
                        <button
                          type="button"
                          onClick={() => handleViewSenderProfile(senderMemberId)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400"
                        >
                          {t("profile.notifications.buttons.profile")}
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      {!notification.isRead ? (
                        <button
                          type="button"
                          onClick={() => handleMarkNotification(notification)}
                          disabled={notification.isRead || isMarking}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--surface-border)] text-[var(--page-text)] hover:border-emerald-400 disabled:opacity-60"
                          aria-label={t("profile.notifications.buttons.mark")}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">{t("profile.notifications.buttons.mark")}</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDeleteNotification(notification)}
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-400/70 text-red-500 hover:bg-red-500/10 disabled:opacity-60"
                        aria-label={t("profile.notifications.buttons.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t("profile.notifications.buttons.delete")}</span>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between mt-6 gap-4">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!canGoPrev}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--surface-border)] text-[var(--page-text)] disabled:opacity-60"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("profile.notifications.pagination.previous")}
            </button>
            {pageNumbers.length > 0 ? (
              <div className="flex items-center gap-2">
                {pageNumbers.map((pageNumber) => {
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePageSelect(pageNumber)}
                      className={`min-w-[2.5rem] px-3 py-1.5 rounded-lg border text-sm transition-colors ${isActive
                        ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                        : "border-[var(--surface-border)] text-[var(--surface-muted-text)] hover:border-emerald-400"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="text-sm" style={{ color: "var(--surface-muted-text)" }}>
              {totalPages > 0
                ? t("profile.notifications.pagination.pageWithTotal", {
                  current: String(currentPage),
                  total: String(totalPages),
                })
                : t("profile.notifications.pagination.page", { current: String(currentPage) })}
            </div>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!canGoNext}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--surface-border)] text-[var(--page-text)] disabled:opacity-60"
            >
              {t("profile.notifications.pagination.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      <SenderProfileModal
        memberId={senderDetailId ?? undefined}
        isOpen={senderDetailId != null}
        onClose={handleCloseSenderDetail}
      />
    </div>
  );
}

interface SenderProfileModalProps {
  memberId?: number;
  isOpen: boolean;
  onClose: () => void;
}

function SenderProfileModal({ memberId, isOpen, onClose }: SenderProfileModalProps) {
  const { data, isLoading, error } = useFriendDetailQuery(memberId);
  const { t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-overlay)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg theme-card rounded-3xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--page-text)" }}>{t("profile.notifications.modal.title")}</h3>
            <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.modal.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--surface-muted-text)] hover:text-emerald-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-[var(--surface-muted-text)]">{t("profile.notifications.modal.loading")}</p>
        ) : error ? (
          <p className="text-red-400">
            {t("profile.notifications.modal.error")}
            {error.message ? `: ${error.message}` : ""}
          </p>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              {data.profileImageUrl ? (
                <Image
                  src={data.profileImageUrl}
                  alt={t("profile.info.avatar.alt", { name: data.nickname ?? "" })}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-emerald-400"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-[var(--surface-panel-muted)] text-2xl font-semibold flex items-center justify-center border border-[var(--surface-border)]" style={{ color: "var(--page-text)" }}>
                  {getInitialFromName(data.nickname ?? "")}
                </div>
              )}
              <div>
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.modal.fields.nickname")}</p>
                <p className="text-xl font-semibold" style={{ color: "var(--page-text)" }}>{data.nickname || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.modal.fields.country")}</p>
                <p>{data.country || "-"}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.modal.fields.englishLevel")}</p>
                <p>{translateEnglishLevel(data.englishLevel, t)}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.modal.fields.lastSeen")}</p>
                <p>{formatLastSeenSummary(data.lastSeenAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.modal.fields.description")}</p>
              <p className="whitespace-pre-line">
                {data.description?.trim()
                  ? data.description
                  : t("profile.notifications.modal.descriptionEmpty")}
              </p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.modal.fields.interests")}</p>
              {data.interests && data.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.interests.map((interest: string, index: number) => (
                    <span
                      key={`${interest}-${index}`}
                      className="px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-200 text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.notifications.modal.interestsEmpty")}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[var(--surface-muted-text)]">{t("profile.notifications.modal.notFound")}</p>
        )}
      </div>
    </div>
  );
}
