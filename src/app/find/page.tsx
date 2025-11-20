"use client";

import { useCreateDirectChat } from "@/global/api/useChatQuery";
import { useMemberProfileQuery, useMembersQuery } from "@/global/api/useMemberQuery";
import { MemberSummaryResp } from "@/global/types/auth.types";
import { useMemo, useState } from "react";

// A simple utility to generate a placeholder avatar
const getAvatar = (name: string) => `https://i.pravatar.cc/150?u=${name}`;

export default function FindPage() {
  const { data: members, isLoading, error } = useMembersQuery();
  const [selectedUser, setSelectedUser] = useState<MemberSummaryResp | null>(null);
  const createChatMutation = useCreateDirectChat();
  const viewUserPosts = (user: MemberSummaryResp) => {
    alert(`${user.nickname}님의 게시글 보기 기능은 추후 제공될 예정입니다.`);
  };

  const selectedUserId = useMemo(() => {
    if (!selectedUser) {
      return null;
    }

    const rawId = (selectedUser as { id?: number | string }).id;
    if (typeof rawId === "number" && Number.isFinite(rawId)) {
      return rawId;
    }

    if (typeof rawId === "string" && rawId.trim().length > 0) {
      const parsed = Number.parseInt(rawId, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return null;
  }, [selectedUser]);

  const {
    data: selectedProfile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    error: selectedProfileError,
  } = useMemberProfileQuery(selectedUserId ?? undefined);

  const normaliseInterests = (value?: string[] | null) => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter((item) => item.length > 0);
  };

  const modalNickname = selectedProfile?.nickname ?? selectedUser?.nickname ?? "";
  const modalName = selectedProfile?.name ?? selectedUser?.name ?? "";
  const modalCountry =
    selectedProfile?.countryName ??
    selectedProfile?.country ??
    selectedUser?.country ??
    "";
  const modalEnglishLevel = selectedProfile?.englishLevel ?? selectedUser?.englishLevel ?? "";
  const modalDescription = selectedProfile?.description ?? selectedUser?.description ?? "";
  const modalInterests = selectedProfile
    ? normaliseInterests(selectedProfile.interests)
    : normaliseInterests(selectedUser?.interests);
  const modalDisplayName =
    (modalName ? `${modalNickname} (${modalName})` : modalNickname) ||
    selectedUser?.nickname ||
    "회원 정보";
  const modalCountryDisplay = modalCountry || "-";
  const modalEnglishLevelDisplay = modalEnglishLevel || "-";
  const modalDescriptionDisplay = modalDescription || "소개 정보가 아직 없습니다.";
  const isProfilePending = Boolean(selectedUser) && (isProfileLoading || isProfileFetching);

  const startChat = (user: MemberSummaryResp) => {
    if (window.confirm(`${user.nickname}님과 채팅을 시작하시겠습니까?`)) {
      createChatMutation.mutate({ partnerId: user.id });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center text-white">
          <p>Loading users...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400">
          <p>Error loading users: {error.message}</p>
        </div>
      );
    }

    if (!members || members.length === 0) {
      return (
        <div className="text-center text-gray-400">
          <p>No users found.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((user) => (
          <div
            key={user.id}
            className="bg-gray-800 border border-gray-600 rounded-lg p-6 hover:border-emerald-500 transition-all duration-300 cursor-pointer"
            onClick={() => setSelectedUser(user)}
          >
            <div className="flex items-center mb-4">
              <div className="relative">
                <img
                  src={getAvatar(user.nickname)}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-gray-800 rounded-full"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">
                  {user.nickname}
                </h3>
                <p className="text-emerald-400 text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Online
                </p>
                <p className="text-gray-400 text-sm">{user.country}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
              {user.description}
            </p>

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">
                INTERESTS
              </p>
              <div className="flex flex-wrap gap-1">
                {user.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full"
                  >
                    {interest.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startChat(user);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Start Chat
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  viewUserPosts(user);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                게시글 보러가기
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-white">Find People</h1>
        <p className="text-gray-300">
          Discover online users and start conversations to practice English
          together
        </p>
      </div>

      {renderContent()}

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={getAvatar(modalNickname || selectedUser.nickname)}
                      alt={modalDisplayName || selectedUser.nickname}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-white">{modalDisplayName}</h2>
                    <p className="text-emerald-400 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Online now
                    </p>
                    <p className="text-gray-400">{modalCountryDisplay}</p>
                    <p className="text-gray-400 text-sm">{modalEnglishLevelDisplay}</p>
                    {isProfilePending && (
                      <p className="text-xs text-gray-300 mt-1">상세 정보를 불러오는 중입니다...</p>
                    )}
                    {selectedProfileError && (
                      <p className="text-xs text-red-400 mt-1">
                        상세 정보를 불러오지 못했습니다.
                        {selectedProfileError.message ? ` (${selectedProfileError.message})` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    About
                  </h3>
                  <p className="text-gray-300">{modalDescriptionDisplay}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {modalInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                    {modalInterests.length === 0 && (
                      <span className="text-sm text-gray-400">등록된 관심사가 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => startChat(selectedUser)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded font-medium transition-colors"
                >
                  Start Conversation
                </button>
                <button
                  onClick={() => viewUserPosts(selectedUser)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded font-medium transition-colors"
                >
                  게시글 보러가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}