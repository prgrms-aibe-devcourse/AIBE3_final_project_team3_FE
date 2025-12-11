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
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--page-text)" }}>
          {t('profile.page.title')}
        </h1>
        <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>
          {t('profile.page.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2 lg:grid-cols-3">
        {TAB_CONFIG.map(({ id, labelKey, descriptionKey, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 border transition-all shadow-sm text-left ${isActive
                ? "bg-[var(--card-surface)] border-emerald-300 text-emerald-600 shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
                : "bg-[var(--surface-panel)] border-[var(--surface-border)] text-[var(--surface-muted-text)] hover:text-[var(--page-text)] hover:border-emerald-200/60"
                }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-emerald-500" : "text-[var(--surface-muted-text)]"}`} />
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: isActive ? "var(--page-text)" : "inherit" }}>
                  {t(labelKey)}
                </p>
                <p className="text-xs" style={{ color: "var(--surface-muted-text)" }}>{t(descriptionKey)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {renderActivePanel()}
    </div>
  );
}
