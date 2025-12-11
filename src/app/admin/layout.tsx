'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLanguage } from "@/contexts/LanguageContext";
import AdminGuard from "./AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isReport = pathname.startsWith('/admin/report-management');
  const isGameList = pathname.startsWith('/admin/game-management/list');
  const isGameAdd = pathname.startsWith('/admin/game-management/add');

  const navItems = [
    {
      href: "/admin/report-management",
      label: t("admin.nav.reportManagement"),
      active: isReport,
    },
    {
      href: "/admin/game-management/list",
      label: t("admin.nav.gameList"),
      active: isGameList,
    },
    {
      href: "/admin/game-management/add",
      label: t("admin.nav.gameAdd"),
      active: isGameAdd,
    },
  ];

  return (
    <AdminGuard>
      <div
        className="min-h-screen"
        style={{ background: "var(--page-bg)", color: "var(--page-text)" }}
      >
        <div
          className="px-4 md:px-8 py-4 border-b flex flex-wrap items-center gap-3"
          style={{
            background: "var(--surface-panel)",
            borderColor: "var(--surface-border)",
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${item.active
                ? "bg-emerald-500/10 border border-emerald-400 text-emerald-400"
                : "border border-transparent text-[var(--surface-muted-text)] hover:text-[var(--page-text)] hover:border-[var(--surface-border)]"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
