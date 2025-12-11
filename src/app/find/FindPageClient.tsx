"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateAiChat } from "@/global/api/useChatQuery";
import { useFriendsQuery, useMembersQuery } from "@/global/api/useMemberQuery";
import { usePromptListQuery } from "@/global/api/usePromptQuery";
import { AiChatRoomType } from "@/global/types/chat.types";
import { Bot, MessageSquare, Plus, UserRoundCheck, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import MemberGrid from "./_components/MemberGrid";
import { MemberListItem, MemberSource } from "./_lib/memberUtils";
import AICreateRoomModal from "./components/AICreateRoomModal";
import AIRoomTypeModal from "./components/AIRoomTypeModal";
import AIScenarioModal from "./components/AIScenarioModal";
import AISituationModal from "./components/AISituationModal";
import GroupRoomList from "./components/GroupRoomList";
import NewGroupChatModal from "./components/NewGroupChatModal";
import { AI_ROOM_TYPE_OPTIONS, formatAiRoomTypeLabel } from "./constants/aiRoomTypes";
import { AICategory, AIScenario, buildCategoriesFromPromptList } from "./constants/aiSituations";

type ActiveTab = "1v1" | "friends" | "group" | "ai";
const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_LINKS = 5;

const buildPageNumbers = (currentPage: number, totalPages?: number | null, maxLinks = MAX_PAGE_LINKS) => {
  if (typeof totalPages !== "number" || totalPages <= 0) {
    return [];
  }

  if (totalPages <= maxLinks) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const offset = Math.floor(maxLinks / 2);
  let start = currentPage - offset;
  let end = currentPage + offset;

  if (maxLinks % 2 === 0) {
    end -= 1;
  }

  if (start < 1) {
    end += 1 - start;
    start = 1;
  }

  if (end > totalPages) {
    start -= end - totalPages;
    end = totalPages;
  }

  return Array.from({ length: maxLinks }, (_, index) => start + index);
};

function FindPageContent() {
  const { t } = useLanguage();
  const secondaryButtonClass =
    "px-4 py-2 rounded border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] text-[var(--page-text)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[var(--surface-panel)]";
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
  const memberTotalPages = memberPage?.totalPages ?? null;
  const derivedMemberTotalPages = (() => {
    if (typeof memberTotalPages === "number" && memberTotalPages > 0) {
      return memberTotalPages;
    }
    if (typeof memberPage?.totalElements === "number") {
      return Math.max(Math.ceil(memberPage.totalElements / DEFAULT_PAGE_SIZE), 1);
    }
    return null;
  })();
  const memberPageNumbers = buildPageNumbers(currentPage, derivedMemberTotalPages);

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
  const friendTotalPages = friendPageData?.totalPages ?? null;
  const derivedFriendTotalPages = (() => {
    if (typeof friendTotalPages === "number" && friendTotalPages > 0) {
      return friendTotalPages;
    }
    if (typeof friendPageData?.totalElements === "number") {
      return Math.max(Math.ceil(friendPageData.totalElements / friendPageSize), 1);
    }
    return null;
  })();
  const friendPageNumbers = buildPageNumbers(friendPage, derivedFriendTotalPages);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("1v1");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isAIRoomTypeModalOpen, setIsAIRoomTypeModalOpen] = useState(false);
  const [isAISituationModalOpen, setIsAISituationModalOpen] = useState(false);
  const [isAIScenarioModalOpen, setIsAIScenarioModalOpen] = useState(false);
  const [isAICreateModalOpen, setIsAICreateModalOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<AiChatRoomType | null>(null);
  const [selectedAICategory, setSelectedAICategory] = useState<AICategory | null>(null);
  const [selectedAIScenario, setSelectedAIScenario] = useState<AIScenario | null>(null);

  const {
    data: promptList,
    isLoading: isPromptLoading,
    error: promptError,
    refetch: refetchPromptList,
  } = usePromptListQuery();
  const aiCategories = useMemo(
    () => buildCategoriesFromPromptList(promptList, t),
    [promptList, t],
  );
  const localizedRoomTypeLabel = formatAiRoomTypeLabel(selectedRoomType, t);
  const aiPromptModalTitle = selectedRoomType
    ? t('find.ai.promptModalTitle', { roomType: localizedRoomTypeLabel })
    : undefined;

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "group" || tab === "ai" || tab === "friends") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const openAiCreationFlow = () => {
    setSelectedRoomType(null);
    setSelectedAICategory(null);
    setSelectedAIScenario(null);
    setIsAISituationModalOpen(false);
    setIsAIScenarioModalOpen(false);
    setIsAICreateModalOpen(false);
    setIsAIRoomTypeModalOpen(true);
  };

  const handlePlusClick = () => {
    if (activeTab === "group") {
      setIsGroupModalOpen(true);
    } else if (activeTab === "ai") {
      openAiCreationFlow();
    }
  };

  const handleSelectMemberPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage === currentPage) {
      return;
    }

    if (typeof derivedMemberTotalPages === "number" && targetPage > derivedMemberTotalPages) {
      return;
    }

    setCurrentPage(targetPage);
  };

  const handleSelectFriendPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage === friendPage) {
      return;
    }

    if (typeof derivedFriendTotalPages === "number" && targetPage > derivedFriendTotalPages) {
      return;
    }

    setFriendPage(targetPage);
  };

  const handleSelectAIRoomType = (roomType: AiChatRoomType) => {
    setSelectedRoomType(roomType);
    setSelectedAICategory(null);
    setSelectedAIScenario(null);
    setIsAIRoomTypeModalOpen(false);
    setIsAISituationModalOpen(true);
  };

  const handleSelectAICategory = (category: AICategory) => {
    setSelectedAICategory(category);
    setIsAISituationModalOpen(false);
    setIsAIScenarioModalOpen(true);
  };

  const handleBackToCategories = () => {
    setIsAIScenarioModalOpen(false);
    setIsAISituationModalOpen(true);
    setSelectedAICategory(null);
    setSelectedAIScenario(null);
    setIsAICreateModalOpen(false);
  };

  const handleSelectAIScenario = (scenario: AIScenario) => {
    if (!selectedRoomType) {
      alert(t('find.ai.alerts.selectRoomType'));
      return;
    }
    setSelectedAIScenario(scenario);
    setIsAIScenarioModalOpen(false);
    setIsAICreateModalOpen(true);
  };

  const closeAllAIModals = () => {
    setIsAIRoomTypeModalOpen(false);
    setIsAISituationModalOpen(false);
    setIsAIScenarioModalOpen(false);
    setIsAICreateModalOpen(false);
    setSelectedRoomType(null);
    setSelectedAICategory(null);
    setSelectedAIScenario(null);
  };

  const handleCreateAiRoom = (roomName: string) => {
    if (!selectedRoomType || !selectedAIScenario) {
      alert(t('find.ai.alerts.missingSelection'));
      return;
    }

    const personaId = Number(selectedAIScenario.id);
    if (!Number.isFinite(personaId)) {
      alert(t('find.ai.alerts.invalidPrompt'));
      return;
    }

    createAiChatMutation.mutate(
      { roomName, personaId, roomType: selectedRoomType },
      {
        onSuccess: () => {
          closeAllAIModals();
        },
      },
    );
  };

  const createAiChatMutation = useCreateAiChat();

  const renderMemberGrid = (list: MemberListItem[], source: MemberSource) => (
    <MemberGrid members={list} source={source} />
  );

  const renderPeopleContent = () => {
    const totalPages = derivedMemberTotalPages;
    const isFirstPage = memberPage?.isFirst ?? currentPage <= 1;
    const isLastPage =
      memberPage?.isLast ?? (typeof totalPages === "number" ? currentPage >= totalPages : members.length < DEFAULT_PAGE_SIZE);
    const canGoPrev = !isFirstPage && !isInitialLoading;
    const canGoNext = !isLastPage && !isInitialLoading;

    if (isInitialLoading) {
      return (
        <div className="text-center text-white">
          <p>{currentPage > 1 ? t('find.people.loadingNext') : t('find.people.loadingInitial')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400">
          <p>
            {t('find.people.error')}
            {error.message ? `: ${error.message}` : ""}
          </p>
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
            className="h-4 w-4 rounded border-[var(--surface-border)] bg-[var(--surface-field)] text-emerald-500 focus:ring-emerald-500"
          />
          {t('find.filters.onlineOnly')}
        </label>
      </div>
    );

    if (!members || members.length === 0) {
      return (
        <>
          {renderOnlineFilter}
          <div className="text-center text-gray-400">
            <p>{showOnlineOnly ? t('find.people.emptyOnline') : t('find.people.empty')}</p>
          </div>
        </>
      );
    }

    const displayedPageText = String(displayedPageNumber);
    const totalPageText = typeof totalPages === "number" && totalPages > 0 ? String(totalPages) : null;
    const pageLabel = totalPageText
      ? t('find.pagination.pageWithTotal', { current: displayedPageText, total: totalPageText })
      : t('find.pagination.page', { current: displayedPageText });

    return (
      <>
        {renderOnlineFilter}
        {renderMemberGrid(members, "members")}
        <div className="flex flex-wrap items-center justify-between mt-6 gap-4">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={!canGoPrev}
            className={secondaryButtonClass}
          >
            {t('find.pagination.previous')}
          </button>
          {memberPageNumbers.length > 0 ? (
            <div className="flex items-center gap-2">
              {memberPageNumbers.map((pageNumber) => {
                const isActive = pageNumber === currentPage;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handleSelectMemberPage(pageNumber)}
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
            {pageLabel}
            {isRefetching ? <span className="ml-2 text-xs text-gray-400">{t('find.pagination.updating')}</span> : null}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!canGoNext}
            className={secondaryButtonClass}
          >
            {t('find.pagination.next')}
          </button>
        </div>
      </>
    );
  };

  const renderFriendsContent = () => {
    if (isFriendInitialLoading) {
      return (
        <div className="text-center text-white">
          <p>{t('find.friends.loading')}</p>
        </div>
      );
    }

    if (friendError) {
      return (
        <div className="text-center text-red-400">
          <p>
            {t('find.friends.error')}
            {friendError.message ? `: ${friendError.message}` : ""}
          </p>
        </div>
      );
    }

    if (!friendMembers || friendMembers.length === 0) {
      return (
        <div className="text-center text-gray-400">
          <p>{t('find.friends.empty')}</p>
        </div>
      );
    }

    return (
      <>
        {renderMemberGrid(friendMembers, "friends")}
        <div className="flex flex-wrap items-center justify-between mt-6 gap-4">
          <button
            type="button"
            onClick={() => setFriendPage((prev) => Math.max(prev - 1, 1))}
            disabled={!canFriendGoPrev}
            className={secondaryButtonClass}
          >
            {t('find.pagination.previous')}
          </button>
          {friendPageNumbers.length > 0 ? (
            <div className="flex items-center gap-2">
              {friendPageNumbers.map((pageNumber) => {
                const isActive = pageNumber === friendPage;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handleSelectFriendPage(pageNumber)}
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
            {(() => {
              const currentText = String(displayedFriendPageNumber);
              const totalText =
                typeof derivedFriendTotalPages === "number" && derivedFriendTotalPages > 0
                  ? String(derivedFriendTotalPages)
                  : null;
              return totalText
                ? t('find.pagination.pageWithTotal', { current: currentText, total: totalText })
                : t('find.pagination.page', { current: currentText });
            })()}
            {isFriendRefetching ? <span className="ml-2 text-xs text-gray-400">{t('find.pagination.updating')}</span> : null}
          </div>
          <button
            type="button"
            onClick={() => setFriendPage((prev) => prev + 1)}
            disabled={!canFriendGoNext}
            className={secondaryButtonClass}
          >
            {t('find.pagination.next')}
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
        <div className="space-y-10">
          <div
            className="rounded-2xl p-8 flex flex-col gap-4"
            style={{
              background: "linear-gradient(135deg, var(--surface-panel), rgba(16,185,129,0.12) 60%, var(--surface-panel))",
              border: "1px solid rgba(16,185,129,0.35)",
            }}
          >
            <div>
              <p className="text-emerald-300 text-sm font-semibold uppercase tracking-[0.2em]">{t('find.ai.tag')}</p>
              <h2 className="text-3xl font-bold text-white mt-2">{t('find.ai.title')}</h2>
              <p className="text-gray-300 mt-3 max-w-3xl">{t('find.ai.description')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openAiCreationFlow}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors"
              >
                {t('find.ai.createButton')}
              </button>
              <button
                type="button"
                onClick={() => router.push("/learning-notes")}
                className="px-6 py-3 rounded-xl border border-[var(--surface-border)] font-semibold text-[var(--page-text)] hover:bg-[var(--surface-panel)] transition-colors"
              >
                {t('find.ai.notesButton')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AI_ROOM_TYPE_OPTIONS.map((option) => (
              <div key={option.type} className="theme-surface rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-white">{t(option.titleKey)}</h3>
                  {option.badgeKey ? (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-600 text-white">{t(option.badgeKey)}</span>
                  ) : null}
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{t(option.descriptionKey)}</p>
                <p className="text-gray-400 text-xs leading-relaxed flex-1">{t(option.detailsKey)}</p>
                <button
                  type="button"
                  onClick={() => handleSelectAIRoomType(option.type)}
                  className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--surface-panel-muted)] text-[var(--page-text)] font-medium transition-colors hover:bg-emerald-500 hover:text-white"
                >
                  {t('find.ai.promptButton')}
                </button>
              </div>
            ))}
          </div>

          <div className="theme-surface rounded-2xl p-6">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white/80 mr-1">{t('find.ai.tip.prefix')}</span>
              {t('find.ai.tip.body', {
                rolePlay: t('find.aiRoomTypes.ROLE_PLAY.title'),
                personal: t('find.aiRoomTypes.TUTOR_PERSONAL.title'),
                similar: t('find.aiRoomTypes.TUTOR_SIMILAR.title'),
              })}
            </p>
          </div>
        </div>
      );
    }

    return renderPeopleContent();
  };

  const TabButton = ({ tab, label, Icon }: { tab: ActiveTab; label: string; Icon: React.ElementType }) => {
    const isActive = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl border font-medium transition-all shadow-sm ${isActive
          ? "bg-[var(--card-surface)] text-emerald-500 border-emerald-300 shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
          : "text-[var(--surface-muted-text)] border-transparent hover:text-[var(--page-text)] hover:bg-[var(--surface-panel-muted)]"
          }`}
      >
        <Icon size={18} className={isActive ? "text-emerald-500" : "text-inherit"} />
        <span>{label}</span>
        <span
          className={`pointer-events-none absolute left-1/2 -bottom-1 h-1 w-8 -translate-x-1/2 rounded-full bg-emerald-400 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
        />
      </button>
    );
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">{t('find.page.header.title')}</h1>
          <p className="text-gray-300">{t('find.page.header.subtitle')}</p>
        </div>

        <div className="border-b border-[var(--surface-border)] mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              className="flex flex-wrap gap-2 p-1 rounded-3xl border border-[var(--surface-border)]"
              style={{ background: "var(--surface-panel-muted)" }}
            >
              <TabButton tab="1v1" label={t('find.tabs.people')} Icon={MessageSquare} />
              <TabButton tab="friends" label={t('find.tabs.friends')} Icon={UserRoundCheck} />
              <TabButton tab="group" label={t('find.tabs.groups')} Icon={Users} />
              <TabButton tab="ai" label={t('find.tabs.ai')} Icon={Bot} />
            </div>
            {(activeTab === "group" || activeTab === "ai") && (
              <button
                type="button"
                onClick={handlePlusClick}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--surface-border)] text-[var(--surface-muted-text)] transition-all hover:border-emerald-400 hover:text-emerald-500"
              >
                <Plus size={22} />
              </button>
            )}
          </div>
        </div>

        {renderContent()}
      </div>

      <NewGroupChatModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />

      <AIRoomTypeModal isOpen={isAIRoomTypeModalOpen} onClose={closeAllAIModals} onSelect={handleSelectAIRoomType} />

      <AISituationModal
        isOpen={isAISituationModalOpen}
        onClose={closeAllAIModals}
        onSelectCategory={handleSelectAICategory}
        categories={aiCategories}
        isLoading={isPromptLoading}
        errorMessage={promptError?.message}
        onRetry={() => {
          void refetchPromptList();
        }}
        headerTitle={aiPromptModalTitle}
      />

      <AIScenarioModal
        isOpen={isAIScenarioModalOpen}
        onClose={closeAllAIModals}
        onBack={handleBackToCategories}
        selectedCategory={selectedAICategory}
        onSelectScenario={handleSelectAIScenario}
      />

      <AICreateRoomModal
        isOpen={isAICreateModalOpen}
        onClose={closeAllAIModals}
        selectedRoomType={selectedRoomType}
        selectedPrompt={selectedAIScenario}
        onSubmit={handleCreateAiRoom}
        isSubmitting={createAiChatMutation.isPending}
      />
    </>
  );
}

export default function FindPageClient() {
  return <FindPageContent />;
}
