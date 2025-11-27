"use client";

import { useCreateDirectChat } from "@/global/api/useChatQuery";
import { useFriendDetailQuery, useFriendsQuery, useMemberProfileQuery, useMembersQuery } from "@/global/api/useMemberQuery";
import { useFriendshipActions } from "@/global/hooks/useFriendshipActions";
import { MemberPresenceSummaryResp } from "@/global/types/auth.types";
import { FriendSummary } from "@/global/types/member.types";
import { Bot, MessageSquare, Plus, UserRoundCheck, Users } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import GroupRoomList from "./components/GroupRoomList";
import NewGroupChatModal from "./components/NewGroupChatModal";
// Import new AI modal components and types
import AIScenarioModal from "./components/AIScenarioModal";
import AISituationModal from "./components/AISituationModal";
import { AICategory, AIScenario } from "./constants/aiSituations";


// A simple utility to generate a placeholder avatar
const getAvatar = (name: string) => `https://i.pravatar.cc/150?u=${name}`;

const getPresenceMeta = (isOnline?: boolean) => ({
  badgeClass: isOnline ? "bg-green-500" : "bg-gray-500",
  textClass: isOnline ? "text-emerald-400" : "text-gray-400",
  label: isOnline ? "Online" : "Offline",
});

const formatFriendSince = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

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

type ActiveTab = "1v1" | "friends" | "group" | "ai";
type MemberListItem = (MemberPresenceSummaryResp | FriendSummary) & { name?: string | null };
const DEFAULT_PAGE_SIZE = 15;

