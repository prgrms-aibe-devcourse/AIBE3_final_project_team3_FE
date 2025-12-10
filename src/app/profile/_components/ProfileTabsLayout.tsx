"use client";

import { Bell, UserRoundCheck, Users } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { FriendRelationshipsPanel } from "./FriendRelationshipsPanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProfileInfoPanel } from "./ProfileInfoPanel";
import { useProfileTabs } from "./ProfileTabsProvider";

type ProfileTabKey = "profile" | "friends" | "notifications";

const TAB_CONFIG: Array<{ id: ProfileTabKey; icon: typeof UserRoundCheck; labelKey: string; descriptionKey: string }> = [
  {
    id: "profile",
    icon: UserRoundCheck,
    labelKey: "profile.tabs.profile.label",
    descriptionKey: "profile.tabs.profile.description",
  },
  {
    id: "friends",
    icon: Users,
    labelKey: "profile.tabs.friends.label",
    descriptionKey: "profile.tabs.friends.description",
  },
  {
    id: "notifications",
    icon: Bell,
    labelKey: "profile.tabs.notifications.label",
    descriptionKey: "profile.tabs.notifications.description",
  },
];

export function ProfileTabsLayout() {
  const { t } = useLanguage();
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
        <h1 className="text-3xl font-bold text-white mb-2">{t('profile.page.title')}</h1>
        <p className="text-gray-400 text-sm">
          {t('profile.page.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {TAB_CONFIG.map(({ id, labelKey, descriptionKey, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-colors ${isActive
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-gray-700 bg-gray-900/40 text-gray-300 hover:border-gray-500"
                }`}
            >
              <Icon className="h-5 w-5" />
              <div className="text-left">
                <p className="text-sm font-semibold">{t(labelKey)}</p>
                <p className="text-xs text-gray-400">{t(descriptionKey)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {renderActivePanel()}
    </div>
  );
}
