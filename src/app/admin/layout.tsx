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
      {/* 전체 배경 다크 */}
      <div className="min-h-screen bg-gray-900 text-gray-200">

        {/* 상단 네비게이션 바 */}
        <div className="bg-gray-800 border-b border-gray-700 px-8 py-4 shadow-sm flex items-center gap-6">

          <Link
            href="/admin/report-management"
            className={`${
              isReport
                ? 'text-indigo-400 font-bold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            신고 관리
          </Link>

          <Link
            href="/admin/game-management/list"
            className={`${
              isGameList
                ? 'text-indigo-400 font-bold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            게임 목록
          </Link>

          <Link
            href="/admin/game-management/add"
            className={`${
              isGameAdd
                ? 'text-indigo-400 font-bold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
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
