"use client";

import { useCreateDirectChat } from "@/global/api/useChatQuery";
import { useMemberProfileQuery, useMembersQuery } from "@/global/api/useMemberQuery";
import { useFriendshipActions } from "@/global/hooks/useFriendshipActions";
import { MemberSummaryResp } from "@/global/types/auth.types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

// A simple utility to generate a placeholder avatar
const getAvatar = (name: string) => `https://i.pravatar.cc/150?u=${name}`;

type FriendshipState = "FRIEND" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE";

const FRIENDSHIP_STATUS_LABELS: Record<FriendshipState, string> = {
  FRIEND: "이미 친구",
  REQUEST_SENT: "요청 전송됨",
  REQUEST_RECEIVED: "요청 도착",
  NONE: "친구 아님",
};

const FRIENDSHIP_STATUS_DESCRIPTIONS: Record<FriendshipState, string> = {
  FRIEND: "현재 서로 친구 상태입니다.",
  REQUEST_SENT: "내가 보낸 친구 요청이 상대의 승인을 기다리고 있습니다.",
  REQUEST_RECEIVED: "상대방이 보낸 친구 요청이 대기 중입니다.",
  NONE: "아직 친구 요청이 오가거나 수락된 내역이 없습니다.",
};

const FRIENDSHIP_BADGE_STYLE: Record<FriendshipState, string> = {
  FRIEND: "bg-emerald-600 text-white",
  REQUEST_SENT: "bg-blue-600 text-white",
  REQUEST_RECEIVED: "bg-amber-500 text-black",
  NONE: "bg-gray-600 text-white",
};

const normaliseNumericId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

