"use client";

import { useState } from "react";

interface User {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
  bio: string;
  interests: string[];
  hobbies: string[];
  location: string;
  language: string;
  joinedDate: string;
}

export default function FindPage() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([
    {
      id: 1,
      name: "Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
      lastSeen: "online",
      bio: "English teacher passionate about helping students improve their conversation skills. Love discussing books, movies, and cultural differences!",
      interests: ["Education", "Literature", "Movies", "Travel"],
      hobbies: ["Reading", "Cooking", "Photography", "Hiking"],
      location: "New York, USA",
      language: "Native English",
      joinedDate: "2024-09-15",
    },
    {
      id: 2,
      name: "Miguel Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
      lastSeen: "online",
      bio: "Software developer learning English to advance my career. Always excited to practice with native speakers and share Spanish culture!",
      interests: ["Technology", "Programming", "Culture", "Sports"],
      hobbies: ["Coding", "Soccer", "Guitar", "Gaming"],
      location: "Madrid, Spain",
      language: "Spanish (Learning English)",
      joinedDate: "2024-10-01",
    },
    {
      id: 3,
      name: "Emma Wilson",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
      lastSeen: "online",
      bio: "Marketing professional who loves meeting people from different cultures. Happy to help with English pronunciation and business terminology!",
      interests: ["Marketing", "Business", "Culture", "Art"],
      hobbies: ["Painting", "Yoga", "Traveling", "Podcasts"],
      location: "London, UK",
      language: "Native English",
      joinedDate: "2024-08-20",
    },
    {
      id: 4,
      name: "Yuki Tanaka",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
      lastSeen: "online",
      bio: "University student studying international relations. Love anime, Japanese culture, and practicing English through casual conversations!",
      interests: ["Anime", "Culture", "International Relations", "Music"],
      hobbies: ["Anime watching", "Manga reading", "Karaoke", "Cooking"],
      location: "Tokyo, Japan",
      language: "Japanese (Learning English)",
      joinedDate: "2024-09-30",
    },
    {
      id: 5,
      name: "Alex Chen",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      isOnline: true,
      lastSeen: "online",
      bio: "Engineer passionate about technology and innovation. Looking for English conversation partners to discuss tech trends and improve business English!",
      interests: ["Technology", "Innovation", "Science", "Entrepreneurship"],
      hobbies: ["Electronics", "Robotics", "Basketball", "Chess"],
      location: "Seoul, South Korea",
      language: "Korean (Learning English)",
      joinedDate: "2024-10-10",
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const startChat = (user: User) => {
    // This would typically navigate to a chat page or open a chat modal
    alert(`Starting chat with ${user.name}...`);
  };

  const sendFriendRequest = (user: User) => {
    alert(`Friend request sent to ${user.name}!`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-white">Find People</h1>
        <p className="text-gray-300">
          Discover online users and start conversations to practice English
          together
        </p>
      </div>

      {/* Online Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {onlineUsers.map((user) => (
          <div
            key={user.id}
            className="bg-gray-800 border border-gray-600 rounded-lg p-6 hover:border-emerald-500 transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedUser(user)}
          >
            <div className="flex items-center mb-4">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-gray-800 rounded-full"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">
                  {user.name}
                </h3>
                <p className="text-emerald-400 text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Online
                </p>
                <p className="text-gray-400 text-sm">{user.location}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
              {user.bio}
            </p>

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">
                INTERESTS
              </p>
              <div className="flex flex-wrap gap-1">
                {user.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full"
                  >
                    {interest}
                  </span>
                ))}
                {user.interests.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{user.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startChat(user);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Start Chat
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sendFriendRequest(user);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Add Friend
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedUser.name}
                    </h2>
                    <p className="text-emerald-400 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Online now
                    </p>
                    <p className="text-gray-400">{selectedUser.location}</p>
                    <p className="text-gray-400 text-sm">
                      {selectedUser.language}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    About
                  </h3>
                  <p className="text-gray-300">{selectedUser.bio}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Hobbies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.hobbies.map((hobby, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-600 text-white rounded-full text-sm"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Member Since
                  </h3>
                  <p className="text-gray-300">
                    {new Date(selectedUser.joinedDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => startChat(selectedUser)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded font-medium transition-colors"
                >
                  Start Conversation
                </button>
                <button
                  onClick={() => sendFriendRequest(selectedUser)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded font-medium transition-colors"
                >
                  Send Friend Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
