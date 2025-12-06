"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCreateDirectChat } from "@/global/api/useChatQuery";
import { useFriendDetailQuery, useMemberProfileQuery } from "@/global/api/useMemberQuery";
import { useFriendshipActions } from "@/global/hooks/useFriendshipActions";
import { getCountryFlagEmoji, normaliseCountryValue } from "@/global/lib/countries";
import {
  FRIENDSHIP_BADGE_STYLE,
  FRIENDSHIP_STATUS_DESCRIPTIONS,
  FRIENDSHIP_STATUS_LABELS,
  FriendshipState,
  MemberListItem,
  MemberSource,
  formatFriendSince,
  formatLastSeen,
  getAvatar,
  getPresenceMeta,
  normaliseInterests,
  normaliseNumericId,
  resolveEnglishLevelMeta,
  resolveIsOnline,
  resolveProfileImageUrl,
} from "../_lib/memberUtils";

interface FindProfileContextValue {
  openProfile: (user: MemberListItem, source: MemberSource) => void;
  closeProfile: () => void;
}

const FindProfileContext = createContext<FindProfileContextValue | null>(null);

export const useFindProfileModal = () => {
  const context = useContext(FindProfileContext);
  if (!context) {
    throw new Error("FindProfileProvider is missing in the component tree.");
  }

  return context;
};

const viewUserPosts = (user: MemberListItem | null) => {
  if (!user) {
    return;
  }
  alert(`${user.nickname}님의 게시글 보기 기능은 추후 제공될 예정입니다.`);
};

const startGroupChatInvite = (user: MemberListItem | null) => {
  if (!user) {
    return;
  }
  alert(`${user.nickname}님을 그룹 챗으로 초대하는 기능은 추후 제공될 예정입니다.`);
};

