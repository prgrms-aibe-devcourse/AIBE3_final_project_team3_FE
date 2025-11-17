"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { connect, disconnect, getStompClient } from "./stompClient";
import type { StompSubscription } from "@stomp/stompjs";

const StompProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { accessToken, member } = useLoginStore();
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (accessToken && member?.id) {
      const onConnected = () => {
        // This code runs after the STOMP client is successfully connected
        const client = getStompClient();
        console.log(`Subscribing to /topic/user/${member.id}/rooms`);
        
        // Unsubscribe from previous subscription if it exists
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }

        subscriptionRef.current = client.subscribe(
          `/topic/user/${member.id}/rooms`,
          (message) => {
            console.log("Received new room info:", message.body);
            // When a new room is created, invalidate queries for the chat room list
            queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
          }
        );
      };

      // Initiate connection and pass the callback
      console.log("StompProvider: Calling connect with accessToken (first 10 chars):", accessToken ? accessToken.substring(0, 10) + "..." : "null"); // 로그 추가
      connect(accessToken, onConnected);

    } else {
      // If there's no token or user, ensure the client is disconnected
      disconnect();
    }
  }, [accessToken, member?.id, queryClient]);

  // Global handler for logout
  useEffect(() => {
    const unsub = useLoginStore.subscribe(
      (state, prevState) => {
        if (prevState.accessToken && !state.accessToken) {
          console.log("User logged out, disconnecting STOMP client.");
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
          }
          disconnect();
        }
      }
    );
    return unsub;
  }, []);

  return <>{children}</>;
};

export default StompProvider;
