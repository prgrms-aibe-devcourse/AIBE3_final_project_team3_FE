"use client";

import { useState } from "react";

interface UserProfile {
  name: string;
  email: string;
  country: string;
  level: string;
  joinDate: Date;
  totalChats: number;
  vocabularyLearned: number;
  streak: number;
}

interface Friend {
  id: number;
  name: string;
  country: string;
  isOnline: boolean;
  lastSeen: Date;
  level: string;
  avatar?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "John Doe",
    email: "john.doe@example.com",
    country: "South Korea",
    level: "Intermediate",
    joinDate: new Date("2024-09-15"),
    totalChats: 45,
    vocabularyLearned: 156,
    streak: 7,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mock friends data
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: 1,
      name: "Sarah Johnson",
      country: "USA",
      isOnline: true,
      lastSeen: new Date(),
      level: "Advanced",
    },
    {
      id: 2,
      name: "Yuki Tanaka",
      country: "Japan",
      isOnline: true,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      level: "Intermediate",
    },
    {
      id: 3,
      name: "Miguel Rodriguez",
      country: "Spain",
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      level: "Beginner",
    },
    {
      id: 4,
      name: "Emma Wilson",
      country: "UK",
      isOnline: true,
      lastSeen: new Date(),
      level: "Native",
    },
    {
      id: 5,
      name: "Chen Wei",
      country: "China",
      isOnline: false,
      lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      level: "Intermediate",
    },
  ]);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const handleViewFriendProfile = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowFriendProfile(true);
  };

  const handleRemoveFriend = (friendId: number) => {
    if (confirm("Are you sure you want to remove this friend?")) {
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      setShowFriendProfile(false);
      alert("Friend removed successfully!");
    }
  };

  const handleStartChat = (friend: Friend) => {
    // Mock chat creation - in real app this would create a chat room and redirect
    alert(`Starting chat with ${friend.name}...`);
    setShowFriendProfile(false);
  };

  const handleInviteToRoom = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowInviteModal(true);
    setShowFriendProfile(false);
  };

  const handleSendInvite = (roomName: string) => {
    if (selectedFriend) {
      alert(
        `Invitation sent to ${selectedFriend.name} for "${roomName}" room!`
      );
      setShowInviteModal(false);
      setSelectedFriend(null);
    }
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-white">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                Profile Information
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-200">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-200">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Country
                </label>
                {isEditing ? (
                  <select
                    value={editForm.country}
                    onChange={(e) =>
                      setEditForm({ ...editForm, country: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="South Korea">South Korea</option>
                    <option value="Japan">Japan</option>
                    <option value="China">China</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-200">{profile.country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  English Level
                </label>
                {isEditing ? (
                  <select
                    value={editForm.level}
                    onChange={(e) =>
                      setEditForm({ ...editForm, level: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Native">Native</option>
                  </select>
                ) : (
                  <p className="text-gray-200">{profile.level}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Member Since
                </label>
                <p className="text-gray-200">
                  {profile.joinDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Friends Section */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Friends ({friends.length})
              </h2>
              <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                Find Friends
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-gray-400">No friends yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start chatting to make new friends!
                  </p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                  >
                    <div
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => handleViewFriendProfile(friend)}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-white">
                            {friend.name.charAt(0)}
                          </span>
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-700 ${
                            friend.isOnline ? "bg-emerald-500" : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {friend.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {friend.country} • {friend.level}
                        </p>
                        <p className="text-xs text-gray-500">
                          {friend.isOnline
                            ? "Online"
                            : `Last seen ${formatLastSeen(friend.lastSeen)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartChat(friend)}
                        className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors"
                        title="Start Chat"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleInviteToRoom(friend)}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                        title="Invite to Room"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Learning Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Chats</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {profile.totalChats}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Vocabulary Learned</span>
                <span className="text-2xl font-bold text-green-400">
                  {profile.vocabularyLearned}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Streak</span>
                <span className="text-2xl font-bold text-amber-400">
                  {profile.streak} days
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Achievements
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">🏆</span>
                </div>
                <div>
                  <p className="font-medium text-white">First Chat</p>
                  <p className="text-sm text-gray-400">
                    Completed your first conversation
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">📚</span>
                </div>
                <div>
                  <p className="font-medium text-white">Vocabulary Master</p>
                  <p className="text-sm text-gray-400">Learned 100+ words</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">🔥</span>
                </div>
                <div>
                  <p className="font-medium text-white">Week Streak</p>
                  <p className="text-sm text-gray-400">
                    7 days consecutive learning
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">💬</span>
                </div>
                <div>
                  <p className="font-medium text-white">AI Chat Session</p>
                  <p className="text-sm text-gray-400">
                    Practiced conversation for 20 minutes
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">📝</span>
                </div>
                <div>
                  <p className="font-medium text-white">New Vocabulary</p>
                  <p className="text-sm text-gray-400">
                    Added 3 new words to learning notes
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-400">Yesterday</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">👥</span>
                </div>
                <div>
                  <p className="font-medium text-white">User Chat</p>
                  <p className="text-sm text-gray-400">
                    Joined 'Travel English' room
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-400">2 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Friend Profile Modal */}
      {showFriendProfile && selectedFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-600 w-full max-w-md">
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Friend Profile
                </h3>
                <button
                  onClick={() => setShowFriendProfile(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-white">
                    {selectedFriend.name.charAt(0)}
                  </span>
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-800 ${
                    selectedFriend.isOnline ? "bg-emerald-500" : "bg-gray-500"
                  }`}
                />
              </div>

              <h4 className="text-xl font-semibold text-white mb-2">
                {selectedFriend.name}
              </h4>
              <p className="text-gray-300 mb-1">{selectedFriend.country}</p>
              <p className="text-sm text-gray-400 mb-1">
                English Level: {selectedFriend.level}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {selectedFriend.isOnline
                  ? "🟢 Online"
                  : `🔴 Last seen ${formatLastSeen(selectedFriend.lastSeen)}`}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleStartChat(selectedFriend)}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Start Private Chat</span>
                </button>

                <button
                  onClick={() => handleInviteToRoom(selectedFriend)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  <span>Invite to Group Chat</span>
                </button>

                <button
                  onClick={() => handleRemoveFriend(selectedFriend.id)}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Remove Friend</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite to Room Modal */}
      {showInviteModal && selectedFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-600 w-full max-w-md">
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Invite {selectedFriend.name} to Chat Room
                </h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedFriend(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-300 mb-3">
                    Choose a room to invite {selectedFriend.name} to:
                  </p>

                  <div className="space-y-2">
                    {/* Mock available rooms */}
                    {[
                      {
                        name: "Travel Stories",
                        members: 12,
                        topic: "Share travel experiences",
                      },
                      {
                        name: "Food & Cooking",
                        members: 8,
                        topic: "Discuss recipes and cuisines",
                      },
                      {
                        name: "Music Lovers",
                        members: 15,
                        topic: "Talk about favorite music",
                      },
                      {
                        name: "Study Buddy",
                        members: 6,
                        topic: "Help each other with English",
                      },
                    ].map((room) => (
                      <button
                        key={room.name}
                        onClick={() => handleSendInvite(room.name)}
                        className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600 hover:border-blue-500"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {room.name}
                            </p>
                            <p className="text-sm text-gray-400">
                              {room.topic}
                            </p>
                          </div>
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                            {room.members} members
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <button
                    onClick={() => {
                      const roomName = prompt("Enter new room name:");
                      if (roomName) {
                        handleSendInvite(roomName);
                      }
                    }}
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Create New Room & Invite</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
