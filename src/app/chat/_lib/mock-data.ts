import { ChatRoom, Message } from "../_components/ChatPage";

export const mockUsers = [
  {
    id: "user-1",
    name: "Sarah",
    avatar: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    id: "user-2",
    name: "John",
    avatar: "https://i.pravatar.cc/150?u=john",
  },
];

export const mockGroupRooms: ChatRoom[] = [
  {
    id: "group-1",
    name: "Travel Discussion",
    avatar: "✈️",
    lastMessage: "Just got back from Italy!",
    lastMessageTime: "8:15 PM",
    unreadCount: 3,
    type: "group",
  },
  {
    id: "group-2",
    name: "English Study Group",
    avatar: "📚",
    lastMessage: "Let's review chapter 5.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    type: "group",
  },
];

export const mockAiRooms: ChatRoom[] = [
  {
    id: "ai-1",
    name: "AI Tutor",
    avatar: "🤖",
    lastMessage: "Hello! How can I help you today?",
    lastMessageTime: "Now",
    unreadCount: 0,
    type: "ai",
  },
];

export const mockMessages: Record<string, Message[]> = {
  "ai-1": [
    {
      id: "msg-ai-1",
      text: "Hello! I'm your AI English tutor. Feel free to ask me anything or practice your conversation skills.",
      sender: { name: "AI Tutor", avatar: "🤖" },
      timestamp: "10:30 PM",
    },
  ],
  "group-1": [
    {
      id: "msg-g1-1",
      text: "Hey everyone! I just got back from a trip to Italy. It was amazing!",
      sender: { name: "Alice", avatar: "https://i.pravatar.cc/150?u=alice" },
      timestamp: "8:15 PM",
    },
    {
      id: "msg-g1-2",
      text: "Wow, that sounds incredible! Which cities did you visit?",
      sender: { name: "Bob", avatar: "https://i.pravatar.cc/150?u=bob" },
      timestamp: "8:16 PM",
    },
    {
      id: "msg-g1-3",
      text: "I went to Rome, Florence, and Venice. The food was out of this world!",
      sender: { name: "Alice", avatar: "https://i.pravatar.cc/150?u=alice" },
      timestamp: "8:17 PM",
    },
  ],
  "user-1": [
    {
      id: "msg-u1-1",
      text: "Hey Sarah, how are you doing?",
      sender: { name: "You", avatar: "" },
      timestamp: "10:40 PM",
    },
    {
      id: "msg-u1-2",
      text: "I'm doing great, thanks for asking! How about you?",
      sender: { name: "Sarah", avatar: "https://i.pravatar.cc/150?u=sarah" },
      timestamp: "10:41 PM",
    },
    {
      id: "msg-u1-3",
      text: "I'm good! Just finished a project. It was tough but rewarding.",
      sender: { name: "You", avatar: "" },
      timestamp: "10:42 PM",
    },
  ],
};
