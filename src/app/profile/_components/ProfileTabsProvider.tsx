"use client";

import { useFriendsQuery, useMyProfile } from "@/global/api/useMemberQuery";
import { useNotificationsQuery } from "@/global/api/useNotificationQuery";
import { createContext, useContext, useMemo, useState } from "react";

type ProfileTabKey = "profile" | "friends" | "notifications";

interface ProfileTabsContextValue {
  activeTab: ProfileTabKey;
  setActiveTab: (tab: ProfileTabKey) => void;
  profileQuery: ReturnType<typeof useMyProfile>;
  friendsQuery: ReturnType<typeof useFriendsQuery>;
  notificationsQuery: ReturnType<typeof useNotificationsQuery>;
  friendPage: number;
  friendPageSize: number;
  setFriendPage: (page: number) => void;
  notificationPage: number;
  notificationPageSize: number;
  setNotificationPage: (page: number) => void;
}

const ProfileTabsContext = createContext<ProfileTabsContextValue | null>(null);

export const useProfileTabs = () => {
  const context = useContext(ProfileTabsContext);
  if (!context) {
    throw new Error("ProfileTabsProvider is missing in the component tree.");
  }
  return context;
};

export function ProfileTabsProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("profile");
  const [friendPage, setFriendPage] = useState(0);
  const [notificationPage, setNotificationPage] = useState(0);
  const friendPageSize = 10;
  const notificationPageSize = 10;
  const profileQuery = useMyProfile();
  const friendsQuery = useFriendsQuery({ page: friendPage, size: friendPageSize });
  const notificationsQuery = useNotificationsQuery({ enabled: activeTab === "notifications" });

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      profileQuery,
      friendsQuery,
      notificationsQuery,
      friendPage,
      friendPageSize,
      setFriendPage,
      notificationPage,
      notificationPageSize,
      setNotificationPage,
    }),
    [
      activeTab,
      profileQuery,
      friendsQuery,
      notificationsQuery,
      friendPage,
      friendPageSize,
      notificationPage,
      notificationPageSize,
    ],
  );

  return <ProfileTabsContext.Provider value={value}>{children}</ProfileTabsContext.Provider>;
}