export default function FindPage() {
  const { data: members, isLoading, error } = useMembersQuery();
  const [selectedUser, setSelectedUser] = useState<MemberSummaryResp | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const skipAutoSelectRef = useRef(false);
  const requestedMemberId = useMemo(() => {
    const raw = searchParams.get("memberId");
    return normaliseNumericId(raw);
  }, [searchParams]);

  useEffect(() => {
    if (skipAutoSelectRef.current) {
      skipAutoSelectRef.current = false;
      return;
    }

    if (!requestedMemberId || !members) {
      return;
    }

    const currentSelectedId = normaliseNumericId((selectedUser as { id?: number | string } | null)?.id);
    if (currentSelectedId === requestedMemberId) {
      return;
    }

    const matched = members.find((user) => normaliseNumericId(user.id) === requestedMemberId);
    if (matched) {
      setSelectedUser(matched);
    }
  }, [requestedMemberId, members, selectedUser]);
  const createChatMutation = useCreateDirectChat();
  const {
    sendFriendRequest: mutateSendFriendRequest,
    acceptFriendRequest: mutateAcceptFriendRequest,
    rejectFriendRequest: mutateRejectFriendRequest,
    deleteFriend: mutateDeleteFriend,
    status: friendshipActionStatus,
  } = useFriendshipActions();
  const { isSending, isAccepting, isRejecting, isDeleting } = friendshipActionStatus;
  const viewUserPosts = (user: MemberSummaryResp) => {
    alert(`${user.nickname}님의 게시글 보기 기능은 추후 제공될 예정입니다.`);
  };

  const startGroupChat = (user: MemberSummaryResp) => {
    alert(`${user.nickname}님과 그룹 챗 기능은 추후 제공될 예정입니다.`);
  };

  const selectedUserId = useMemo(() => {
    if (!selectedUser) {
      return null;
    }

    return normaliseNumericId((selectedUser as { id?: number | string }).id);
  }, [selectedUser]);

  const {
    data: selectedProfile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    error: selectedProfileError,
  } = useMemberProfileQuery(selectedUserId ?? undefined);

  const selectedProfileMemberId = useMemo(() => {
    if (selectedProfile) {
      return (
        normaliseNumericId(selectedProfile.memberId) ??
        normaliseNumericId(selectedProfile.id) ??
        selectedUserId
      );
    }

    return selectedUserId;
  }, [selectedProfile, selectedUserId]);

  const opponentPendingRequestId = useMemo(
    () =>
      normaliseNumericId(
        selectedProfile?.receivedFriendRequestId ??
        selectedProfile?.pendingFriendRequestIdFromOpponent,
      ),
    [selectedProfile],
  );

  const myPendingRequestId = useMemo(
    () => normaliseNumericId(selectedProfile?.pendingFriendRequestIdFromMe),
    [selectedProfile],
  );

  const friendshipRelationId = useMemo(
    () => normaliseNumericId(selectedProfile?.friendshipId),
    [selectedProfile],
  );

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
  const hasIncomingFriendRequest = Boolean(
    opponentPendingRequestId ??
    selectedProfile?.receivedFriendRequestId ??
    (typeof selectedProfile?.isPendingFriendRequestFromOpponent === "boolean" &&
      selectedProfile.isPendingFriendRequestFromOpponent),
  );

  const modalFriendshipState: FriendshipState | undefined = selectedProfile
    ? selectedProfile.isFriend
      ? "FRIEND"
      : selectedProfile.isFriendRequestSent || selectedProfile.isPendingFriendRequestFromMe
        ? "REQUEST_SENT"
        : hasIncomingFriendRequest
          ? "REQUEST_RECEIVED"
          : "NONE"
    : undefined;

  const startChat = (user: MemberSummaryResp) => {
    if (window.confirm(`${user.nickname}님과 채팅을 시작하시겠습니까?`)) {
      createChatMutation.mutate({ partnerId: user.id });
    }
  };

  const handleSendFriendRequest = async () => {
    if (selectedProfileMemberId == null) {
      alert("친구 요청 대상을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    try {
      await mutateSendFriendRequest({ receiverId: selectedProfileMemberId });
      alert("친구 요청을 전송했습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "친구 요청 전송 중 문제가 발생했습니다.";
      alert(message);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (opponentPendingRequestId == null) {
      alert("수락할 친구 요청 정보를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }

    try {
      await mutateAcceptFriendRequest({
        requestId: opponentPendingRequestId,
        opponentMemberId: selectedProfileMemberId ?? undefined,
      });
      alert("친구 요청을 수락했습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "친구 요청 수락 중 문제가 발생했습니다.";
      alert(message);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (opponentPendingRequestId == null) {
      alert("거절할 친구 요청 정보를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }

    try {
      await mutateRejectFriendRequest({
        requestId: opponentPendingRequestId,
        opponentMemberId: selectedProfileMemberId ?? undefined,
      });
      alert("친구 요청을 거절했습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "친구 요청 거절 중 문제가 발생했습니다.";
      alert(message);
    }
  };

  const handleRemoveFriend = async () => {
    const friendId = friendshipRelationId ?? selectedProfileMemberId;
    if (friendId == null) {
      alert("친구 정보를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const targetName = modalNickname || selectedUser?.nickname || "해당 회원";
    const confirmed = window.confirm(`${targetName}님과 친구를 해제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    try {
      await mutateDeleteFriend({
        friendId,
        opponentMemberId: selectedProfileMemberId ?? undefined,
      });
      alert("친구 관계를 해제했습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "친구 관계 해제 중 문제가 발생했습니다.";
      alert(message);
    }
  };

  const renderFriendshipStatus = () => {
    if (!selectedUser) {
      return null;
    }

    if (isProfilePending) {
      return <span className="text-xs text-gray-300">친구 상태를 불러오는 중입니다...</span>;
    }

    if (selectedProfileError) {
      return (
        <span className="text-xs text-red-400">
          친구 상태 정보를 불러오지 못했습니다.
          {selectedProfileError.message ? ` (${selectedProfileError.message})` : ""}
        </span>
      );
    }

    if (!modalFriendshipState) {
      return <span className="text-xs text-gray-400">친구 상태 정보를 가져올 수 없습니다.</span>;
    }

    return (
      <>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${FRIENDSHIP_BADGE_STYLE[modalFriendshipState]}`}
        >
          {FRIENDSHIP_STATUS_LABELS[modalFriendshipState]}
        </span>
        <span className="text-xs text-gray-300">
          {FRIENDSHIP_STATUS_DESCRIPTIONS[modalFriendshipState]}
        </span>
      </>
    );
  };

  const renderFriendshipActions = () => {
    if (!selectedUser || isProfilePending || selectedProfileError || !modalFriendshipState) {
      return null;
    }

    if (modalFriendshipState === "REQUEST_SENT") {
      return (
        <p className="text-sm text-blue-300 text-center bg-blue-900/40 px-4 py-3 rounded">
          친구 요청 대기중입니다{myPendingRequestId ? ` (요청 ID: ${myPendingRequestId})` : ""}.
        </p>
      );
    }

    if (modalFriendshipState === "REQUEST_RECEIVED") {
      if (!opponentPendingRequestId) {
        return (
          <p className="text-sm text-red-300 text-center bg-red-900/40 px-4 py-3 rounded">
            처리할 친구 요청 정보를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.
          </p>
        );
      }

      const isProcessing = isAccepting || isRejecting;

      return (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              void handleAcceptFriendRequest();
            }}
            disabled={isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700/70 disabled:cursor-not-allowed text-white px-4 py-3 rounded font-medium transition-colors"
          >
            {isAccepting ? "수락 중..." : "수락"}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleRejectFriendRequest();
            }}
            disabled={isProcessing}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-700/70 disabled:cursor-not-allowed text-white px-4 py-3 rounded font-medium transition-colors"
          >
            {isRejecting ? "거절 중..." : "거절"}
          </button>
        </div>
      );
    }

    if (modalFriendshipState === "FRIEND") {
      return (
        <button
          type="button"
          onClick={() => {
            void handleRemoveFriend();
          }}
          disabled={isDeleting}
          className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-800/70 disabled:cursor-not-allowed text-white px-4 py-3 rounded font-medium transition-colors"
        >
          {isDeleting ? "친구 제거 중..." : "친구 제거"}
        </button>
      );
    }

    if (modalFriendshipState === "NONE") {
      return (
        <button
          type="button"
          onClick={() => {
            void handleSendFriendRequest();
          }}
          disabled={isSending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700/70 disabled:cursor-not-allowed text-white px-4 py-3 rounded font-medium transition-colors"
        >
          {isSending ? "요청 보내는 중..." : "친구 요청 보내기"}
        </button>
      );
    }

    return null;
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
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {renderFriendshipStatus()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    skipAutoSelectRef.current = true;
                    setSelectedUser(null);
                    const params = new URLSearchParams(searchParams.toString());
                    if (params.has("memberId")) {
                      params.delete("memberId");
                      router.replace(`?${params.toString()}`, { scroll: false });
                    }
                  }}
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

              <div className="mt-8 space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => startChat(selectedUser)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded font-medium transition-colors"
                  >
                    1:1 대화하기
                  </button>
                  <button
                    onClick={() => startGroupChat(selectedUser)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded font-medium transition-colors"
                  >
                    그룹챗 시작하기
                  </button>
                </div>
                {renderFriendshipActions()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}