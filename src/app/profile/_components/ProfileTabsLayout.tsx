"use client";

import { Bell, UserRoundCheck, Users } from "lucide-react";

import { useProfileTabs } from "./ProfileTabsProvider";
import { FriendRelationshipsPanel } from "./FriendRelationshipsPanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProfileInfoPanel } from "./ProfileInfoPanel";

type ProfileTabKey = "profile" | "friends" | "notifications";

const TAB_ITEMS: Array<{ id: ProfileTabKey; label: string; description: string; icon: typeof UserRoundCheck }> = [
  {
    id: "profile",
    label: "프로필",
    description: "기본 정보와 자기소개를 수정합니다.",
    icon: UserRoundCheck,
  },
  {
    id: "friends",
    label: "친구 관계",
    description: "친구 API 응답 미리보기",
    icon: Users,
  },
  {
    id: "notifications",
    label: "알림",
    description: "알림 API 응답 미리보기",
    icon: Bell,
  },
];

export function ProfileTabsLayout() {
  const { activeTab, setActiveTab } = useProfileTabs();

  const renderActivePanel = () => {
    switch (activeTab) {
      case "friends":
        return <FriendRelationshipsPanel />;
      case "notifications":
        return <NotificationsPanel />;
      case "profile":
      default:
        return <ProfileInfoPanel />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">My Page</h1>
        <p className="text-gray-400 text-sm">
          프로필, 친구, 알림 데이터를 하나의 provider에서 미리 준비해 두고 탭으로 전환할 수 있도록 구성했습니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {TAB_ITEMS.map(({ id, label, description, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-colors ${
                isActive
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-gray-700 bg-gray-900/40 text-gray-300 hover:border-gray-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              <div className="text-left">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {renderActivePanel()}
    </div>
  );
}
