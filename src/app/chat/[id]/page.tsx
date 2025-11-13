"use client";

import { useParams } from "next/navigation";
import { useChatStore } from "@/global/stores/useChatStore";
import ChatWindow from "../_components/ChatWindow";
import { useEffect } from "react";

export default function ChatRoomPage() {
  const params = useParams();
  const { rooms, activeTab, setSelectedRoomId } = useChatStore();
  
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      setSelectedRoomId(id);
    }
  }, [id, setSelectedRoomId]);

  const room = rooms[activeTab].find((r) => r.id === id);

  if (!room) {
    // This can happen briefly on tab switch, layout effect will redirect.
    return (
       <main className="flex-1 flex items-center justify-center text-center">
        <div>
          <div className="text-3xl mb-4">🔄</div>
          <h2 className="text-2xl font-semibold text-gray-300">
            Loading chat...
          </h2>
        </div>
      </main>
    );
  }

  return <ChatWindow room={room} />;
}
