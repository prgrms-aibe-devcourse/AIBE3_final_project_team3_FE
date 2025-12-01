import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import apiClient from "@/global/backend/client";
import { normaliseNotificationPayload } from "@/global/lib/notifications";
import { useNotificationStore } from "@/global/stores/useNotificationStore";
import { NotificationApiPayload, NotificationItem } from "@/global/types/notification.types";

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "msg" in error && typeof (error as { msg?: unknown }).msg === "string") {
    return (error as { msg: string }).msg;
  }
  return fallback;
};

const extractNotificationArray = (payload: unknown): NotificationApiPayload[] => {
  if (Array.isArray(payload)) {
    return payload as NotificationApiPayload[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const data = record.data;
    if (Array.isArray(data)) {
      return data as NotificationApiPayload[];
    }

    if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).content)) {
      return (data as Record<string, unknown>).content as NotificationApiPayload[];
    }

    if (Array.isArray(record.content)) {
      return record.content as NotificationApiPayload[];
    }
  }

  return [];
};

const fetchNotifications = async (): Promise<NotificationItem[]> => {
  const { data, error } = await apiClient.GET("/api/v1/notifications");

  if (error) {
    throw new Error(getApiErrorMessage(error, "알림 목록을 불러오지 못했습니다."));
  }

  const payload = data as unknown;
  const items = extractNotificationArray(payload).map(normaliseNotificationPayload);
  return items;
};

const markNotificationReadRequest = async (id: number) => {
  const { error } = await apiClient.PATCH("/api/v1/notifications/read/{id}", {
    params: {
      path: {
        id,
      },
    },
  });

  if (error) {
    throw new Error(getApiErrorMessage(error, "알림을 읽음 처리하지 못했습니다."));
  }
};

const markAllNotificationReadRequest = async () => {
  const { error } = await apiClient.PATCH("/api/v1/notifications/read-all", {});

  if (error) {
    throw new Error(getApiErrorMessage(error, "알림 전체 읽음 처리를 하지 못했습니다."));
  }
};

const deleteNotificationRequest = async (id: number) => {
  const { error } = await apiClient.DELETE("/api/v1/notifications/{id}", {
    params: {
      path: {
        id,
      },
    },
  });

  if (error) {
    throw new Error(getApiErrorMessage(error, "알림을 삭제하지 못했습니다."));
  }
};

const deleteAllNotificationRequest = async () => {
  const { error } = await apiClient.DELETE("/api/v1/notifications", {});

  if (error) {
    throw new Error(getApiErrorMessage(error, "알림을 비우지 못했습니다."));
  }
};

export const useNotificationsQuery = (options?: { enabled?: boolean }) => {
  const setNotifications = useNotificationStore((state) => state.setNotifications);

  const queryResult = useQuery<NotificationItem[], Error>({
    queryKey: ["notifications", "list"],
    queryFn: fetchNotifications,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (queryResult.data) {
      setNotifications(queryResult.data);
    }
  }, [queryResult.data, setNotifications]);

  return queryResult;
};

export const useMarkNotificationRead = () => {
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  return useMutation<void, Error, number>({
    mutationFn: (id) => markNotificationReadRequest(id),
    onSuccess: (_data, id) => {
      markAsRead(id);
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  return useMutation<void, Error, void>({
    mutationFn: () => markAllNotificationReadRequest(),
    onSuccess: () => {
      markAllAsRead();
    },
  });
};

export const useDeleteNotification = () => {
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteNotificationRequest(id),
    onSuccess: (_data, id) => {
      removeNotification(id);
    },
  });
};

export const useDeleteAllNotifications = () => {
  const reset = useNotificationStore((state) => state.reset);

  return useMutation<void, Error, void>({
    mutationFn: () => deleteAllNotificationRequest(),
    onSuccess: () => {
      reset();
    },
  });
};
