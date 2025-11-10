import Link from 'next/link';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="bg-base-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* 좌측: MixChat 로고 */}
          <Link href="/" className="text-2xl font-bold hover:text-primary transition-colors">
            MixChat
          </Link>
          
          {/* 중앙: 네비게이션 메뉴 */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* 채팅 드롭다운 */}
            <div className="dropdown dropdown-hover">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                채팅
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                <li><Link href="/chat/ai">AI 채팅</Link></li>
                <li><Link href="/chat/roleplay">상황극 채팅</Link></li>
                <li><Link href="/chat/direct">1:1 채팅</Link></li>
                <li><Link href="/chat/group">그룹 채팅</Link></li>
              </ul>
            </div>
            
            {/* 포스트 */}
            <Link href="/post" className="btn btn-ghost">
              포스트
            </Link>
            
            {/* 학습노트 */}
            <Link href="/study-note" className="btn btn-ghost">
              학습노트
            </Link>
            
            {/* 신고 처리 (관리자용) */}
            <Link href="/report" className="btn btn-ghost">
              신고
            </Link>
          </nav>
          
          {/* 우측: 알림, 마이페이지, 로그인, 테마 토글 */}
          <div className="flex items-center gap-4">
            {/* 알림 드롭다운 컴포넌트 */}
            <NotificationDropdown />
            
            {/* 마이페이지 */}
            <Link href="/mypage" className="btn btn-ghost btn-sm">
              마이페이지
            </Link>
            
            {/* 로그인 */}
            <Link href="/login" className="btn btn-primary btn-sm">
              로그인
            </Link>
            
            {/* 테마 토글 */}
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}