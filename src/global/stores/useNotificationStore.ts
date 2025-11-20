import { create } from "zustand";

import { mergeNotifications, normaliseNotificationPayload } from "@/global/lib/notifications";
import { NotificationItem } from "@/global/types/notification.types";

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  isHydrated: boolean;
  setNotifications: (items: NotificationItem[]) => void;
  appendNotifications: (items: NotificationItem[]) => void;
  prependNotification: (item: NotificationItem | Record<string, unknown>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  reset: () => void;
}

const calculateUnread = (items: NotificationItem[]) => items.filter((item) => !item.isRead).length;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isHydrated: false,
  setNotifications: (items) => {
    const sorted = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    set({
      items: sorted,
      unreadCount: calculateUnread(sorted),
      isHydrated: true,
    });
  },
  appendNotifications: (items) => {
    const merged = mergeNotifications(get().items, items);
    set({
      items: merged,
      unreadCount: calculateUnread(merged),
      isHydrated: true,
    });
  },
  prependNotification: (item) => {
    const notification =
      typeof item === "object" && !Array.isArray(item)
        ? normaliseNotificationPayload(item)
        : (item as NotificationItem);
    const filtered = get().items.filter((existing) => existing.id !== notification.id);
    const next = [notification, ...filtered];
    set({
      items: next,
      unreadCount: calculateUnread(next),
      isHydrated: true,
    });
  },
  markAsRead: (id) => {
    const next = get().items.map((item) => (item.id === id ? { ...item, isRead: true } : item));
    set({ items: next, unreadCount: calculateUnread(next) });
  },
  markAllAsRead: () => {
    const next = get().items.map((item) => ({ ...item, isRead: true }));
    set({ items: next, unreadCount: 0 });
  },
  removeNotification: (id) => {
    const next = get().items.filter((item) => item.id !== id);
    set({ items: next, unreadCount: calculateUnread(next) });
  },
  reset: () => {
    set({ items: [], unreadCount: 0, isHydrated: false });
  },
}));
