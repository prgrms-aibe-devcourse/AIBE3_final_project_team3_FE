"use client";

import { Check, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useFriendDetailQuery } from "@/global/api/useMemberQuery";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/global/api/useNotificationQuery";
import { useToastStore } from "@/global/stores/useToastStore";
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

export function NotificationsPanel() {
  const {
    notificationsQuery,
    notificationPage,
    notificationPageSize,
    setNotificationPage,
  } = useProfileTabs();
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
      new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
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
      addToast("이미 읽은 알림입니다.", "info");
      return;
    }

    setPendingReadId(notification.id);
    markNotificationReadMutation(notification.id, {
      onSuccess: () => {
        addToast("알림을 읽음 처리했어요.");
        refetch();
      },
      onError: (mutationError) => {
        addToast(mutationError.message || "알림을 읽음 처리하지 못했습니다.", "error");
      },
      onSettled: () => {
        setPendingReadId(null);
      },
    });
  };

  const handleDeleteNotification = (notification: NotificationItem) => {
    if (!window.confirm("이 알림을 삭제할까요?")) {
      return;
    }

    setPendingDeleteId(notification.id);
    deleteNotificationMutation(notification.id, {
      onSuccess: () => {
        addToast("알림을 삭제했어요.");
        refetch();
      },
      onError: (mutationError) => {
        addToast(mutationError.message || "알림을 삭제하지 못했습니다.", "error");
      },
      onSettled: () => {
        setPendingDeleteId(null);
      },
    });
  };

  const handleMarkAllNotifications = () => {
    if (notifications.length === 0) {
      addToast("처리할 알림이 없습니다.", "info");
      return;
    }

    markAllNotificationsReadMutation(undefined, {
      onSuccess: () => {
        addToast("모든 알림을 읽음 처리했어요.");
        refetch();
      },
      onError: (mutationError) => {
        addToast(mutationError.message || "모든 알림을 읽음 처리하지 못했습니다.", "error");
      },
    });
  };

  const handleDeleteAllNotifications = () => {
    if (notifications.length === 0) {
      addToast("삭제할 알림이 없습니다.", "info");
      return;
    }

    if (!window.confirm("모든 알림을 삭제할까요?")) {
      return;
    }

    deleteAllNotificationsMutation(undefined, {
      onSuccess: () => {
        addToast("모든 알림을 삭제했어요.");
        setNotificationPage(0);
        refetch();
      },
      onError: (mutationError) => {
        addToast(mutationError.message || "모든 알림을 삭제하지 못했습니다.", "error");
      },
    });
  };

  const handleViewSenderProfile = (senderId: NotificationItem["senderId"]) => {
    if (senderId == null) {
      addToast("보낸 사람 정보를 확인할 수 없습니다.", "error");
      return;
    }

    const memberId = typeof senderId === "number" ? senderId : Number(senderId);
    if (!Number.isFinite(memberId)) {
      addToast("올바른 회원 ID가 아닙니다.", "error");
      return;
    }

    setSenderDetailId(memberId);
  };

  const handleCloseSenderDetail = () => {
    setSenderDetailId(null);
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <p className="text-sm text-gray-400">알림을 미리 불러와 탭을 이동해도 끊김 없이 확인할 수 있어요.</p>
          <p className="text-xs text-gray-500">총 {totalCount}개 · 페이지당 {notificationPageSize}개</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-500 text-gray-200 hover:bg-gray-700 disabled:opacity-60"
          >
            {isFetching ? "갱신 중" : "새로고침"}
          </button>
          <button
            type="button"
            onClick={handleMarkAllNotifications}
            disabled={isMarkingAll || notifications.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-emerald-500/70 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            모두 읽음
          </button>
          <button
            type="button"
            onClick={handleDeleteAllNotifications}
            disabled={isDeletingAll || notifications.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            모두 삭제
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-300">알림을 불러오는 중입니다...</p>
      ) : error ? (
        <p className="text-red-400">알림을 불러오지 못했습니다: {error.message}</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-400">아직 받은 알림이 없습니다.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {paginatedNotifications.map((notification) => {
              const formattedDate = notification.createdAt
                ? dateFormatter.format(new Date(notification.createdAt))
                : "방금";
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
                  className={`rounded-lg border px-4 py-3 bg-gray-900/40 ${notification.isRead ? "border-gray-700" : "border-emerald-500/50"
                    }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <span aria-hidden>{resolveNotificationEmoji(notification.type)}</span>
                          {resolveNotificationTitle(notification)}
                        </p>
                        {!notification.isRead ? (
                          <span className="text-xs text-emerald-400">읽지 않음</span>
                        ) : (
                          <span className="text-xs text-gray-500">읽음</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formattedDate}</p>
                      <p className="text-sm text-gray-300 mt-2 whitespace-pre-line">{notification.message}</p>
                      {canViewProfile ? (
                        <button
                          type="button"
                          onClick={() => handleViewSenderProfile(senderMemberId)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                        >
                          프로필 보기
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      {!notification.isRead ? (
                        <button
                          type="button"
                          onClick={() => handleMarkNotification(notification)}
                          disabled={notification.isRead || isMarking}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-600 text-gray-200 hover:border-emerald-400 disabled:opacity-60"
                          aria-label="알림 읽음 처리"
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">읽음 처리</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDeleteNotification(notification)}
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                        aria-label="알림 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">알림 삭제</span>
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
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-200 disabled:opacity-60"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
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
                        ? "border-emerald-500 text-white bg-emerald-500/10"
                        : "border-gray-600 text-gray-300 hover:border-emerald-400"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="text-sm text-gray-300">
              페이지 {currentPage}
              {totalPages > 0 ? ` / ${totalPages}` : ""}
            </div>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!canGoNext}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-200 disabled:opacity-60"
            >
              다음
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">보낸 사람 정보</h3>
            <p className="text-sm text-gray-400">알림 보낸 사용자의 프로필을 바로 확인할 수 있어요.</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-300">상세 정보를 불러오는 중입니다...</p>
        ) : error ? (
          <p className="text-red-400">상세 정보를 불러오지 못했습니다: {error.message}</p>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              {data.profileImageUrl ? (
                <img
                  src={data.profileImageUrl}
                  alt={`${data.nickname ?? "알림 사용자"} 프로필 이미지`}
                  className="h-20 w-20 rounded-full object-cover border-2 border-emerald-500/60"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-700 text-white text-2xl font-semibold flex items-center justify-center border border-gray-600">
                  {getInitialFromName(data.nickname ?? "")}
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">닉네임</p>
                <p className="text-xl text-white font-semibold">{data.nickname || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">국가</p>
                <p className="text-gray-200">{data.country || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">영어 레벨</p>
                <p className="text-gray-200">{data.englishLevel || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">최근 온라인</p>
                <p className="text-gray-200">{formatLastSeenSummary(data.lastSeenAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">소개</p>
              <p className="text-gray-200 whitespace-pre-line">
                {data.description?.trim() ? data.description : "소개가 아직 등록되지 않았습니다."}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">관심사</p>
              {data.interests && data.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.interests.map((interest, index) => (
                    <span
                      key={`${interest}-${index}`}
                      className="px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-200 text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">등록된 관심사가 없습니다.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-300">표시할 친구 정보를 찾지 못했습니다.</p>
        )}
      </div>
    </div>
  );
}