export function FindProfileProvider({ children }: { children: React.ReactNode }) {
  const [selectedUser, setSelectedUser] = useState<MemberListItem | null>(null);
  const [selectedSource, setSelectedSource] = useState<MemberSource | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const skipAutoSelectRef = useRef<number | null>(null);

  const requestedMemberId = useMemo(() => {
    const raw = searchParams.get("memberId");
    return normaliseNumericId(raw);
  }, [searchParams]);

  const openProfile = (user: MemberListItem, source: MemberSource) => {
    skipAutoSelectRef.current = null;
    setSelectedSource(source);
    setSelectedUser(user);
  };

  const closeProfile = () => {
    const closedMemberId = normaliseNumericId(selectedUser?.id) ?? requestedMemberId ?? null;
    skipAutoSelectRef.current = closedMemberId;
    setSelectedSource(null);
    setSelectedUser(null);

    const params = new URLSearchParams(searchParams.toString());
    if (params.has("memberId")) {
      params.delete("memberId");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  };

  useEffect(() => {
    if (requestedMemberId == null) {
      return;
    }

    const shouldSkipAutoSelect = skipAutoSelectRef.current === requestedMemberId;
    if (shouldSkipAutoSelect) {
      return;
    }

    if (skipAutoSelectRef.current !== null && skipAutoSelectRef.current !== requestedMemberId) {
      skipAutoSelectRef.current = null;
    }

    if (selectedUser) {
      return;
    }

    setSelectedSource("members");
    setSelectedUser({
      id: requestedMemberId,
      memberId: requestedMemberId,
      nickname: `member-${requestedMemberId}`,
      country: "-",
      englishLevel: "BEGINNER",
      interests: [],
      description: "",
      profileImageUrl: "",
      isOnline: false,
    } as MemberListItem);
  }, [requestedMemberId, selectedUser]);

  const selectedUserId = useMemo(
    () => normaliseNumericId((selectedUser as { id?: number | string } | null)?.id),
    [selectedUser],
  );

  const selectedFriendMemberId = useMemo(() => {
    if (selectedSource !== "friends" || !selectedUser) {
      return null;
    }

    const candidateIds = [
      (selectedUser as { memberId?: number | string }).memberId,
      (selectedUser as { id?: number | string }).id,
    ];

    for (const candidate of candidateIds) {
      const normalised = normaliseNumericId(candidate);
      if (normalised != null) {
        return normalised;
      }
    }

    return null;
  }, [selectedSource, selectedUser]);

  const {
    data: selectedFriendDetail,
    isLoading: isFriendDetailLoading,
    isFetching: isFriendDetailFetching,
    error: selectedFriendDetailError,
  } = useFriendDetailQuery(selectedFriendMemberId ?? undefined);

  const effectiveProfileMemberId = selectedUserId ?? requestedMemberId ?? undefined;
  const {
    data: selectedProfile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    error: selectedProfileError,
  } = useMemberProfileQuery(effectiveProfileMemberId);

  useEffect(() => {
    const shouldSkipAutoSelect =
      requestedMemberId != null && skipAutoSelectRef.current === requestedMemberId;
    if (shouldSkipAutoSelect) {
      return;
    }

    if (skipAutoSelectRef.current !== null && skipAutoSelectRef.current !== requestedMemberId) {
      skipAutoSelectRef.current = null;
    }

    if (selectedUser || !requestedMemberId || !selectedProfile) {
      return;
    }

    const fallbackId =
      normaliseNumericId(selectedProfile.memberId) ??
      normaliseNumericId(selectedProfile.id) ??
      requestedMemberId;

    if (!fallbackId) {
      return;
    }

    const fallbackMember: MemberListItem = {
      id: fallbackId,
      memberId: fallbackId,
      nickname:
        selectedProfile.nickname ??
        selectedProfile.name ??
        selectedProfile.email ??
        `member-${fallbackId}`,
      name: selectedProfile.name ?? selectedProfile.nickname ?? null,
      description: selectedProfile.description ?? "",
      lastSeenAt: selectedProfile.lastSeenAt ?? undefined,
      interests: Array.isArray(selectedProfile.interests) ? selectedProfile.interests : [],
      country: selectedProfile.countryName ?? selectedProfile.country ?? "",
      englishLevel: selectedProfile.englishLevel ?? "BEGINNER",
      isOnline: false,
      profileImageUrl: selectedProfile.profileImageUrl ?? "",
    } as MemberListItem;

    setSelectedSource("members");
    setSelectedUser(fallbackMember);
  }, [requestedMemberId, selectedProfile, selectedUser]);

  const selectedProfileMemberId = useMemo(() => {
    const friendDetailId = normaliseNumericId(selectedFriendDetail?.memberId);
    if (friendDetailId != null) {
      return friendDetailId;
    }

    if (selectedProfile) {
      return (
        normaliseNumericId(selectedProfile.memberId) ??
        normaliseNumericId(selectedProfile.id) ??
        selectedUserId ??
        selectedFriendMemberId ??
        null
      );
    }

    return selectedUserId ?? selectedFriendMemberId ?? null;
  }, [selectedFriendDetail, selectedProfile, selectedUserId, selectedFriendMemberId]);

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

  const hasIncomingFriendRequest = useMemo(
    () =>
      Boolean(
        opponentPendingRequestId ??
          selectedProfile?.receivedFriendRequestId ??
          (typeof selectedProfile?.isPendingFriendRequestFromOpponent === "boolean" &&
            selectedProfile.isPendingFriendRequestFromOpponent),
      ),
    [opponentPendingRequestId, selectedProfile],
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

  const createChatMutation = useCreateDirectChat();
  const {
    sendFriendRequest: mutateSendFriendRequest,
    acceptFriendRequest: mutateAcceptFriendRequest,
    rejectFriendRequest: mutateRejectFriendRequest,
    deleteFriend: mutateDeleteFriend,
    status: friendshipActionStatus,
  } = useFriendshipActions();
  const { isSending, isAccepting, isRejecting, isDeleting } = friendshipActionStatus;

  const startChat = (user: MemberListItem) => {
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

    const targetName = selectedProfile?.nickname || selectedUser?.nickname || "해당 회원";
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

  const modalNickname =
    selectedFriendDetail?.nickname ?? selectedProfile?.nickname ?? selectedUser?.nickname ?? "";
  const modalName = selectedProfile?.name ?? selectedUser?.name ?? "";
  const modalEnglishLevel =
    selectedFriendDetail?.englishLevel ??
    selectedProfile?.englishLevel ??
    selectedUser?.englishLevel ??
    "";
  const modalDescription =
    selectedFriendDetail?.description ??
    selectedProfile?.description ??
    selectedUser?.description ??
    "";
  const modalCountryMeta = normaliseCountryValue(
    selectedFriendDetail?.country ??
      selectedProfile?.country ??
      selectedProfile?.countryName ??
      selectedUser?.country ??
      "",
  );
  const modalCountryDisplay = modalCountryMeta.name || "-";
  const modalCountryFlag = getCountryFlagEmoji(modalCountryMeta.code);

  const englishLevelMeta = resolveEnglishLevelMeta(modalEnglishLevel);
  const modalEnglishLevelDisplay = englishLevelMeta.label;
  const modalEnglishLevelBadgeClass = englishLevelMeta.badgeClass;
  const modalEnglishLevelIcon = englishLevelMeta.icon;

  const modalInterests = selectedFriendDetail
    ? normaliseInterests(selectedFriendDetail.interests)
    : selectedProfile
      ? normaliseInterests(selectedProfile.interests)
      : normaliseInterests(selectedUser?.interests);
  const modalDisplayName =
    (modalName ? `${modalNickname} (${modalName})` : modalNickname) ||
    selectedUser?.nickname ||
    "회원 정보";
  const modalDescriptionDisplay = modalDescription || "소개 정보가 아직 없습니다.";
  const fallbackModalNickname = modalNickname || selectedUser?.nickname || "member";
  const modalAvatarSrc =
    resolveProfileImageUrl(selectedFriendDetail?.profileImageUrl) ??
    resolveProfileImageUrl(selectedProfile?.profileImageUrl) ??
    resolveProfileImageUrl(selectedUser?.profileImageUrl) ??
    getAvatar(fallbackModalNickname);

  const modalPresence = getPresenceMeta(resolveIsOnline(selectedUser));
  const modalLastSeenSource =
    selectedFriendDetail?.lastSeenAt ??
    selectedProfile?.lastSeenAt ??
    (selectedUser as { lastSeenAt?: string } | null)?.lastSeenAt ??
    null;
  const isCurrentlyOnline = resolveIsOnline(selectedUser) === true;
  const modalLastSeenDisplay = !isCurrentlyOnline && modalLastSeenSource
    ? formatLastSeen(modalLastSeenSource)
    : null;
  const isFriendDetailPending =
    selectedSource === "friends" && (isFriendDetailLoading || isFriendDetailFetching);
  const friendDetailErrorMessage =
    selectedSource === "friends" && selectedFriendDetailError
      ? selectedFriendDetailError.message
      : null;
  const friendSinceDisplay =
    selectedSource === "friends" && selectedFriendDetail?.createdAt
      ? formatFriendSince(selectedFriendDetail.createdAt)
      : null;

  const isProfilePending = Boolean(selectedUser) && (isProfileLoading || isProfileFetching);

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
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${FRIENDSHIP_BADGE_STYLE[modalFriendshipState]}`}>
          {FRIENDSHIP_STATUS_LABELS[modalFriendshipState]}
        </span>
        <span className="text-xs text-gray-300">{FRIENDSHIP_STATUS_DESCRIPTIONS[modalFriendshipState]}</span>
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

  return (
    <FindProfileContext.Provider value={{ openProfile, closeProfile }}>
      {children}
      {selectedUser ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="relative w-20 h-20">
                    <Image
                      src={modalAvatarSrc}
                      alt={modalDisplayName || selectedUser.nickname || "회원 아바타"}
                      width={80}
                      height={80}
                      unoptimized
                      className="rounded-full object-cover w-20 h-20"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 border-gray-800 rounded-full ${modalPresence.badgeClass}`}></div>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-white">{modalDisplayName}</h2>
                    <div className="flex items-center gap-2 text-gray-300">
                      {modalCountryFlag ? (
                        <span className="text-xl" aria-hidden>
                          {modalCountryFlag}
                        </span>
                      ) : null}
                      <span className="text-gray-400">{modalCountryDisplay}</span>
                    </div>
                    {modalLastSeenDisplay && (
                      <p className="text-gray-400 text-xs mt-1">
                        마지막 접속: {modalLastSeenDisplay}
                      </p>
                    )}
                    <div
                      className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${modalEnglishLevelBadgeClass}`}
                    >
                      <span aria-hidden>{modalEnglishLevelIcon}</span>
                      <span>{modalEnglishLevelDisplay}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {renderFriendshipStatus()}
                    </div>
                    {friendSinceDisplay && (
                      <p className="mt-2 text-xs text-gray-300">
                        친구가 된 날짜: <span className="text-white">{friendSinceDisplay}</span>
                      </p>
                    )}
                    {isFriendDetailPending && (
                      <p className="mt-2 text-xs text-gray-300">친구 상세 정보를 불러오는 중입니다...</p>
                    )}
                    {friendDetailErrorMessage && (
                      <p className="mt-2 text-xs text-red-400">
                        친구 상세 정보를 불러오지 못했습니다.
                        {friendDetailErrorMessage ? ` (${friendDetailErrorMessage})` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeProfile}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p className="text-gray-300">{modalDescriptionDisplay}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {modalInterests.map((interest, index) => (
                      <span key={index} className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">
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
                <button
                  type="button"
                  onClick={() => startChat(selectedUser)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded font-medium transition-colors"
                >
                  1:1 대화하기
                </button>
                <button
                  type="button"
                  onClick={() => startGroupChatInvite(selectedUser)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded font-medium transition-colors"
                >
                  그룹챗 초대하기
                </button>
                {renderFriendshipActions()}
                <button
                  type="button"
                  onClick={() => viewUserPosts(selectedUser)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded font-medium transition-colors"
                >
                  게시글 보러가기
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </FindProfileContext.Provider>
  );
}