export default function FindPage() {
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageIndex = Math.max(currentPage - 1, 0);
  const {
    data: memberPage,
    isLoading,
    error,
    isFetching,
  } = useMembersQuery({ onlineOnly: showOnlineOnly, page: pageIndex, size: DEFAULT_PAGE_SIZE });
  const members = useMemo(() => memberPage?.items ?? [], [memberPage]);
  const hasMemberData = Boolean(memberPage);
  const isInitialLoading = isLoading && !hasMemberData;
  const isRefetching = isFetching && hasMemberData;
  const displayedPageNumber = isRefetching
    ? currentPage
    : (memberPage?.pageIndex ?? pageIndex) + 1;
  const [friendPage, setFriendPage] = useState(1);
  const friendPageIndex = Math.max(friendPage - 1, 0);
  const {
    data: friendPageData,
    isLoading: isFriendLoading,
    isFetching: isFriendFetching,
    error: friendError,
  } = useFriendsQuery({ page: friendPageIndex, size: DEFAULT_PAGE_SIZE });
  const friendMembers = useMemo(() => friendPageData?.items ?? [], [friendPageData]);
  const hasFriendData = Boolean(friendPageData);
  const isFriendInitialLoading = isFriendLoading && !hasFriendData;
  const isFriendRefetching = isFriendFetching && hasFriendData;
  const displayedFriendPageNumber = friendPage;
  const friendPageSize = friendPageData?.pageSize || DEFAULT_PAGE_SIZE;
  const friendHasPrevPage = friendPage > 1;
  const friendHasNextPage = (() => {
    if (typeof friendPageData?.isLast === "boolean") {
      return !friendPageData.isLast;
    }
    return friendMembers.length >= friendPageSize;
  })();
  const canFriendGoPrev = friendHasPrevPage && !isFriendInitialLoading;
  const canFriendGoNext = friendHasNextPage && !isFriendInitialLoading;
  const [selectedUser, setSelectedUser] = useState<MemberListItem | null>(null);
  const [selectedSource, setSelectedSource] = useState<"members" | "friends" | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const skipAutoSelectRef = useRef(false);
  const requestedMemberId = useMemo(() => {
    const raw = searchParams.get("memberId");
    return normaliseNumericId(raw);
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("1v1");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); // Renamed for clarity
  // New state for AI modals
  const [isAISituationModalOpen, setIsAISituationModalOpen] = useState(false);
  const [isAIScenarioModalOpen, setIsAIScenarioModalOpen] = useState(false);
  const [selectedAICategory, setSelectedAICategory] = useState<AICategory | null>(null);


  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "group" || tab === "ai" || tab === "friends") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handlePlusClick = () => {
    if (activeTab === "group") {
      setIsGroupModalOpen(true);
    } else if (activeTab === "ai") {
      setIsAISituationModalOpen(true); // Open the first AI modal
    }
  };

  // Handlers for AI modals
  const handleSelectAICategory = (category: AICategory) => {
    setSelectedAICategory(category);
    setIsAISituationModalOpen(false); // Close first modal
    setIsAIScenarioModalOpen(true); // Open second modal
  };

  const handleBackToCategories = () => {
    setIsAIScenarioModalOpen(false); // Close second modal
    setIsAISituationModalOpen(true); // Open first modal
    setSelectedAICategory(null); // Clear selected category
  };

  const handleSelectAIScenario = (scenario: AIScenario) => {
    // TODO: Implement logic to create AI chat room with this scenario
    alert(`AI 채팅방 생성 요청: ${selectedAICategory?.title} - ${scenario.title}`);
    setIsAIScenarioModalOpen(false); // Close second modal
    setSelectedAICategory(null); // Clear selected category
  };

  const closeAllAIModals = () => {
    setIsAISituationModalOpen(false);
    setIsAIScenarioModalOpen(false);
    setSelectedAICategory(null);
  };


  useEffect(() => {
    if (skipAutoSelectRef.current) {
      skipAutoSelectRef.current = false;
      return;
    }

    if (!requestedMemberId) {
      return;
    }

    const currentSelectedId = normaliseNumericId((selectedUser as { id?: number | string } | null)?.id);
    if (currentSelectedId === requestedMemberId) {
      return;
    }

    const candidateLists: Array<{ source: "members" | "friends"; list: MemberListItem[] }> = [
      { source: "members", list: members },
      { source: "friends", list: friendMembers },
    ];

    for (const { source, list } of candidateLists) {
      if (!list || list.length === 0) {
        continue;
      }

      const matched = list.find((user) => normaliseNumericId(user.id) === requestedMemberId);
      if (matched) {
        setSelectedSource(source);
        setSelectedUser(matched);
        break;
      }
    }
  }, [requestedMemberId, members, friendMembers, selectedUser]);
  const createChatMutation = useCreateDirectChat();
  const {
    sendFriendRequest: mutateSendFriendRequest,
    acceptFriendRequest: mutateAcceptFriendRequest,
    rejectFriendRequest: mutateRejectFriendRequest,
    deleteFriend: mutateDeleteFriend,
    status: friendshipActionStatus,
  } = useFriendshipActions();
  const { isSending, isAccepting, isRejecting, isDeleting } = friendshipActionStatus;
  const viewUserPosts = (user: MemberListItem) => {
    alert(`${user.nickname}님의 게시글 보기 기능은 추후 제공될 예정입니다.`);
  };

  const startGroupChat = (user: MemberListItem) => {
    alert(`${user.nickname}님과 그룹 챗 기능은 추후 제공될 예정입니다.`);
  };

  const selectedUserId = useMemo(() => {
    if (!selectedUser) {
      return null;
    }

    return normaliseNumericId((selectedUser as { id?: number | string }).id);
  }, [selectedUser]);

  const isFriendSelection = selectedSource === "friends";

  const selectedFriendMemberId = useMemo(() => {
    if (!isFriendSelection || !selectedUser) {
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
  }, [isFriendSelection, selectedUser]);

  const {
    data: selectedFriendDetail,
    isLoading: isFriendDetailLoading,
    isFetching: isFriendDetailFetching,
    error: selectedFriendDetailError,
  } = useFriendDetailQuery(selectedFriendMemberId ?? undefined);

  const {
    data: selectedProfile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    error: selectedProfileError,
  } = useMemberProfileQuery(selectedUserId ?? undefined);

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
        selectedFriendMemberId
      );
    }

    return selectedUserId ?? selectedFriendMemberId;
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

  const normaliseInterests = (value?: string[] | null) => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter((item) => item.length > 0);
  };

  const modalNickname = selectedFriendDetail?.nickname ?? selectedProfile?.nickname ?? selectedUser?.nickname ?? "";
  const modalName = selectedProfile?.name ?? selectedUser?.name ?? "";
  const modalCountry =
    selectedFriendDetail?.country ??
    selectedProfile?.countryName ??
    selectedProfile?.country ??
    selectedUser?.country ??
    "";
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
  const modalInterests = selectedFriendDetail
    ? normaliseInterests(selectedFriendDetail.interests)
    : selectedProfile
      ? normaliseInterests(selectedProfile.interests)
      : normaliseInterests(selectedUser?.interests);
  const modalDisplayName =
    (modalName ? `${modalNickname} (${modalName})` : modalNickname) ||
    selectedUser?.nickname ||
    "회원 정보";
  const modalCountryDisplay = modalCountry || "-";
  const modalEnglishLevelDisplay = modalEnglishLevel || "-";
  const modalDescriptionDisplay = modalDescription || "소개 정보가 아직 없습니다.";
  const modalAvatarSrc =
    selectedFriendDetail?.profileImageUrl && selectedFriendDetail.profileImageUrl.length > 0
      ? selectedFriendDetail.profileImageUrl
      : getAvatar(modalNickname || selectedUser?.nickname || "member");
  const resolveIsOnline = (user?: MemberListItem | null) => {
    if (!user) {
      return undefined;
    }

    return "isOnline" in user ? (user as MemberPresenceSummaryResp).isOnline : undefined;
  };

  const modalPresence = getPresenceMeta(resolveIsOnline(selectedUser));
  const isFriendDetailPending = isFriendSelection && (isFriendDetailLoading || isFriendDetailFetching);
  const friendDetailErrorMessage = isFriendSelection && selectedFriendDetailError ? selectedFriendDetailError.message : null;
  const friendSinceDisplay = isFriendSelection && selectedFriendDetail?.createdAt
    ? formatFriendSince(selectedFriendDetail.createdAt)
    : null;
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

  const renderMemberGrid = (list: MemberListItem[], source: "members" | "friends") => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((user) => {
        const presence = getPresenceMeta(resolveIsOnline(user));
        const interests = Array.isArray(user.interests) ? user.interests : [];
        const description = user.description ?? "소개 정보가 아직 없습니다.";

        return (
          <div
            key={user.id}
            className="bg-gray-800 border border-gray-600 rounded-lg p-6 hover:border-emerald-500 transition-all duration-300 cursor-pointer"
            onClick={() => {
              setSelectedSource(source);
              setSelectedUser(user);
            }}
          >
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16">
                <Image
                  src={getAvatar(user.nickname)}
                  alt={user.nickname || "사용자 아바타"}
                  width={64}
                  height={64}
                  unoptimized
                  className="rounded-full object-cover w-16 h-16"
                />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-gray-800 rounded-full ${presence.badgeClass}`}></div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">
                  {user.nickname}
                </h3>
                <p className={`${presence.textClass} text-sm flex items-center`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${presence.badgeClass}`}></span>
                  {presence.label}
                </p>
                <p className="text-gray-400 text-sm">{user.country}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
              {description}
            </p>

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">
                INTERESTS
              </p>
              <div className="flex flex-wrap gap-1">
                {interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={`${user.id}-interest-${index}`}
                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full"
                  >
                    {interest.trim()}
                  </span>
                ))}
                {interests.length === 0 && (
                  <span className="text-xs text-gray-400">등록된 관심사가 없습니다.</span>
                )}
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
        );
      })}
    </div>
  );

  const renderPeopleContent = () => {
    const totalPages = memberPage?.totalPages ?? null;
    const isFirstPage = memberPage?.isFirst ?? currentPage <= 1;
    const isLastPage = memberPage?.isLast ?? (typeof totalPages === "number" ? currentPage >= totalPages : members.length < DEFAULT_PAGE_SIZE);
    const canGoPrev = !isFirstPage && !isInitialLoading;
    const canGoNext = !isLastPage && !isInitialLoading;

    if (isInitialLoading) {
      return (
        <div className="text-center text-white">
          <p>{currentPage > 1 ? "다음 페이지를 불러오는 중입니다..." : "Loading..."}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400">
          <p>Error loading: {error.message}</p>
        </div>
      );
    }

    const renderOnlineFilter = (
      <div className="flex justify-end mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={showOnlineOnly}
            onChange={(event) => {
              setShowOnlineOnly(event.target.checked);
              setCurrentPage(1);
            }}
            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
          />
          온라인 멤버만 보기
        </label>
      </div>
    );

    if (!members || members.length === 0) {
      return (
        <>
          {renderOnlineFilter}
          <div className="text-center text-gray-400">
            <p>{showOnlineOnly ? "현재 온라인인 사용자가 없습니다." : "등록된 사용자를 찾을 수 없습니다."}</p>
          </div>
        </>
      );
    }

    return (
      <>
        {renderOnlineFilter}
        {renderMemberGrid(members, "members")}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={!canGoPrev}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:bg-gray-600/60 disabled:text-gray-400"
          >
            이전
          </button>
          <div className="text-sm text-gray-300">
            페이지 {displayedPageNumber}
            {typeof totalPages === "number" && totalPages > 0 ? ` / ${totalPages}` : ""}
            {isRefetching ? <span className="ml-2 text-xs text-gray-400">업데이트 중...</span> : null}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!canGoNext}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:bg-gray-600/60 disabled:text-gray-400"
          >
            다음
          </button>
        </div>
      </>
    );
  };

  const renderFriendsContent = () => {
    if (isFriendInitialLoading) {
      return (
        <div className="text-center text-white">
          <p>친구 목록을 불러오는 중입니다...</p>
        </div>
      );
    }

    if (friendError) {
      return (
        <div className="text-center text-red-400">
          <p>Error loading friends: {friendError.message}</p>
        </div>
      );
    }

    if (!friendMembers || friendMembers.length === 0) {
      return (
        <div className="text-center text-gray-400">
          <p>등록된 친구가 없습니다. 새로운 친구를 추가해 보세요.</p>
        </div>
      );
    }

    return (
      <>
        {renderMemberGrid(friendMembers, "friends")}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setFriendPage((prev) => Math.max(prev - 1, 1))}
            disabled={!canFriendGoPrev}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:bg-gray-600/60 disabled:text-gray-400"
          >
            이전
          </button>
          <div className="text-sm text-gray-300">
            페이지 {displayedFriendPageNumber}
            {isFriendRefetching ? <span className="ml-2 text-xs text-gray-400">업데이트 중...</span> : null}
          </div>
          <button
            type="button"
            onClick={() => setFriendPage((prev) => prev + 1)}
            disabled={!canFriendGoNext}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:bg-gray-600/60 disabled:text-gray-400"
          >
            다음
          </button>
        </div>
      </>
    );
  };

  const renderContent = () => {
    if (activeTab === "friends") {
      return renderFriendsContent();
    }

    if (activeTab === "group") {
      return <GroupRoomList />;
    }

    if (activeTab === "ai") {
      return (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-xl">Content for {activeTab} tab is coming soon!</p>
        </div>
      );
    }

    return renderPeopleContent();
  };

  const TabButton = ({
    tab,
    label,
    Icon,
  }: {
    tab: ActiveTab;
    label: string;
    Icon: React.ElementType;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab
        ? "bg-gray-800 text-emerald-400"
        : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
        }`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Find</h1>
          <p className="text-gray-300">
            Discover new people, groups, and AI to practice English with.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <TabButton tab="1v1" label="People" Icon={MessageSquare} />
              <TabButton tab="friends" label="Friends" Icon={UserRoundCheck} />
              <TabButton tab="group" label="Groups" Icon={Users} />
              <TabButton tab="ai" label="AI Tutors" Icon={Bot} />
            </div>
            {(activeTab === "group" || activeTab === "ai") && (
              <button
                onClick={handlePlusClick}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={22} />
              </button>
            )}
          </div>
        </div>

        {renderContent()}

        {/* User Profile Modal */}
        {selectedUser && (
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
                      <p className={`${modalPresence.textClass} flex items-center`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${modalPresence.badgeClass}`}></span>
                        {modalPresence.label}
                      </p>
                      <p className="text-gray-400">{modalCountryDisplay}</p>
                      <p className="text-gray-400 text-sm">{modalEnglishLevelDisplay}</p>
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
                    onClick={() => {
                      skipAutoSelectRef.current = true;
                      setSelectedUser(null);
                      setSelectedSource(null);
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

      <NewGroupChatModal
        isOpen={isGroupModalOpen} // Use renamed state
        onClose={() => setIsGroupModalOpen(false)} // Use renamed state
      />

      {/* New AI Situation Modals */}
      <AISituationModal
        isOpen={isAISituationModalOpen}
        onClose={closeAllAIModals}
        onSelectCategory={handleSelectAICategory}
      />

      <AIScenarioModal
        isOpen={isAIScenarioModalOpen}
        onClose={closeAllAIModals}
        onBack={handleBackToCategories}
        selectedCategory={selectedAICategory}
        onSelectScenario={handleSelectAIScenario}
      />
    </>
  );
}
