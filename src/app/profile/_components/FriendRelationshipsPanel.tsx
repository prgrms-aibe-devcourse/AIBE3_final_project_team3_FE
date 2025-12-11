"use client";

import { ChevronLeft, ChevronRight, Eye, Trash2, X } from "lucide-react";
import Image from "next/image";
import { MouseEvent, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useDeleteFriend } from "@/global/api/useFriendshipMutation";
import { useFriendDetailQuery } from "@/global/api/useMemberQuery";
import { useToastStore } from "@/global/stores/useToastStore";
import { MemberProfileUpdateReq } from "@/global/types/member.types";

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
type TranslateFn = (key: string, params?: Record<string, string>) => string;

const ENGLISH_LEVEL_LABEL_KEYS: Record<MemberProfileUpdateReq["englishLevel"], string> = {
  BEGINNER: "profile.info.englishLevels.BEGINNER",
  INTERMEDIATE: "profile.info.englishLevels.INTERMEDIATE",
  ADVANCED: "profile.info.englishLevels.ADVANCED",
  NATIVE: "profile.info.englishLevels.NATIVE",
};

const translateEnglishLevel = (level: string | null | undefined, t: TranslateFn) => {
  const normalized = level?.toString().toUpperCase() as MemberProfileUpdateReq["englishLevel"] | undefined;
  if (normalized && ENGLISH_LEVEL_LABEL_KEYS[normalized]) {
    return t(ENGLISH_LEVEL_LABEL_KEYS[normalized]);
  }
  return level || "-";
};

const resolveFriendLevel = (friend: FriendListItem, t: TranslateFn) => {
  return translateEnglishLevel(friend.englishLevel, t);
};

const resolveFriendInitial = (friend: FriendListItem, index: number) => {
  const source = resolveFriendName(friend, index);
  const letter = source.trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
};

