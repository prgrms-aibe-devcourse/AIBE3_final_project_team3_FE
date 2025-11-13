"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Notification {
  id: number;
  type:
    | "friend_request"
    | "friend_accepted"
    | "chat_invitation"
    | "room_invitation";
  message: string;
  from: string;
  timestamp: Date;
  isRead: boolean;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "friend_request",
      message: "Sarah Johnson sent you a friend request",
      from: "Sarah Johnson",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      isRead: false,
    },
    {
      id: 2,
      type: "friend_accepted",
      message: "Miguel Rodriguez accepted your friend request",
      from: "Miguel Rodriguez",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isRead: false,
    },
    {
      id: 3,
      type: "chat_invitation",
      message: "Emma Wilson wants to start a 1:1 chat with you",
      from: "Emma Wilson",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      isRead: false,
    },
    {
      id: 4,
      type: "room_invitation",
      message: "Yuki Tanaka invited you to join 'Travel Stories' chat room",
      from: "Yuki Tanaka",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: true,
    },
    {
      id: 5,
      type: "room_invitation",
      message: "Chen Wei invited you to join 'Study Buddy' chat room",
      from: "Chen Wei",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".notifications-dropdown")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "friend_request":
        return "👤";
      case "friend_accepted":
        return "✅";
      case "chat_invitation":
        return "💬";
      case "room_invitation":
        return "🏠";
      default:
        return "📢";
    }
  };

  const markAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationAction = (
    notification: Notification,
    action: "accept" | "decline"
  ) => {
    // Mock notification actions
    if (notification.type === "friend_request") {
      alert(`Friend request ${action}ed!`);
    } else if (notification.type === "chat_invitation") {
      alert(`Chat invitation ${action}ed!`);
    } else if (notification.type === "room_invitation") {
      alert(`Room invitation ${action}ed!`);
    }
    markAsRead(notification.id);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm shadow-lg border-b border-gray-600 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-emerald-400">
            EnglishChat
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link
              href="/"
              className="text-gray-200 hover:text-emerald-400 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/chat"
              className="text-gray-200 hover:text-emerald-400 transition-colors"
            >
              Chat
            </Link>
            <Link
              href="/find"
              className="text-gray-200 hover:text-emerald-400 transition-colors"
            >
              Find
            </Link>
            <Link
              href="/learning-notes"
              className="text-gray-200 hover:text-emerald-400 transition-colors"
            >
              Learning Notes
            </Link>
            <Link
              href="/profile"
              className="text-gray-200 hover:text-emerald-400 transition-colors"
            >
              My Page
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative notifications-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-200 hover:text-emerald-400 transition-colors p-2 rounded-full hover:bg-gray-700/50"
                title="Notifications"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                  <div className="p-3 border-b border-gray-600 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center">
                        <div className="text-2xl mb-2">🔔</div>
                        <p className="text-gray-400 text-sm">
                          No notifications
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                            !notification.isRead ? "bg-gray-750/50" : ""
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTimeAgo(notification.timestamp)}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1"></div>
                              )}

                              {/* Action buttons for certain notification types */}
                              {(notification.type === "friend_request" ||
                                notification.type === "chat_invitation" ||
                                notification.type === "room_invitation") &&
                                !notification.isRead && (
                                  <div className="flex space-x-2 mt-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNotificationAction(
                                          notification,
                                          "accept"
                                        );
                                      }}
                                      className="bg-emerald-600 text-white px-3 py-1 rounded text-xs hover:bg-emerald-700 transition-colors"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNotificationAction(
                                          notification,
                                          "decline"
                                        );
                                      }}
                                      className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/auth/login"
              className="text-gray-200 hover:text-emerald-400 transition-colors flex items-center"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-500 transition-colors shadow-lg flex items-center"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center">
              <span
                className={`block h-0.5 w-6 bg-gray-200 transition-all ${
                  isMenuOpen ? "rotate-45 translate-y-1" : "mb-1"
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-gray-200 transition-all ${
                  isMenuOpen ? "hidden" : "mb-1"
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-gray-200 transition-all ${
                  isMenuOpen ? "-rotate-45 -translate-y-1" : ""
                }`}
              ></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 bg-gray-800/95">
            <nav className="flex flex-col space-y-2 px-4">
              {/* Mobile Notifications */}
              <div className="py-2">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="flex items-center justify-between w-full text-gray-200 hover:text-emerald-400 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    <span>Notifications</span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Mobile Notifications List */}
                {showNotifications && (
                  <div className="mt-2 bg-gray-750 rounded-lg border border-gray-600 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-600 flex justify-between items-center">
                      <span className="text-xs font-medium text-white">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-2 border-b border-gray-700 last:border-b-0 ${
                          !notification.isRead ? "bg-gray-700/50" : ""
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="text-sm">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                Home
              </Link>
              <Link
                href="/chat"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                Chat
              </Link>
              <Link
                href="/find"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                Find
              </Link>
              <Link
                href="/learning-notes"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                Learning Notes
              </Link>
              <Link
                href="/profile"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                My Page
              </Link>
              <Link
                href="/auth/login"
                className="text-gray-200 hover:text-emerald-400 transition-colors py-2"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-500 transition-colors text-center shadow-lg"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
