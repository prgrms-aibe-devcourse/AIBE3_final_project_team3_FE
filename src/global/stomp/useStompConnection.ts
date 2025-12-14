import { create } from "zustand";

// STOMP 연결 상태를 전역으로 공유 (layout.tsx와 page.tsx에서 구독용)
export const useStompConnectionStore = create<{
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}>((set) => ({
  isConnected: false,
  setIsConnected: (connected: boolean) => set({ isConnected: connected }),
}));