const formatLastSeen = (timestamp?: string | null) => {
  if (!timestamp) {
    return "-";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export function FriendRelationshipsPanel() {
  const { friendsQuery, friendPage, friendPageSize, setFriendPage } = useProfileTabs();
  const { t } = useLanguage();
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
      addToast(t("profile.friends.messages.detailsUnavailable"), "error");
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
    const friendName = friend.nickname || friend.name || t("profile.friends.messages.unknownFriend");

    if (typeof friendId !== "number") {
      addToast(t("profile.friends.messages.idMissing"), "error");
      return;
    }

    if (!window.confirm(t("profile.friends.messages.confirmDelete", { name: friendName }))) {
      return;
    }

    setPendingDeleteId(friendId);
    deleteFriendMutation.mutate(
      { friendId, opponentMemberId: friendId, refreshMembers: true },
      {
        onSuccess: () => {
          addToast(t("profile.friends.messages.deleteSuccess"), "success");
          setPendingDeleteId(null);
          refetch();
        },
        onError: (mutationError) => {
          addToast(mutationError.message || t("profile.friends.messages.deleteFailed"), "error");
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
    <div className="theme-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--page-text)" }}>{t("profile.friends.title")}</h2>
          <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.subtitle")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.total", { count: String(totalCount ?? 0) })}</p>
          {isFetching && !isLoading ? <p className="text-xs text-[var(--surface-muted-text)]">{t("profile.friends.updating")}</p> : null}
        </div>
      </div>

      {isLoading ? (
        <p className="text-[var(--surface-muted-text)]">{t("profile.friends.loading")}</p>
      ) : error ? (
        <p className="text-red-400">
          {t("profile.friends.error")}
          {error.message ? `: ${error.message}` : ""}
        </p>
      ) : friends.length === 0 ? (
        <p className="text-[var(--surface-muted-text)]">{t("profile.friends.empty")}</p>
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
                  className="rounded-2xl border border-[var(--surface-border)] px-4 py-3 flex flex-col gap-3 bg-[var(--surface-panel)] hover:border-emerald-300 transition-colors cursor-pointer"
                  onClick={() => openFriendDetail(friendId)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {friend.profileImageUrl ? (
                        <Image
                          src={friend.profileImageUrl}
                          alt={t("profile.info.avatar.alt", {
                            name: resolveFriendName(friend, index),
                          })}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover border border-[var(--surface-border)]"
                          referrerPolicy="no-referrer"
                          unoptimized
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[var(--surface-panel-muted)] text-sm font-semibold flex items-center justify-center border border-[var(--surface-border)]" style={{ color: "var(--page-text)" }}>
                          {resolveFriendInitial(friend, index)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium" style={{ color: "var(--page-text)" }}>{resolveFriendName(friend, index)}</p>
                        <p className="text-xs" style={{ color: "var(--surface-muted-text)" }}>
                          {resolveFriendCountry(friend)} · {resolveFriendLevel(friend, t)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs ${friend.isOnline ? "text-emerald-500" : "text-[var(--surface-muted-text)]"}`}>
                      {friend.isOnline
                        ? t("profile.friends.status.online")
                        : t("profile.friends.status.offline")}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => handleDetailClick(event, friend)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--surface-border)] text-[var(--page-text)] hover:border-emerald-400 disabled:opacity-60"
                      disabled={typeof friendId !== "number"}
                    >
                      <Eye className="h-4 w-4" />
                      {t("profile.friends.buttons.details")}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => handleRemoveFriend(event, friend)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-red-400/70 text-red-500 hover:bg-red-500/10 disabled:opacity-60"
                      disabled={typeof friendId !== "number" || isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting
                        ? t("profile.friends.buttons.removing")
                        : t("profile.friends.buttons.remove")}
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
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--surface-border)] text-[var(--page-text)] disabled:opacity-60"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("profile.friends.buttons.previous")}
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
                        ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                        : "border-[var(--surface-border)] text-[var(--surface-muted-text)] hover:border-emerald-400"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="text-sm" style={{ color: "var(--surface-muted-text)" }}>
              {typeof totalPages === "number"
                ? t("profile.friends.pagination.pageWithTotal", {
                  current: String(currentPage),
                  total: String(Math.max(totalPages, 1)),
                })
                : t("profile.friends.pagination.page", { current: String(currentPage) })}
              <span className="ml-2 text-xs" style={{ color: "var(--surface-muted-text)" }}>
                {t("profile.friends.pagination.perPage", { count: String(friendPageSize) })}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!canGoNext}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--surface-border)] text-[var(--page-text)] disabled:opacity-60"
            >
              {t("profile.friends.buttons.next")}
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
  const { t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--surface-overlay)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg theme-card rounded-3xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--page-text)" }}>{t("profile.friends.modal.title")}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--surface-muted-text)] hover:text-emerald-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-[var(--surface-muted-text)]">{t("profile.friends.messages.detailLoading")}</p>
        ) : error ? (
          <p className="text-red-400">
            {t("profile.friends.messages.detailError")}
            {error.message ? `: ${error.message}` : ""}
          </p>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              {data.profileImageUrl ? (
                <Image
                  src={data.profileImageUrl}
                  alt={t("profile.info.avatar.alt", { name: data.nickname ?? "" })}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-emerald-400"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-[var(--surface-panel-muted)] text-2xl font-semibold flex items-center justify-center border border-[var(--surface-border)]" style={{ color: "var(--page-text)" }}>
                  {resolveFriendInitial(data, 0)}
                </div>
              )}
              <div>
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.modal.fields.nickname")}</p>
                <p className="text-xl font-semibold" style={{ color: "var(--page-text)" }}>{data.nickname || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.modal.fields.country")}</p>
                <p>{data.country || "-"}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.modal.fields.englishLevel")}</p>
                <p>{translateEnglishLevel(data.englishLevel, t)}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.modal.fields.lastSeen")}</p>
                <p>{formatLastSeen(data.lastSeenAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.modal.fields.description")}</p>
              <p className="whitespace-pre-line">
                {data.description?.trim()
                  ? data.description
                  : t("profile.friends.messages.descriptionEmpty")}
              </p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.modal.fields.interests")}</p>
              {data.interests && data.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.interests.map((interest: string, index: number) => (
                    <span
                      key={`${interest}-${index}`}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: "var(--surface-panel-muted)",
                        color: "var(--page-text)",
                        border: "1px solid var(--surface-border)",
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.friends.messages.interestsEmpty")}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[var(--surface-muted-text)]">{t("profile.friends.messages.detailEmpty")}</p>
        )}
      </div>
    </div>
  );
}
