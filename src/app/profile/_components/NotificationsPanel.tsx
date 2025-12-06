"use client";

import { useMemo } from "react";

import { useProfileTabs } from "./ProfileTabsProvider";

export function NotificationsPanel() {
  const { notificationsQuery } = useProfileTabs();
  const { data, isLoading, error, refetch, isFetching } = notificationsQuery;
  const notifications = data ?? [];

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }), []);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <p className="text-sm text-gray-400">알림 API 결과를 즉시 확인할 수 있도록 탭에 연동해두었습니다.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-500 text-gray-200 hover:bg-gray-700 disabled:opacity-60"
        >
          {isFetching ? "갱신 중" : "새로고침"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-300">알림을 불러오는 중입니다...</p>
      ) : error ? (
        <p className="text-red-400">알림을 불러오지 못했습니다: {error.message}</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-400">아직 받은 알림이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="rounded-lg border border-gray-700 px-4 py-3 bg-gray-900/40"
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{notification.title || notification.type.toUpperCase()}</p>
                <span className="text-xs text-gray-400">
                  {notification.createdAt ? dateFormatter.format(new Date(notification.createdAt)) : "방금"}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
              {!notification.isRead ? (
                <span className="inline-flex mt-2 text-xs text-emerald-400">읽지 않음</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
