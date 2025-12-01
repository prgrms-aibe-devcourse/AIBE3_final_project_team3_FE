// app/admin/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminGuard from "./AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isReport = pathname.startsWith('/admin/report-management');
  const isGameList = pathname.startsWith('/admin/game-management/list');
  const isGameAdd = pathname.startsWith('/admin/game-management/add');

  return (
    <AdminGuard>
    <div className="min-h-screen bg-gray-50">
      {/* 공통 상단 Admin Navigation */}
      <div className="bg-white border-b px-8 py-4 shadow-sm flex items-center gap-6">

        <Link href="/admin/report-management"
          className={`${isReport ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}>
          신고 관리
        </Link>

        <Link href="/admin/game-management/list"
          className={`${isGameList ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}>
          게임 목록
        </Link>

        <Link href="/admin/game-management/add"
          className={`${isGameAdd ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}>
          게임 추가
        </Link>
      </div>

      {/* 실제 페이지 내용 */}
      <div className="p-8">
        {children}
      </div>
    </div>
    </AdminGuard>
  );
}
