"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateDirectChat } from "@/global/api/useChatQuery";
import { useFriendDetailQuery, useMemberProfileQuery } from "@/global/api/useMemberQuery";
import { useFriendshipActions } from "@/global/hooks/useFriendshipActions";
import { getCountryFlagEmoji, normaliseCountryValue } from "@/global/lib/countries";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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

export function FindProfileProvider({ children }: { children: React.ReactNode }) {
  const { t, language } = useLanguage();
  const [selectedUser, setSelectedUser] = useState<MemberListItem | null>(null);
  const [selectedSource, setSelectedSource] = useState<MemberSource | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const skipAutoSelectRef = useRef<number | null>(null);

  const fallbackMemberName = t('find.profile.labels.member');
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';

  const viewUserPosts = (user: MemberListItem | null) => {
    if (!user) {
      return;
    }
    const nickname = user.nickname ?? fallbackMemberName;
    alert(t('find.profile.alerts.viewPosts', { nickname }));
  };

  const startGroupChatInvite = (user: MemberListItem | null) => {
    if (!user) {
      return;
    }
    const nickname = user.nickname ?? fallbackMemberName;
    alert(t('find.profile.alerts.inviteGroup', { nickname }));
  };

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
    const nickname = user.nickname ?? fallbackMemberName;
    if (window.confirm(t('find.profile.alerts.chatConfirm', { nickname }))) {
      createChatMutation.mutate({ partnerId: user.id });
    }
  };

  const handleSendFriendRequest = async () => {
    if (selectedProfileMemberId == null) {
      alert(t('find.profile.alerts.sendRequestMissingTarget'));
      return;
    }

    try {
      await mutateSendFriendRequest({ receiverId: selectedProfileMemberId });
      alert(t('find.profile.alerts.sendRequestSuccess'));
    } catch (error) {
      const fallback = t('find.profile.alerts.sendRequestError');
      const errorMessage = error instanceof Error && error.message ? `: ${error.message}` : "";
      alert(`${fallback}${errorMessage}`);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (opponentPendingRequestId == null) {
      alert(t('find.profile.alerts.acceptMissingRequest'));
      return;
    }

    try {
      await mutateAcceptFriendRequest({
        requestId: opponentPendingRequestId,
        opponentMemberId: selectedProfileMemberId ?? undefined,
      });
      alert(t('find.profile.alerts.acceptSuccess'));
    } catch (error) {
      const fallback = t('find.profile.alerts.acceptError');
      const errorMessage = error instanceof Error && error.message ? `: ${error.message}` : "";
      alert(`${fallback}${errorMessage}`);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (opponentPendingRequestId == null) {
      alert(t('find.profile.alerts.rejectMissingRequest'));
      return;
    }

    try {
      await mutateRejectFriendRequest({
        requestId: opponentPendingRequestId,
        opponentMemberId: selectedProfileMemberId ?? undefined,
      });
      alert(t('find.profile.alerts.rejectSuccess'));
    } catch (error) {
      const fallback = t('find.profile.alerts.rejectError');
      const errorMessage = error instanceof Error && error.message ? `: ${error.message}` : "";
      alert(`${fallback}${errorMessage}`);
    }
  };

  const handleRemoveFriend = async () => {
    const friendId = friendshipRelationId ?? selectedProfileMemberId;
    if (friendId == null) {
      alert(t('find.profile.alerts.removeMissingFriend'));
      return;
    }

    const targetName = selectedProfile?.nickname || selectedUser?.nickname || fallbackMemberName;
    const confirmed = window.confirm(t('find.profile.alerts.removeConfirm', { nickname: targetName }));
    if (!confirmed) {
      return;
    }

    try {
      await mutateDeleteFriend({
        friendId,
        opponentMemberId: selectedProfileMemberId ?? undefined,
      });
      alert(t('find.profile.alerts.removeSuccess'));
    } catch (error) {
      const fallback = t('find.profile.alerts.removeError');
      const errorMessage = error instanceof Error && error.message ? `: ${error.message}` : "";
      alert(`${fallback}${errorMessage}`);
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
  const modalEnglishLevelDisplay = t(englishLevelMeta.labelKey);
  const modalEnglishLevelStyle = englishLevelMeta.badgeStyle;

  const modalInterests = selectedFriendDetail
    ? normaliseInterests(selectedFriendDetail.interests)
    : selectedProfile
      ? normaliseInterests(selectedProfile.interests)
      : normaliseInterests(selectedUser?.interests);
  const modalDisplayName =
    (modalName ? `${modalNickname} (${modalName})` : modalNickname) ||
    selectedUser?.nickname ||
    t('find.profile.labels.memberInfo');
  const modalDescriptionDisplay = modalDescription || t('find.profile.sections.noDescription');
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
    ? formatLastSeen(modalLastSeenSource, locale)
    : null;
  const isFriendDetailPending =
    selectedSource === "friends" && (isFriendDetailLoading || isFriendDetailFetching);
  const friendDetailErrorMessage =
    selectedSource === "friends" && selectedFriendDetailError
      ? selectedFriendDetailError.message
      : null;
  const friendSinceDisplay =
    selectedSource === "friends" && selectedFriendDetail?.createdAt
      ? formatFriendSince(selectedFriendDetail.createdAt, locale)
      : null;

  const isProfilePending = Boolean(selectedUser) && (isProfileLoading || isProfileFetching);

  const renderFriendshipStatus = () => {
    if (!selectedUser) {
      return null;
    }

    if (isProfilePending) {
      return <span className="text-xs" style={{ color: "var(--surface-muted-text)" }}>{t('find.profile.friendship.loading')}</span>;
    }

    if (selectedProfileError) {
      return (
        <span className="text-xs text-red-400">
          {t('find.profile.friendship.error')}
          {selectedProfileError.message ? ` (${selectedProfileError.message})` : ""}
        </span>
      );
    }

    if (!modalFriendshipState) {
      return <span className="text-xs" style={{ color: "var(--surface-muted-text)" }}>{t('find.profile.friendship.unavailable')}</span>;
    }

    return (
      <>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${FRIENDSHIP_BADGE_STYLE[modalFriendshipState]}`}>
          {t(FRIENDSHIP_STATUS_LABELS[modalFriendshipState])}
        </span>
        <span className="text-xs" style={{ color: "var(--surface-muted-text)" }}>{t(FRIENDSHIP_STATUS_DESCRIPTIONS[modalFriendshipState])}</span>
      </>
    );
  };

  const renderFriendshipActions = () => {
    if (!selectedUser || isProfilePending || selectedProfileError || !modalFriendshipState) {
      return null;
    }

    if (modalFriendshipState === "REQUEST_SENT") {
      return (
        <p
          className="text-sm text-center rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-3"
          style={{ color: "var(--surface-muted-text)" }}
        >
          {t('find.profile.friendship.pending', {
            requestId: myPendingRequestId ? ` (#${myPendingRequestId})` : '',
          })}
        </p>
      );
    }

    if (modalFriendshipState === "REQUEST_RECEIVED") {
      if (!opponentPendingRequestId) {
        return (
          <p className="text-sm text-center rounded-2xl border border-red-500/40 px-4 py-3 text-red-400">
            {t('find.profile.friendship.missingRequestInfo')}
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
            className="w-full rounded-2xl bg-emerald-500 text-white px-4 py-3 font-semibold shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAccepting ? t('find.profile.buttons.accepting') : t('find.profile.buttons.accept')}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleRejectFriendRequest();
            }}
            disabled={isProcessing}
            className="w-full rounded-2xl border border-red-500/50 px-4 py-3 font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isRejecting ? t('find.profile.buttons.rejecting') : t('find.profile.buttons.reject')}
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
          className="w-full rounded-2xl border border-red-500/50 px-4 py-3 font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isDeleting ? t('find.profile.buttons.removing') : t('find.profile.buttons.remove')}
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
          className="w-full rounded-2xl bg-emerald-500 text-white px-4 py-3 font-semibold shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSending ? t('find.profile.buttons.sending') : t('find.profile.buttons.send')}
        </button>
      );
    }

    return null;
  };

  return (
    <FindProfileContext.Provider value={{ openProfile, closeProfile }}>
      {children}
      {selectedUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "var(--surface-overlay)" }}
        >
          <div className="theme-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20">
                    <Image
                      src={modalAvatarSrc}
                      alt={modalDisplayName || selectedUser.nickname || t('find.profile.labels.avatarAlt')}
                      width={80}
                      height={80}
                      unoptimized
                      className="rounded-full object-cover w-20 h-20 border border-[var(--surface-border)]"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 rounded-full ${modalPresence.badgeClass}`}
                      style={{ borderColor: "var(--surface-panel)" }}
                    ></div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold" style={{ color: "var(--page-text)" }}>{modalDisplayName}</h2>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--surface-muted-text)" }}>
                      {modalCountryFlag ? (
                        <span className="text-xl" aria-hidden>
                          {modalCountryFlag}
                        </span>
                      ) : null}
                      <span>{modalCountryDisplay}</span>
                    </div>
                    {modalLastSeenDisplay && (
                      <p className="text-xs" style={{ color: "var(--surface-muted-text)" }}>
                        {t('find.profile.details.lastSeen', { time: modalLastSeenDisplay })}
                      </p>
                    )}
                    <div
                      className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border"
                      style={{
                        backgroundColor: modalEnglishLevelStyle.backgroundColor,
                        borderColor: modalEnglishLevelStyle.borderColor,
                        color: modalEnglishLevelStyle.color ?? "var(--page-text)",
                      }}
                    >
                      <span>{modalEnglishLevelDisplay}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {renderFriendshipStatus()}
                    </div>
                    {friendSinceDisplay && (
                      <p className="text-xs" style={{ color: "var(--surface-muted-text)" }}>
                        {t('find.profile.details.friendSince', { date: friendSinceDisplay })}
                      </p>
                    )}
                    {isFriendDetailPending && (
                      <p className="text-xs" style={{ color: "var(--surface-muted-text)" }}>
                        {t('find.profile.details.loadingFriendDetail')}
                      </p>
                    )}
                    {friendDetailErrorMessage && (
                      <p className="text-xs text-red-400">
                        {t('find.profile.details.friendDetailError')}
                        {friendDetailErrorMessage ? ` (${friendDetailErrorMessage})` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeProfile}
                  className="text-2xl text-[var(--surface-muted-text)] hover:text-emerald-400"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--page-text)" }}>{t('find.profile.sections.about')}</h3>
                  <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{modalDescriptionDisplay}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--page-text)" }}>{t('find.profile.sections.interests')}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {modalInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "var(--page-text)" }}
                      >
                        {interest}
                      </span>
                    ))}
                    {modalInterests.length === 0 && (
                      <span className="text-sm" style={{ color: "var(--surface-muted-text)" }}>
                        {t('find.profile.sections.noInterests')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => startChat(selectedUser)}
                  className="w-full rounded-2xl bg-emerald-500 text-white px-4 py-3 font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
                >
                  {t('find.profile.buttons.chat')}
                </button>
                <button
                  type="button"
                  onClick={() => startGroupChatInvite(selectedUser)}
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-3 font-semibold text-[var(--page-text)] hover:border-emerald-400 transition-colors"
                >
                  {t('find.profile.buttons.invite')}
                </button>
                {renderFriendshipActions()}
                <button
                  type="button"
                  onClick={() => viewUserPosts(selectedUser)}
                  className="w-full rounded-2xl border border-[var(--surface-border)] px-4 py-3 font-semibold text-[var(--page-text)] hover:border-emerald-300 transition-colors"
                >
                  {t('find.profile.buttons.posts')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </FindProfileContext.Provider>
  );
}
