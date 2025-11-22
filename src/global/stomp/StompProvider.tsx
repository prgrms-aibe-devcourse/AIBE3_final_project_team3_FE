"use client";

import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import { API_BASE_URL } from "@/global/consts";
import { normaliseNotificationPayload } from "@/global/lib/notifications";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { useNotificationStore } from "@/global/stores/useNotificationStore";
import { connect, disconnect, getStompClient } from "./stompClient";

const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/presence/heartbeat`;

const StompProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { accessToken, member } = useLoginStore();
  const roomSubscriptionRef = useRef<StompSubscription | null>(null);
  const notificationSubscriptionRef = useRef<StompSubscription | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatAbortControllerRef = useRef<AbortController | null>(null);
  const prependNotification = useNotificationStore((state) => state.prependNotification);
  const resetNotifications = useNotificationStore((state) => state.reset);

  const unsubscribeAll = useCallback(() => {
    if (roomSubscriptionRef.current) {
      roomSubscriptionRef.current.unsubscribe();
      roomSubscriptionRef.current = null;
    }

    if (notificationSubscriptionRef.current) {
      notificationSubscriptionRef.current.unsubscribe();
      notificationSubscriptionRef.current = null;
    }
  }, []);

  const cleanupHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (heartbeatAbortControllerRef.current) {
      heartbeatAbortControllerRef.current.abort();
      heartbeatAbortControllerRef.current = null;
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    heartbeatAbortControllerRef.current?.abort();
    const controller = new AbortController();
    heartbeatAbortControllerRef.current = controller;

    try {
      const response = await fetch(HEARTBEAT_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn("Presence heartbeat failed", response.status, response.statusText);
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        console.error("Presence heartbeat error", error);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      cleanupHeartbeat();
      return;
    }

    // Immediately send the first heartbeat, then continue at the configured interval.
    void sendHeartbeat();

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cleanupHeartbeat();
    };
  }, [accessToken, cleanupHeartbeat, sendHeartbeat]);

  useEffect(() => {
    if (accessToken && member?.id) {
      const onConnected = () => {
        // This code runs after the STOMP client is successfully connected
        const client = getStompClient();
        console.log(`Subscribing to /topic/user/${member.id}/rooms`);

        // Rooms subscription
        if (roomSubscriptionRef.current) {
          roomSubscriptionRef.current.unsubscribe();
        }

        roomSubscriptionRef.current = client.subscribe(
          `/topic/user/${member.id}/rooms`,
          (message) => {
            console.log("Received new room info:", message.body);
            // When a new room is created, invalidate queries for the chat room list
            queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
          }
        );

        // Notifications subscription (user-specific queue)
        if (notificationSubscriptionRef.current) {
          notificationSubscriptionRef.current.unsubscribe();
        }

        const handleNotification = (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body ?? "{}");
            prependNotification(normaliseNotificationPayload(payload));
          } catch (error) {
            console.error("Failed to parse notification payload", error);
            prependNotification({
              id: Date.now(),
              type: "system",
              message: message.body || "새로운 알림이 도착했습니다.",
              createdAt: new Date().toISOString(),
              isRead: false,
            });
          }
        };

        notificationSubscriptionRef.current = client.subscribe(
          `/user/queue/notifications/`,
          handleNotification,
        );
      };

      // Initiate connection and pass the callback
      console.log("StompProvider: Calling connect with accessToken (first 10 chars):", accessToken ? accessToken.substring(0, 10) + "..." : "null"); // 로그 추가
      connect(accessToken, onConnected);

    } else {
      // If there's no token or user, ensure the client is disconnected
      unsubscribeAll();
      resetNotifications();
      disconnect();
    }
  }, [accessToken, member?.id, prependNotification, queryClient, resetNotifications, unsubscribeAll]);

  // Global handler for logout
  useEffect(() => {
    const unsub = useLoginStore.subscribe(
      (state, prevState) => {
        if (prevState.accessToken && !state.accessToken) {
          console.log("User logged out, disconnecting STOMP client.");
          unsubscribeAll();
          resetNotifications();
          cleanupHeartbeat();
          disconnect();
        }
      }
    );
    return unsub;
  }, [cleanupHeartbeat, resetNotifications, unsubscribeAll]);

  return <>{children}</>;
};

export default StompProvider;
