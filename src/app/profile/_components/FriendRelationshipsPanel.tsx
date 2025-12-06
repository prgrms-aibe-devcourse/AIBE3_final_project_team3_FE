"use client";

import { ChevronLeft, ChevronRight, Eye, Trash2, X } from "lucide-react";
import { MouseEvent, useState } from "react";

import { useDeleteFriend } from "@/global/api/useFriendshipMutation";
import { useFriendDetailQuery } from "@/global/api/useMemberQuery";
import { useToastStore } from "@/global/stores/useToastStore";

import { useProfileTabs } from "./ProfileTabsProvider";

type FriendListItem = {
  memberId?: number | string | null;
  id?: number | string | null;
  nickname?: string | null;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  countryName?: string | null;
  englishLevel?: string | null;
  isOnline?: boolean | null;
  profileImageUrl?: string | null;
} & Record<string, unknown>;

const resolveFriendId = (friend: FriendListItem): number | undefined => {
  const candidates = [friend.memberId, friend.id];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string" && candidate.trim()) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const resolveFriendName = (friend: FriendListItem, index: number) => {
  return (
    friend.nickname ||
    friend.name ||
    friend.email ||
    (typeof friend.memberId === "number" ? `member-${friend.memberId}` : `friend-${index}`)
  );
};

const resolveFriendCountry = (friend: FriendListItem) => {
  return friend.countryName || friend.country || "-";
};

const resolveFriendLevel = (friend: FriendListItem) => {
  return friend.englishLevel || "-";
};

