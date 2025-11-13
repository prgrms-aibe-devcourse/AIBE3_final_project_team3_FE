"use client"; // Add this line

import Link from "next/link";
import { useLoginStore } from "@/global/stores/useLoginStore"; // Import useLoginStore
import { MemberSummaryResp } from "@/global/types/auth.types"; // MemberSummaryResp 타입 임포트

export default function ChatPage() {
  const { setAccessToken, setMember, accessToken } = useLoginStore(); // Get setters and current token

  const handleTemporaryLogin = () => {
    const mockToken = "YOUR_MOCK_JWT_TOKEN_HERE"; // 실제 백엔드에서 발급받은 유효한 토큰으로 교체 필요
    const mockMember: MemberSummaryResp = { // MemberSummaryResp 타입 사용
      id: 1,
      nickname: "TestUser",
      name: "테스트 사용자",
      country: "KR",
      englishLevel: "INTERMEDIATE",
      // openapi.json의 MemberSummaryResp 스키마에 맞춰 필요한 필드 추가
    };
    setAccessToken(mockToken);
    setMember(mockMember);
    alert("임시 로그인 완료! 토큰이 설정되었습니다.");
  };

  const handleLogout = () => {
    setAccessToken(null);
    setMember(null);
    alert("로그아웃 완료! 토큰이 삭제되었습니다.");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 text-white">Chat</h1>
        <p className="text-slate-300">Choose your chat experience</p>

        {/* 임시 로그인/로그아웃 버튼 */}
        <div className="mt-4 flex justify-center space-x-4">
          {!accessToken ? (
            <button
              onClick={handleTemporaryLogin}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              임시 로그인 (토큰 설정)
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              로그아웃 (토큰 삭제)
            </button>
          )}
        </div>

        {/* 토큰 확인용 UI */}
        {accessToken && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-2">
              로그인 정보 (확인용)
            </h3>
            <p className="text-sm text-green-400 break-all">
              <strong>Access Token:</strong> {accessToken}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* AI Chat */}
        <div className="bg-gray-700/80 backdrop-blur-sm border-2 border-gray-600 rounded-lg p-8 hover:border-emerald-400 transition-colors shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">AI Chat</h2>
            <p className="text-gray-200 mb-6">Choose your AI chat experience</p>

            <div className="space-y-3 mb-6">
              <Link
                href="/chat/ai/free"
                className="block bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-emerald-500 transition-colors shadow-lg"
              >
                🗣️ Free Chat
                <p className="text-xs mt-1 opacity-90">
                  Casual conversation practice
                </p>
              </Link>
              <Link
                href="/chat/ai/roleplay"
                className="block bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-500 transition-colors shadow-lg"
              >
                🎭 Roleplay Chat
                <p className="text-xs mt-1 opacity-90">
                  Scenario-based conversations (Coming Soon)
                </p>
              </Link>
            </div>

            <ul className="text-left text-sm text-gray-300 space-y-2">
              <li>✓ Available 24/7</li>
              <li>✓ Real-time feedback</li>
              <li>✓ Instant translation</li>
              <li>✓ Vocabulary tracking</li>
            </ul>
          </div>
        </div>

        {/* User Chat */}
        <div className="bg-gray-700/80 backdrop-blur-sm border-2 border-gray-600 rounded-lg p-8 hover:border-amber-400 transition-colors shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">User Chat</h2>
            <p className="text-gray-200 mb-6">
              Connect with learners worldwide through 1:1 and group chat rooms.
            </p>
            <ul className="text-left text-sm text-gray-300 mb-6 space-y-2">
              <li>✓ Real conversations</li>
              <li>✓ Cultural exchange</li>
              <li>✓ Make friends</li>
              <li>✓ Group rooms</li>
            </ul>
            <Link
              href="/chat/user"
              className="bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-500 transition-colors inline-block shadow-lg"
            >
              Join User Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Smart Translation Feature - Compact */}
      <div className="mt-8 bg-slate-600/50 backdrop-blur-sm rounded-lg p-4 max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold text-center mb-3 text-white">
          Smart Translation Feature
        </h3>
        <p className="text-slate-200 mb-3 text-center text-sm">
          Don't know a word in English? Just type it in Korean!
        </p>
        <div className="flex justify-center items-center space-x-6 text-center">
          <div className="flex items-center space-x-2">
            <div className="text-base">🔍</div>
            <p className="text-xs text-slate-300">Detect Korean</p>
          </div>
          <div className="text-slate-400">→</div>
          <div className="flex items-center space-x-2">
            <div className="text-base">🔄</div>
            <p className="text-xs text-slate-300">Translate</p>
          </div>
          <div className="text-slate-400">→</div>
          <div className="flex items-center space-x-2">
            <div className="text-base">📝</div>
            <p className="text-xs text-slate-300">Save Notes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
