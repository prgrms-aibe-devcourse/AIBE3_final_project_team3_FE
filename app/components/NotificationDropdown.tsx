"use client";

import Link from 'next/link';
import { useState } from 'react';

// 알림 타입 정의
interface Notification {
  id: number;
  receiver_id: number;
  type: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationDropdown() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 빈 알림 데이터
  const notifications: Notification[] = [];

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
    return `${Math.floor(diffMins / 1440)}일 전`;
  };

  return (
    <div className="dropdown dropdown-end">
      <button 
        tabIndex={0} 
        className="btn btn-ghost btn-circle"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="indicator">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {/* 읽지 않은 알림 배지 */}
          {unreadCount > 0 && (
            <span className="badge badge-xs badge-error indicator-item">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>
      
      {/* 알림 드롭다운 메뉴 */}
      <div tabIndex={0} className="dropdown-content menu bg-base-200 border border-base-300 rounded-box z-[1] w-80 p-4 shadow-lg">
        <div className="mb-4">
          <h3 className="font-bold text-lg">알림</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center text-base-content/60 py-8">
              새로운 알림이 없습니다.
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-3 mb-2 rounded-lg transition-colors ${
                  !notification.is_read ? 'bg-primary/10 border-l-4 border-primary' : 'bg-base-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge badge-outline badge-xs">
                        {notification.type}
                      </span>
                      <span className="text-xs text-base-content/60">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Link href="/notifications" className="btn btn-ghost btn-sm w-full">
              모든 알림 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}