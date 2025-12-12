"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLogout } from "@/global/api/useAuthQuery";
import { useAcceptFriendRequest, useRejectFriendRequest } from "@/global/api/useFriendshipMutation";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
} from "@/global/api/useNotificationQuery";
import apiClient from "@/global/backend/client";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { useNotificationStore } from "@/global/stores/useNotificationStore";
import { NotificationItem } from "@/global/types/notification.types";
import { useShallow } from "zustand/react/shallow";

const FRIEND_REQUEST_ID_KEYS = [
  "friendRequestId",
  "requestId",
  "pendingFriendRequestId",
  "pendingFriendRequestIdFromOpponent",
  "receivedFriendRequestId",
] as const;

const toNumericId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const extractFriendRequestIdFromRecord = (
  record?: Record<string, unknown> | null,
): number | null => {
  if (!record) {
    return null;
  }

  for (const key of FRIEND_REQUEST_ID_KEYS) {
    const id = toNumericId(record[key]);
    if (typeof id === "number") {
      return id;
    }
  }

  return null;
};

const resolveFriendRequestId = async (notification: NotificationItem): Promise<number | null> => {
  const metadataRecord =
    notification.metadata && typeof notification.metadata === "object"
      ? (notification.metadata as Record<string, unknown>)
      : null;

  const metadataId = extractFriendRequestIdFromRecord(metadataRecord);
  if (metadataId) {
    return metadataId;
  }

  if (!notification.senderId) {
    return null;
  }

  const { data, error } = await apiClient.GET("/api/v1/members/{id}", {
    params: {
      path: {
        id: notification.senderId,
      },
    },
  });

  if (error) {
    throw new Error("친구 요청 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const payload = (data ?? {}) as { data?: unknown };
  const profileRecord =
    (payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : null) ||
    (typeof data === "object" && data ? (data as Record<string, unknown>) : null);

  return extractFriendRequestIdFromRecord(profileRecord);
};

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [friendRequestActionId, setFriendRequestActionId] = useState<number | null>(null);
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markNotificationInStore,
    markAllNotificationsInStore,
  } = useNotificationStore(
    useShallow((state) => ({
      notifications: state.items,
      unreadCount: state.unreadCount,
      markNotificationInStore: state.markAsRead,
      markAllNotificationsInStore: state.markAllAsRead,
    })),
  );

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".notifications-dropdown")) {
        setShowNotifications(false);
      }
      if (!target.closest(".language-dropdown")) {
        setIsLangMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { role } = useLoginStore();

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    console.log("Notification type:", type);
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

  const { mutateAsync: acceptFriendRequestMutation } = useAcceptFriendRequest();
  const { mutateAsync: rejectFriendRequestMutation } = useRejectFriendRequest();

  const handleNotificationAction = async (
    notification: NotificationItem,
    action: "accept" | "decline",
  ) => {
    if (notification.type !== "friend_request") {
      alert("해당 알림 타입에 연결된 동작이 없습니다.");
      return;
    }

    if (friendRequestActionId && friendRequestActionId !== notification.id) {
      alert("다른 친구 요청을 처리 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setFriendRequestActionId(notification.id);
    try {
      const requestId = await resolveFriendRequestId(notification);
      if (!requestId) {
        throw new Error("친구 요청 정보를 찾지 못했습니다. 이미 처리되었을 수 있어요.");
      }

      if (action === "accept") {
        await acceptFriendRequestMutation({
          requestId,
          opponentMemberId: notification.senderId ?? undefined,
          refreshMembers: true,
        });
        alert("친구 요청을 수락했습니다.");
      } else {
        await rejectFriendRequestMutation({
          requestId,
          opponentMemberId: notification.senderId ?? undefined,
          refreshMembers: true,
        });
        alert("친구 요청을 거절했습니다.");
      }

      handleMarkAsRead(notification.id);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "친구 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setFriendRequestActionId(null);
    }
  };

  const { accessToken, hasHydrated } = useLoginStore(
    useShallow((state) => ({
      accessToken: state.accessToken,
      hasHydrated: state.hasHydrated,
    })),
  );
  const { mutate: triggerLogout, isPending: isLoggingOut } = useLogout();
  const isLoggedIn = Boolean(accessToken);
  const { mutate: markNotificationRead } = useMarkNotificationRead();
  const { mutate: markAllNotificationsRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();
  const { mutate: deleteNotificationMutation } = useDeleteNotification();
  const { mutate: deleteAllNotificationsMutation } = useDeleteAllNotifications();
  const {
    refetch: refetchNotifications,
    isFetching: isNotificationsFetching,
  } = useNotificationsQuery({ enabled: hasHydrated && isLoggedIn });

  const handleMarkAsRead = (notificationId: number) => {
    markNotificationInStore(notificationId);
    if (isLoggedIn) {
      markNotificationRead(notificationId);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsInStore();
    if (isLoggedIn) {
      markAllNotificationsRead();
    }
  };

  const handleLogout = () => {
    if (!isLoggingOut) {
      triggerLogout();
    }
  };

  const handleViewSenderProfile = (senderId: number | null) => {
    if (!senderId) {
      alert("보낸 사람 정보를 확인할 수 없습니다.");
      return;
    }

    setShowNotifications(false);
    router.push(`/find?memberId=${senderId}`);
  };

  const handleDeleteNotification = (notificationId: number) => {
    if (deletingId) {
      return;
    }

    setDeletingId(notificationId);
    deleteNotificationMutation(notificationId, {
      onSettled: () => {
        setDeletingId(null);
      },
    });
  };

  const renderAuthButtons = (variant: "desktop" | "mobile") => {
    const isDesktop = variant === "desktop";

    if (!hasHydrated) {
      return isDesktop ? (
        <div className="flex items-center space-x-3 text-gray-500">
          <span className="h-4 w-16 rounded bg-gray-700/60 animate-pulse" aria-hidden />
          <span className="h-8 w-20 rounded bg-gray-700/60 animate-pulse" aria-hidden />
        </div>
      ) : (
        <div className="flex flex-col gap-2 py-2 text-gray-500">
          <span className="h-4 w-24 rounded bg-gray-700/60 animate-pulse" aria-hidden />
          <span className="h-10 w-full rounded bg-gray-700/60 animate-pulse" aria-hidden />
        </div>
      );
    }

    if (isLoggedIn) {
      return isDesktop ? (
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-gray-200 hover:text-emerald-400 transition-colors flex items-center disabled:opacity-70"
        >
          {isLoggingOut ? t("header.auth.loggingOut") : t("header.auth.logout")}
        </button>
      ) : (
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-gray-200 hover:text-emerald-400 transition-colors py-2 text-left disabled:opacity-70"
        >
          {isLoggingOut ? t("header.auth.loggingOut") : t("header.auth.logout")}
        </button>
      );
    }

    return isDesktop ? (
      <>
        <Link
          href="/auth/login"
          className="text-gray-200 hover:text-emerald-400 transition-colors flex items-center"
        >
          {t("header.auth.login")}
        </Link>
        <Link
          href="/auth/signup"
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-500 transition-colors shadow-lg flex items-center"
        >
          {t("header.auth.signup")}
        </Link>
      </>
    ) : (
      <>
        <Link
          href="/auth/login"
          className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
        >
          {t("header.auth.login")}
        </Link>
        <Link
          href="/auth/signup"
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-500 transition-colors text-center shadow-lg"
        >
          {t("header.auth.signup")}
        </Link>
      </>
    );
  };

  return (
    <header
      className="app-header fixed top-0 left-0 right-0 backdrop-blur-sm shadow-lg border-b z-50"
      style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--header-border)" }}
    >
      <div className="container mx-auto px-4 relative">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-emerald-400 flex-shrink-0">
            {t("header.brand")}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-4 flex-1 justify-center mx-4 overflow-x-auto">
            <Link
              href="/"
              className="text-gray-200 hover:text-emerald-400 transition-colors whitespace-nowrap text-sm"
            >
              {t("header.nav.home")}
            </Link>
            <Link
              href="/chat"
              className="text-gray-200 hover:text-emerald-400 transition-colors whitespace-nowrap text-sm"
            >
              {t("header.nav.chat")}
            </Link>
            <Link
              href="/find"
              className="text-gray-200 hover:text-emerald-400 transition-colors whitespace-nowrap text-sm"
            >
              {t("header.nav.find")}
            </Link>
            <Link
              href="/board"
              className="text-gray-200 hover:text-emerald-400 transition-colors whitespace-nowrap text-sm"
            >
              {t("header.nav.board")}
            </Link>
            <Link
              href="/learning-notes"
              className="text-gray-200 hover:text-emerald-400 transition-colors whitespace-nowrap text-sm"
            >
              {t("header.nav.learningNotes")}
            </Link>
            <Link
              href="/profile"
              className="text-gray-200 hover:text-emerald-400 transition-colors whitespace-nowrap text-sm"
            >
              {t("header.nav.myPage")}
            </Link>
            {role === "ROLE_ADMIN" && (
              <Link
                href="/admin/report-management"
                className="text-red-400 hover:text-red-300 transition-colors font-semibold whitespace-nowrap text-sm"
              >
                {t("header.nav.admin")}
              </Link>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            <ThemeToggle />
            {/* Language Dropdown */}
            <div className="relative language-dropdown">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`flex items-center gap-1 rounded-2xl border px-2 py-1.5 text-xs font-medium transition-colors bg-[var(--surface-panel)] text-[var(--page-text)] ${isLangMenuOpen ? "border-emerald-400" : "border-[var(--surface-border)] hover:border-emerald-400"}`}
              >
                <span className="text-lg">{language === 'ko' ? '🇰🇷' : '🇺🇸'}</span>
                <svg className={`w-3 h-3 transition-transform hidden sm:block ${isLangMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isLangMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 rounded-2xl shadow-2xl border theme-card z-50 py-1"
                  style={{ borderColor: "var(--surface-border)" }}
                >
                  <button
                    onClick={() => { setLanguage('ko'); setIsLangMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 rounded-xl transition-colors ${language === 'ko'
                      ? 'border border-emerald-400/60 text-emerald-400 bg-emerald-500/10'
                      : 'border border-transparent text-[var(--page-text)] hover:border-emerald-300/60'}`}
                  >
                    <span>🇰🇷</span>
                    <span>{t("header.language.korean")}</span>
                  </button>
                  <button
                    onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 rounded-xl transition-colors ${language === 'en'
                      ? 'border border-emerald-400/60 text-emerald-400 bg-emerald-500/10'
                      : 'border border-transparent text-[var(--page-text)] hover:border-emerald-300/60'}`}
                  >
                    <span>🇺🇸</span>
                    <span>{t("header.language.english")}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative notifications-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-2xl border text-sm transition-colors bg-[var(--surface-panel)] ${showNotifications
                  ? "border-emerald-400 text-emerald-400"
                  : "border-[var(--surface-border)] text-[var(--page-text)] hover:border-emerald-400"}`}
                title={t("header.notifications.title")}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center min-w-4 font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 theme-card rounded-3xl shadow-2xl border z-50 max-h-96 overflow-hidden"
                  style={{ borderColor: "var(--surface-border)" }}>
                  <div className="p-3 border-b" style={{ borderColor: "var(--surface-border)" }}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold" style={{ color: "var(--page-text)" }}>
                        {t("header.notifications.title")}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => {
                            void refetchNotifications();
                          }}
                          disabled={isNotificationsFetching}
                          className="text-[var(--surface-muted-text)] hover:text-[var(--page-text)] disabled:opacity-60"
                        >
                          {isNotificationsFetching
                            ? t("header.notifications.refreshing")
                            : t("header.notifications.refresh")}
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            disabled={isMarkingAll}
                            className="text-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                          >
                            {isMarkingAll
                              ? t("header.notifications.marking")
                              : t("header.notifications.markAll")}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!notifications.length) {
                              alert("삭제할 알림이 없습니다.");
                              return;
                            }
                            const confirmed = window.confirm("전체 알림을 삭제하시겠습니까?");
                            if (!confirmed) {
                              return;
                            }
                            deleteAllNotificationsMutation();
                            setShowNotifications(false);
                          }}
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-sm transition-colors ${notifications.length === 0
                            ? "text-[var(--surface-muted-text)] cursor-not-allowed"
                            : "text-[var(--surface-muted-text)] hover:text-red-400 hover:bg-red-400/10"}`}
                          aria-label="Delete all notifications"
                          aria-disabled={notifications.length === 0}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center">
                        <div className="text-2xl mb-2">🔔</div>
                        <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>
                          No notifications
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`relative p-3 rounded-2xl border transition-colors mb-2 ${notification.isRead
                            ? "bg-[var(--surface-panel)] border-[var(--surface-border)]"
                            : "bg-emerald-500/10 border-emerald-400/60 shadow-[0_0_18px_rgba(16,185,129,0.25)]"}`}
                        >
                          {!notification.isRead && (
                            <span className="absolute left-0 top-0 h-full w-1 bg-emerald-400 rounded-r" aria-hidden />
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-full text-[var(--surface-muted-text)] hover:bg-red-500/10 hover:text-red-400 text-lg"
                            aria-label="Delete notification"
                            disabled={deletingId === notification.id}
                          >
                            ×
                          </button>
                          <div className="flex items-start space-x-3">
                            <div className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0 pr-10">
                              <p
                                className={`text-sm ${notification.isRead
                                  ? "text-[var(--page-text)]"
                                  : "text-[var(--page-text)] font-semibold tracking-tight"}`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs mt-1 flex items-center gap-2" style={{ color: "var(--surface-muted-text)" }}>
                                {formatTimeAgo(notification.createdAt)}
                                {notification.isRead ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-[var(--surface-border)]" style={{ color: "var(--surface-muted-text)" }}>
                                    Read
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-emerald-400/50 text-emerald-400 bg-emerald-500/10">
                                    New
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                )}
                                {!notification.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-emerald-400 text-xs hover:text-emerald-300"
                                  >
                                    Mark as read
                                  </button>
                                )}
                                {notification.senderId ? (
                                  <button
                                    onClick={() => handleViewSenderProfile(notification.senderId)}
                                    className="text-xs" style={{ color: "var(--surface-muted-text)" }}
                                  >
                                    View profile
                                  </button>
                                ) : null}
                              </div>

                              {/* Action buttons for friend requests */}
                              {notification.type === "friend_request" &&
                                !notification.isRead && (
                                  <div className="flex space-x-2 mt-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void handleNotificationAction(notification, "accept");
                                      }}
                                      disabled={friendRequestActionId === notification.id}
                                      className="bg-emerald-500 text-white px-3 py-1 rounded-2xl text-xs shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors disabled:opacity-60"
                                    >
                                      {friendRequestActionId === notification.id
                                        ? "Processing..."
                                        : "Accept"}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void handleNotificationAction(notification, "decline");
                                      }}
                                      disabled={friendRequestActionId === notification.id}
                                      className="border border-[var(--surface-border)] px-3 py-1 rounded-2xl text-xs text-[var(--page-text)] hover:border-emerald-400 transition-colors disabled:opacity-60"
                                    >
                                      {friendRequestActionId === notification.id
                                        ? "Processing..."
                                        : "Decline"}
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {renderAuthButtons("desktop")}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-200 flex-shrink-0 ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center">
              <span
                className={`block h-0.5 w-6 bg-gray-200 transition-all ${isMenuOpen ? "rotate-45 translate-y-1" : "mb-1"
                  }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-gray-200 transition-all ${isMenuOpen ? "hidden" : "mb-1"
                  }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-gray-200 transition-all ${isMenuOpen ? "-rotate-45 -translate-y-1" : ""
                  }`}
              ></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4" style={{ backgroundColor: "var(--header-bg)" }}>
            <div className="px-4 py-3">
              <ThemeToggle variant="mobile" />
            </div>
            <nav className="flex flex-col space-y-2 px-4">
              {/* Mobile Notifications */}
              <div className="py-2">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`flex items-center justify-between w-full transition-colors ${showNotifications
                    ? "text-emerald-400"
                    : "text-[var(--page-text)] hover:text-emerald-400"}`}
                >
                  <span className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    <span>{t("header.notifications.title")}</span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Mobile Notifications List */}
                {showNotifications && (
                  <div className="mt-2 rounded-3xl border theme-card max-h-60 overflow-y-auto"
                    style={{ borderColor: "var(--surface-border)" }}>
                    <div className="p-3 border-b flex justify-between items-center" style={{ borderColor: "var(--surface-border)" }}>
                      <span className="text-xs font-semibold" style={{ color: "var(--page-text)" }}>
                        {t("header.notifications.title")}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            void refetchNotifications();
                          }}
                          disabled={isNotificationsFetching}
                          className="text-xs text-[var(--surface-muted-text)] hover:text-[var(--page-text)] disabled:opacity-60"
                        >
                          {isNotificationsFetching
                            ? t("header.notifications.refreshing")
                            : t("header.notifications.refresh")}
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            {t("header.notifications.markAll")}
                          </button>
                        )}
                      </div>
                    </div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative p-3 border-b last:border-b-0 rounded-2xl ${notification.isRead
                          ? "bg-[var(--surface-panel)] border-[var(--surface-border)]"
                          : "bg-emerald-500/10 border-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.25)]"
                          }`}
                      >
                        {!notification.isRead && (
                          <span className="absolute left-0 top-0 h-full w-1 bg-emerald-400 rounded-r" aria-hidden />
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-full text-[var(--surface-muted-text)] hover:bg-red-500/10 hover:text-red-400 text-lg"
                          aria-label="Delete notification"
                          disabled={deletingId === notification.id}
                        >
                          ×
                        </button>
                        <div className="flex items-start space-x-2">
                          <div className="text-sm">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0 pr-10">
                            <p
                              className={`text-xs ${notification.isRead ? "text-[var(--page-text)]" : "text-[var(--page-text)] font-semibold"}
                                }`}
                            >
                              {notification.message}
                            </p>
                            <p className="text-[11px] mt-1 flex items-center gap-2" style={{ color: "var(--surface-muted-text)" }}>
                              {formatTimeAgo(notification.createdAt)}
                              {notification.isRead ? (
                                <span className="px-1.5 py-0.5 rounded-full border border-[var(--surface-border)] uppercase tracking-wide" style={{ color: "var(--surface-muted-text)" }}>Read</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full border border-emerald-400/50 text-emerald-400 bg-emerald-500/10 uppercase tracking-wide">New</span>
                              )}
                            </p>
                            {notification.senderId ? (
                              <button
                                onClick={() => handleViewSenderProfile(notification.senderId)}
                                className="text-xs mt-1" style={{ color: "var(--surface-muted-text)" }}
                              >
                                View profile
                              </button>
                            ) : null}
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-emerald-400 text-xs mt-1 hover:text-emerald-300"
                              >
                                Mark as read
                              </button>
                            )}
                            {notification.type === "friend_request" && !notification.isRead && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleNotificationAction(notification, "accept");
                                  }}
                                  disabled={friendRequestActionId === notification.id}
                                  className="bg-emerald-500 text-white px-2 py-1 rounded-2xl text-[11px] hover:bg-emerald-400 transition-colors disabled:opacity-60"
                                >
                                  {friendRequestActionId === notification.id ? "Processing" : "Accept"}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleNotificationAction(notification, "decline");
                                  }}
                                  disabled={friendRequestActionId === notification.id}
                                  className="border border-[var(--surface-border)] px-2 py-1 rounded-2xl text-[11px] text-[var(--page-text)] hover:border-emerald-400 transition-colors disabled:opacity-60"
                                >
                                  {friendRequestActionId === notification.id ? "Processing" : "Decline"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                {t("header.nav.home")}
              </Link>
              <Link
                href="/chat"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                {t("header.nav.chat")}
              </Link>
              <Link
                href="/find"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                {t("header.nav.find")}
              </Link>
              <Link
                href="/board"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                {t("header.nav.board")}
              </Link>
              <Link
                href="/learning-notes"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                {t("header.nav.learningNotes")}
              </Link>
              <Link
                href="/profile"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                {t("header.nav.myPage")}
              </Link>
              {role === "ROLE_ADMIN" && (
                <Link
                  href="/admin/report-management"
                  className="text-red-400 hover:text-red-300 transition-colors font-semibold"
                >
                  {t("header.nav.admin")}
                </Link>
              )}
              {renderAuthButtons("mobile")}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
