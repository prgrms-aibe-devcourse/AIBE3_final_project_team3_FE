"use client";

import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { normaliseNotificationPayload } from "@/global/lib/notifications";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { useNotificationStore } from "@/global/stores/useNotificationStore";
import { connect, disconnect, getStompClient } from "./stompClient";

const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_DESTINATION = "/app/presence/heartbeat";

const StompProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { accessToken, member } = useLoginStore();
  const memberIdentifier = (() => {
    if (member && typeof (member as Record<string, unknown>).memberId === "number") {
      return (member as Record<string, unknown>).memberId as number;
    }
    return member?.memberid ?? null;
  })();
  const [isStompConnected, setIsStompConnected] = useState(false);
  const roomSubscriptionRef = useRef<StompSubscription | null>(null);
  const notificationSubscriptionRef = useRef<StompSubscription | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
  }, []);

  const sendHeartbeat = useCallback(() => {
    if (!accessToken) {
      return;
    }

    const client = getStompClient();

    if (!client || !client.connected) {
      return;
    }

    try {
      client.publish({
        destination: HEARTBEAT_DESTINATION,
        body: JSON.stringify({ timestamp: Date.now() }),
      });
    } catch (error) {
      console.error("Presence heartbeat send error", error);
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
    if (!accessToken) {
      unsubscribeAll();
      resetNotifications();
      setIsStompConnected(false);
      disconnect();
      return;
    }

    console.log(
      "StompProvider: Calling connect with accessToken (first 10 chars):",
      accessToken ? accessToken.substring(0, 10) + "..." : "null",
    );

    connect(accessToken, () => {
      setIsStompConnected(true);
    });

    return () => {
      setIsStompConnected(false);
    };
  }, [accessToken, resetNotifications, unsubscribeAll]);

  useEffect(() => {
    const client = getStompClient();

    if (!client || !client.connected || !isStompConnected || !memberIdentifier) {
      return;
    }

    console.log(`Subscribing to /topic/user/${memberIdentifier}/rooms`);

    unsubscribeAll();

    roomSubscriptionRef.current = client.subscribe(
      `/topic/user/${memberIdentifier}/rooms`,
      (message) => {
        console.log("Received new room info:", message.body);
        queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      }
    );

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
      `/user/queue/notifications`,
      handleNotification,
    );

    return () => {
      unsubscribeAll();
    };
  }, [isStompConnected, memberIdentifier, prependNotification, queryClient, unsubscribeAll]);

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
