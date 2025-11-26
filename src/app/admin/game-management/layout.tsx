'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GameManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* 페이지 제목 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          게임 문장 관리
        </h1>


        {/* 하위 페이지 영역 */}
        {children}
      </div>
    </div>
  );
}