export function FriendRelationshipsPanel() {
  const { friendsQuery, friendPage, friendPageSize, setFriendPage } = useProfileTabs();
  const { data, isLoading, isFetching, error, refetch } = friendsQuery;
  const friends = (data?.items ?? []) as FriendListItem[];
  const deleteFriendMutation = useDeleteFriend();
  const { addToast } = useToastStore();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [detailFriendId, setDetailFriendId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const totalCount = data?.totalElements ?? friends.length;
  const resolvedPageIndex = typeof data?.pageIndex === "number" ? data.pageIndex : friendPage;
  const currentPage = resolvedPageIndex + 1;
  const totalPages = data?.totalPages ?? null;
  const derivedTotalPages = typeof totalPages === "number" && totalPages > 0 ? totalPages : Math.max(Math.ceil(totalCount / friendPageSize), 1);
  const canGoPrev = data ? !data.isFirst : friendPage > 0;
  const canGoNext = data ? !data.isLast : false;
  const maxPageLinks = 5;
  const pageNumbers = Array.from({ length: Math.min(derivedTotalPages, maxPageLinks) }, (_, index) => {
    if (derivedTotalPages <= maxPageLinks) {
      return index + 1;
    }

    const offset = Math.floor(maxPageLinks / 2);
    let start = currentPage - offset;
    let end = currentPage + offset;

    if (maxPageLinks % 2 === 0) {
      end -= 1;
    }

    if (start < 1) {
      end += 1 - start;
      start = 1;
    }

    if (end > derivedTotalPages) {
      start -= end - derivedTotalPages;
      end = derivedTotalPages;
    }

    return start + index;
  });

  const openFriendDetail = (friendId?: number) => {
    if (typeof friendId !== "number") {
      addToast("친구 정보를 불러올 수 없습니다.", "error");
      return;
    }

    setDetailFriendId(friendId);
    setIsDetailOpen(true);
  };

  const closeFriendDetail = () => {
    setIsDetailOpen(false);
    setDetailFriendId(null);
  };

  const handleRemoveFriend = (event: MouseEvent<HTMLButtonElement>, friend: FriendListItem) => {
    event.stopPropagation();

    const friendId = resolveFriendId(friend);
    const friendName = friend.nickname || friend.name || "이 친구";

    if (typeof friendId !== "number") {
      addToast("친구 ID를 확인할 수 없어 삭제할 수 없습니다.", "error");
      return;
    }

    if (!window.confirm(`${friendName}님과의 친구 관계를 삭제할까요?`)) {
      return;
    }

    setPendingDeleteId(friendId);
    deleteFriendMutation.mutate(
      { friendId, opponentMemberId: friendId, refreshMembers: true },
      {
        onSuccess: () => {
          addToast("친구를 삭제했습니다.", "success");
          setPendingDeleteId(null);
          refetch();
        },
        onError: (mutationError) => {
          addToast(mutationError.message || "친구를 삭제하지 못했습니다.", "error");
          setPendingDeleteId(null);
        },
      },
    );
  };

  const handleDetailClick = (event: MouseEvent<HTMLButtonElement>, friend: FriendListItem) => {
    event.stopPropagation();
    openFriendDetail(resolveFriendId(friend));
  };

  const handlePrevPage = () => {
    if (canGoPrev) {
      setFriendPage(Math.max(friendPage - 1, 0));
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      setFriendPage(friendPage + 1);
    }
  };

  const handlePageSelect = (pageNumber: number) => {
    const targetIndex = pageNumber - 1;
    if (targetIndex >= 0 && targetIndex !== friendPage && targetIndex < derivedTotalPages) {
      setFriendPage(targetIndex);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Friend Relationships</h2>
          <p className="text-sm text-gray-400">친구 API를 provider에서 선로드해 탭 전환에 즉시 활용해요.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">총 {totalCount ?? 0}명</p>
          {isFetching && !isLoading ? <p className="text-xs text-gray-500">업데이트 중...</p> : null}
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-300">친구 목록을 불러오는 중입니다...</p>
      ) : error ? (
        <p className="text-red-400">친구 목록을 불러오지 못했습니다: {error.message}</p>
      ) : friends.length === 0 ? (
        <p className="text-gray-400">등록된 친구가 없습니다.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {friends.map((friend, index) => {
              const friendId = resolveFriendId(friend);
              const key = friendId ?? `${friend.nickname ?? "friend"}-${index}`;
              const isDeleting =
                typeof friendId === "number" && pendingDeleteId === friendId && deleteFriendMutation.isPending;

              return (
                <li
                  key={key}
                  className="rounded-lg border border-gray-700 px-4 py-3 flex flex-col gap-3 hover:border-emerald-500/60 transition-colors cursor-pointer"
                  onClick={() => openFriendDetail(friendId)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-medium">{resolveFriendName(friend, index)}</p>
                      <p className="text-xs text-gray-400">
                        {resolveFriendCountry(friend)} · {resolveFriendLevel(friend)}
                      </p>
                    </div>
                    <span className={`text-xs ${friend.isOnline ? "text-emerald-400" : "text-gray-400"}`}>
                      {friend.isOnline ? "온라인" : "오프라인"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => handleDetailClick(event, friend)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-600 text-gray-200 hover:border-emerald-400 disabled:opacity-60"
                      disabled={typeof friendId !== "number"}
                    >
                      <Eye className="h-4 w-4" />
                      상세보기
                    </button>
                    <button
                      type="button"
                      onClick={(event) => handleRemoveFriend(event, friend)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                      disabled={typeof friendId !== "number" || isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "삭제 중" : "친구 삭제"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between mt-6 gap-4">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!canGoPrev}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-200 disabled:opacity-60"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>
            {pageNumbers.length > 0 ? (
              <div className="flex items-center gap-2">
                {pageNumbers.map((pageNumber) => {
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePageSelect(pageNumber)}
                      className={`min-w-[2.5rem] px-3 py-1.5 rounded-lg border text-sm transition-colors ${isActive
                          ? "border-emerald-500 text-white bg-emerald-500/10"
                          : "border-gray-600 text-gray-300 hover:border-emerald-400"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="text-sm text-gray-300">
              페이지 {currentPage}
              {typeof totalPages === "number" ? ` / ${Math.max(totalPages, 1)}` : ""}
              <span className="ml-2 text-xs text-gray-500">(페이지당 {friendPageSize}명)</span>
            </div>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!canGoNext}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-200 disabled:opacity-60"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      <FriendDetailModal friendId={detailFriendId ?? undefined} isOpen={isDetailOpen} onClose={closeFriendDetail} />
    </div>
  );
}

interface FriendDetailModalProps {
  friendId?: number;
  isOpen: boolean;
  onClose: () => void;
}

function FriendDetailModal({ friendId, isOpen, onClose }: FriendDetailModalProps) {
  const { data, isLoading, error } = useFriendDetailQuery(friendId);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">친구 상세 정보</h3>
            <p className="text-sm text-gray-400">모달에서 즉시 상세 API 응답을 확인할 수 있어요.</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-300">상세 정보를 불러오는 중입니다...</p>
        ) : error ? (
          <p className="text-red-400">상세 정보를 불러오지 못했습니다: {error.message}</p>
        ) : data ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">닉네임</p>
              <p className="text-lg text-white font-semibold">{data.nickname || "-"}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">국가</p>
                <p className="text-gray-200">{data.country || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">영어 레벨</p>
                <p className="text-gray-200">{data.englishLevel || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">최근 온라인</p>
                <p className="text-gray-200">{data.lastSeenAt ?? "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">소개</p>
              <p className="text-gray-200 whitespace-pre-line">
                {data.description?.trim() ? data.description : "소개가 아직 등록되지 않았습니다."}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">관심사</p>
              {data.interests && data.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.interests.map((interest, index) => (
                    <span key={`${interest}-${index}`} className="px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-200 text-xs">
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">등록된 관심사가 없습니다.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-300">표시할 친구 정보를 찾지 못했습니다.</p>
        )}
      </div>
    </div>
  );
}
