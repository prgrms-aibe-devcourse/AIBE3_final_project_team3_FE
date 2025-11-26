"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  country: string;
  isOnline: boolean;
  avatar?: string;
}

interface Message {
  id: number;
  text: string;
  sender: string;
  senderId: number;
  timestamp: Date;
}

interface ChatRoom {
  id: number;
  name: string;
  participants: number;
  topic: string;
  type: "" | "group";
  category?: string;
  isPrivate?: boolean;
  createdBy?: number;
}

export default function UserChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<"" | "group">("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [hiddenMessages, setHiddenMessages] = useState<Set<number>>(new Set());
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Close dropdowns and modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (showParticipants && !target.closest(".participants-dropdown")) {
        setShowParticipants(false);
      }
      
      if (selectedMessageId && !target.closest(".message-actions") && !target.closest(".report-modal") && !target.closest(".user-profile-modal")) {
        setSelectedMessageId(null);
      }

      if (showUserProfile && !target.closest(".user-profile-modal")) {
        setShowUserProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showParticipants, selectedMessageId, showUserProfile]);

  // Mock data for group chat rooms
  const groupChatRooms: ChatRoom[] = [
    {
      id: 1,
      name: "Travel Stories",
      participants: 12,
      topic: "Share your travel experiences",
      type: "group",
      category: "travel",
    },
    {
      id: 2,
      name: "Food & Cooking",
      participants: 8,
      topic: "Discuss recipes and cuisines",
      type: "group",
      category: "food",
    },
    {
      id: 3,
      name: "Music Lovers",
      participants: 15,
      topic: "Talk about your favorite music",
      type: "group",
      category: "hobby",
    },
    {
      id: 4,
      name: "Movie Club",
      participants: 25,
      topic: "Discuss movies and TV shows",
      type: "group",
      category: "hobby",
    },
    {
      id: 5,
      name: "Study Buddy",
      participants: 6,
      topic: "Help each other with English",
      type: "group",
      category: "study",
    },
  ];

  // Mock data for online users (for  chat)
  const onlineUsers: User[] = [
    { id: 1, name: "Sarah", country: "USA", isOnline: true },
    { id: 2, name: "Yuki", country: "Japan", isOnline: true },
    { id: 3, name: "Miguel", country: "Spain", isOnline: true },
    { id: 4, name: "Emma", country: "UK", isOnline: true },
    { id: 5, name: "Chen", country: "China", isOnline: true },
    { id: 6, name: "Anna", country: "Germany", isOnline: true },
  ];

  const categories = [
    { id: "all", name: "All Categories", icon: "📂" },
    { id: "travel", name: "Travel", icon: "✈️" },
    { id: "food", name: "Food & Cooking", icon: "🍳" },
    { id: "hobby", name: "Hobbies", icon: "🎨" },
    { id: "study", name: "Study", icon: "📚" },
  ];

  // Mock participants for the current room
  const getRoomParticipants = (room: ChatRoom): User[] => {
    if (room.type === "") {
      return [{ id: 999, name: "You", country: "Korea", isOnline: true }];
    }

    // Mock participants for group rooms
    const allParticipants = [
      { id: 999, name: "You", country: "Korea", isOnline: true },
      { id: 1, name: "Sarah", country: "USA", isOnline: true },
      { id: 2, name: "Yuki", country: "Japan", isOnline: true },
      { id: 3, name: "Miguel", country: "Spain", isOnline: false },
      { id: 4, name: "Emma", country: "UK", isOnline: true },
      { id: 5, name: "Chen", country: "China", isOnline: true },
      { id: 6, name: "Anna", country: "Germany", isOnline: false },
      { id: 7, name: "Pierre", country: "France", isOnline: true },
      { id: 8, name: "Raj", country: "India", isOnline: true },
    ];

    return allParticipants.slice(
      0,
      Math.min(room.participants, allParticipants.length)
    );
  };

  const startChat = (user: User) => {
    // Create a  chat room
    const chatRoom: ChatRoom = {
      id: Date.now(),
      name: `Chat with ${user.name}`,
      participants: 2,
      topic: ` conversation`,
      type: "",
    };
    setSelectedRoom(chatRoom);
    setMessages([
      {
        id: 1,
        text: `Started a conversation with ${user.name}`,
        sender: "System",
        senderId: 0,
        timestamp: new Date(),
      },
    ]);
  };

  const joinRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    // Mock messages for the room
    const welcomeMessages =
      room.type === ""
        ? [
            {
              id: 1,
              text: "You can now start chatting!",
              sender: "System",
              senderId: 0,
              timestamp: new Date(),
            },
          ]
        : [
            {
              id: 1,
              text: `Welcome to ${room.name}!`,
              sender: "System",
              senderId: 0,
              timestamp: new Date(),
            },
            {
              id: 2,
              text: "Hello everyone! How is your English study going?",
              sender: "Sarah",
              senderId: 1,
              timestamp: new Date(),
            },
          ];
    setMessages(welcomeMessages);
  };

  const createNewRoom = () => {
    setShowCreateRoom(true);
  };

  const filteredGroupRooms =
    selectedCategory === "all"
      ? groupChatRooms
      : groupChatRooms.filter((room) => room.category === selectedCategory);

  const sendMessage = () => {
    if (!inputText.trim() || !selectedRoom) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: "You",
      senderId: 999,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Mock response from another user
    setTimeout(() => {
      const responses = [
        "That's interesting!",
        "I agree with you.",
        "Can you tell me more about that?",
        "Great point!",
      ];
      const mockResponse: Message = {
        id: Date.now() + 1,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: "Sarah",
        senderId: 1,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, mockResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReportUser = () => {
    setShowReportModal(true);
  };

  const handleReportMessage = (messageId: number) => {
    setSelectedMessageId(messageId);
  };

  const handleHideMessage = (messageId: number) => {
    setHiddenMessages(prev => {
      const newSet = new Set(prev);
      newSet.add(messageId);
      return newSet;
    });
    setSelectedMessageId(null);
  };

  const handleShowUserProfile = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleAddFriend = (userId: number) => {
    // Mock friend request
    console.log("Friend request sent to user:", userId);
    alert("Friend request sent!");
    setShowUserProfile(false);
  };

  const handleBlockUser = (userId: number) => {
    // Mock block user
    console.log("User blocked:", userId);
    alert("User has been blocked.");
    setShowUserProfile(false);
  };

  const getUserInfo = (userId: number) => {
    // Mock user data - in real app this would come from API
    const allUsers = [
      ...onlineUsers,
      { id: 999, name: "You", country: "Korea", isOnline: true },
      { id: 7, name: "Pierre", country: "France", isOnline: true },
      { id: 8, name: "Raj", country: "India", isOnline: true },
    ];
    return allUsers.find(user => user.id === userId) || null;
  };

  const submitReport = () => {
    // Mock report submission
    console.log("Report submitted:", {
      type: selectedMessageId ? "message" : "user",
      messageId: selectedMessageId,
      reason: reportReason,
      details: reportDetails,
      roomId: selectedRoom?.id,
    });
    
    // Reset form
    setShowReportModal(false);
    setSelectedMessageId(null);
    setReportReason("");
    setReportDetails("");
    
    // Show success message (in real app, this would be a proper notification)
    alert("Report submitted successfully. Our team will review it shortly.");
  };

  const reportReasons = [
    "Inappropriate language",
    "Harassment or bullying", 
    "Spam or advertising",
    "Hate speech",
    "Sexual content",
    "Violence or threats",
    "Other"
  ];

  if (!selectedRoom) {
    return (
      <div className="container mx-auto px-4 py-6 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">User Chat</h1>
          <button
            onClick={createNewRoom}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            + Create Room
          </button>
        </div>

        {/* Chat Type Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("")}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === ""
                ? "bg-gray-800 text-emerald-400 shadow-sm"
                : "text-gray-200 hover:text-white"
            }`}
          >
            1:1 Chat
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "group"
                ? "bg-gray-800 text-emerald-400 shadow-sm"
                : "text-gray-200 hover:text-white"
            }`}
          >
            Group Chat
          </button>
        </div>

        {activeTab === "" ? (
          /* 1:1 Chat Section */
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">
              Start 1:1 Conversation
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-700/80 border border-gray-600 rounded-lg p-4 hover:border-emerald-400 transition-colors cursor-pointer backdrop-blur-sm"
                  onClick={() => startChat(user)}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-medium text-white">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm text-white">
                      {user.name}
                    </h3>
                    <p className="text-xs text-gray-300">{user.country}</p>
                    <div className="flex items-center justify-center mt-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                      <span className="text-xs text-emerald-400">Online</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Group Chat Section */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">
                Group Chat Rooms
              </h2>

              {/* Category Filter */}
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === category.id
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    }`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroupRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-700/80 border border-gray-600 rounded-lg p-4 hover:border-amber-400 transition-colors cursor-pointer backdrop-blur-sm"
                  onClick={() => joinRoom(room)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-base text-white">
                        {room.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded-full">
                          {categories.find((c) => c.id === room.category)?.icon}{" "}
                          {categories.find((c) => c.id === room.category)?.name}
                        </span>
                        <span className="text-xs text-gray-300 bg-gray-600 px-2 py-1 rounded-full">
                          {room.participants} users
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm mb-3">{room.topic}</p>
                  <button className="w-full bg-amber-600 text-white py-2 rounded hover:bg-amber-700 transition-colors text-sm">
                    Join Room
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedUser = getUserInfo(selectedUserId || 0);

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSelectedRoom(null)}
              className="mr-4 text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-3">
              {/* Profile image for 1:1 chat */}
              {selectedRoom.type === "" && (
                <div
                  onClick={() => handleShowUserProfile(1)}
                  className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
                  title="View profile"
                >
                  <span className="text-sm font-medium text-white">
                    {selectedRoom.name.includes("Sarah") ? "S" : "U"}
                  </span>
                </div>
              )}
              
              <div>
                <h1 className="font-semibold text-white">{selectedRoom.name}</h1>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      selectedRoom.type === ""
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 text-white"
                    }`}
                  >
                    {selectedRoom.type === "" ? "1:1 Chat" : "Group Chat"}
                  </span>
                  {selectedRoom.type === "group" ? (
                    <div className="relative participants-dropdown">
                      <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className="flex items-center space-x-1 text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        <span>
                          {selectedRoom.participants}{" "}
                          {selectedRoom.participants === 1
                            ? "participant"
                            : "participants"}
                        </span>
                        <svg
                          className={`w-4 h-4 transform transition-transform ${
                            showParticipants ? "rotate-180" : ""
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {/* Participants Dropdown */}
                      {showParticipants && (
                        <div
                          className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                          style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "#4B5563 #374151",
                          }}
                        >
                          <div className="p-3 border-b border-gray-600">
                            <h3 className="text-sm font-medium text-white">
                              Participants
                            </h3>
                          </div>
                          <div className="p-2">
                            {getRoomParticipants(selectedRoom).map(
                              (participant) => (
                                <div
                                  key={participant.id}
                                  className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded-md transition-colors"
                                >
                                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-white">
                                      {participant.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                      {participant.name}
                                      {participant.id === 999 && " (You)"}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {participant.country}
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        participant.isOnline
                                          ? "bg-emerald-500"
                                          : "bg-gray-500"
                                      }`}
                                    />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300">
                      {selectedRoom.participants}{" "}
                      {selectedRoom.participants === 1
                        ? "participant"
                        : "participants"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Report Button for 1:1 Chat */}
          {selectedRoom.type === "" && (
            <button
              onClick={handleReportUser}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-full transition-colors"
              title="Report User"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        style={{
          maxHeight: "calc(100vh - 220px)",
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 transparent",
        }}
      >
        {messages.filter(message => !hiddenMessages.has(message.id)).map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "You" ? "justify-end" : "justify-start"
            } relative`}
          >
            {/* Profile Image for other users */}
            {message.sender !== "You" && message.sender !== "System" && (
              <div
                onClick={() => handleShowUserProfile(message.senderId)}
                className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-2 mt-1 cursor-pointer hover:bg-gray-500 transition-colors flex-shrink-0"
                title={`View ${message.sender}'s profile`}
              >
                <span className="text-xs font-medium text-white">
                  {message.sender.charAt(0)}
                </span>
              </div>
            )}

            <div className="relative flex-1">
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "You"
                    ? "bg-emerald-600 text-white"
                    : message.sender === "System"
                    ? "bg-gray-600 text-gray-200 text-center"
                    : "bg-gray-700 text-gray-200 shadow-sm border border-gray-600 cursor-pointer hover:bg-gray-650"
                } ${message.sender === "You" ? "ml-auto" : ""}`}
                onClick={() => {
                  if (selectedRoom?.type === "group" && message.sender !== "You" && message.sender !== "System") {
                    handleReportMessage(message.id);
                  }
                }}
              >
                {message.sender !== "You" && message.sender !== "System" && (
                  <p className="text-xs font-medium mb-1">{message.sender}</p>
                )}
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-75">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              
              {/* Message Actions for Group Chat */}
              {selectedRoom?.type === "group" && 
               message.sender !== "You" && 
               message.sender !== "System" && 
               selectedMessageId === message.id && (
                <div className="message-actions absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-40">
                  <button
                    onClick={() => handleHideMessage(message.id)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2 border-b border-gray-600"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                    <span>Hide Message</span>
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                    </svg>
                    <span>Report Message</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Image for You (right side) */}
            {message.sender === "You" && (
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                <span className="text-xs font-medium text-white">
                  You
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 flex-shrink-0">
        <div className="flex space-x-3 items-end">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type your message in ${
              selectedRoom.type === "" ? "private chat" : selectedRoom.name
            }...`}
            className="flex-1 border border-gray-600 bg-gray-800 text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm placeholder-gray-400 overflow-hidden"
            rows={2}
            style={{ minHeight: "60px", maxHeight: "120px", height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "60px";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim()}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            style={{ minHeight: "60px" }}
          >
            Send
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="user-profile-modal bg-gray-800 rounded-lg border border-gray-600 w-full max-w-sm">
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">User Profile</h3>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-medium text-white">
                  {selectedUser.name.charAt(0)}
                </span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">{selectedUser.name}</h4>
              <p className="text-gray-300 mb-1">{selectedUser.country}</p>
              <div className="flex items-center justify-center mb-6">
                <div className={`w-2 h-2 rounded-full mr-2 ${selectedUser.isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                <span className={`text-sm ${selectedUser.isOnline ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {selectedUser.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleAddFriend(selectedUser.id)}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2ha1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  <span>Add Friend</span>
                </button>
                <button
                  onClick={() => handleBlockUser(selectedUser.id)}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  <span>Block User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="report-modal bg-gray-800 rounded-lg border border-gray-600 w-full max-w-md">
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {selectedMessageId ? "Report Message" : "Report User"}
                </h3>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setSelectedMessageId(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Reason for report *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select a reason</option>
                  {reportReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide any additional context about this report..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  <span className="font-medium">⚠️ Note:</span> False reports may result in account restrictions. 
                  Only report content that genuinely violates our community guidelines.
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-600 flex space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedMessageId(null);
                  setReportReason("");
                  setReportDetails("");
                }}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}