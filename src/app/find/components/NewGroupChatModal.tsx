"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCreateGroupChat } from "@/global/api/useChatQuery";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { CreateGroupChatReq } from "@/global/types/chat.types";

type NewGroupChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NewGroupChatModal({
  isOpen,
  onClose,
}: NewGroupChatModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("언어 교환"); // Default to "언어 교환"
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { mutate: createGroupChat, isPending } = useCreateGroupChat();
  const member = useLoginStore((state) => state.member);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) {
      alert("로그인이 필요합니다.");
      return;
    }

    const newGroupChat: CreateGroupChatReq = {
      roomName: title,
      description: description,
      topic: topic,
      memberIds: [member.id], // Only current user for now, can add more later
      password: usePassword && password ? password : undefined,
    };

    createGroupChat(newGroupChat, {
      onSuccess: (newRoomData) => {
        alert("그룹 채팅방이 성공적으로 생성되었습니다.");

        // Close modal and reset state
        onClose();
        setTitle("");
        setDescription("");
        setTopic("언어 교환");
        setUsePassword(false);
        setPassword("");

        // Navigate to the new chat room (router.push is already handled in useCreateGroupChat)
      },
      onError: (err) => {
        console.error("그룹 채팅방 생성 실패:", err);
        alert(`그룹 채팅방 생성에 실패했습니다: ${err.message}`);
      },
    });
  };

  const topics = [
    { value: "언어 교환", label: "언어 교환", emoji: "🗣️" },
    { value: "문화 교류", label: "문화 교류", emoji: "🌍" },
    { value: "운동", label: "운동", emoji: "🏋️" },
    { value: "독서", label: "독서", emoji: "📚" },
    { value: "게임", label: "게임", emoji: "🎮" },
    { value: "요리", label: "요리", emoji: "🍳" },
    { value: "음악", label: "음악", emoji: "🎵" },
    { value: "IT", label: "IT", emoji: "💻" },
    { value: "자유", label: "자유", emoji: "💬" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-lg max-w-md w-full shadow-xl"
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Create New Group Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Room Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Room Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
            />
          </div>
          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Room Topic
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full appearance-none bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {topics.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center">
              <input
                id="usePassword"
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="usePassword"
                className="ml-2 block text-sm text-gray-300"
              >
                Use Password
              </label>
            </div>
          </div>
          {usePassword && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Room Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
