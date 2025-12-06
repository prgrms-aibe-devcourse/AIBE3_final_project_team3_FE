"use client";

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

function FindPageContent() {
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
  const aiCategories = useMemo(() => buildCategoriesFromPromptList(promptList), [promptList]);
  const aiPromptModalTitle = selectedRoomType
    ? `${formatAiRoomTypeLabel(selectedRoomType)} 프롬프트 선택`
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
      alert("AI 채팅방 유형을 먼저 선택해 주세요.");
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
      alert("AI 채팅방 유형과 프롬프트를 먼저 선택해 주세요.");
      return;
    }

    const personaId = Number(selectedAIScenario.id);
    if (!Number.isFinite(personaId)) {
      alert("선택한 프롬프트 ID가 올바르지 않습니다. 다시 시도해 주세요.");
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
    const totalPages = memberPage?.totalPages ?? null;
    const isFirstPage = memberPage?.isFirst ?? currentPage <= 1;
    const isLastPage =
      memberPage?.isLast ?? (typeof totalPages === "number" ? currentPage >= totalPages : members.length < DEFAULT_PAGE_SIZE);
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
        <div className="space-y-10">
          <div className="bg-gradient-to-r from-gray-800 via-emerald-900/30 to-gray-800 border border-emerald-800/50 rounded-2xl p-8 flex flex-col gap-4">
            <div>
              <p className="text-emerald-300 text-sm font-semibold uppercase tracking-[0.2em]">AI ENGLISH LAB</p>
              <h2 className="text-3xl font-bold text-white mt-2">3가지 AI 튜터로 상황극부터 맞춤 피드백까지</h2>
              <p className="text-gray-300 mt-3 max-w-3xl">
                역할놀이로 말하기 감각을 깨우고, 내 학습노트 기반 코칭과 유사 학습자 사례까지 한 번에 연결해 보세요. 선택 즉시 프롬프트 카테고리를 열어 원하는 시나리오를 고를 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openAiCreationFlow}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors"
              >
                AI 대화방 만들기
              </button>
              <button
                type="button"
                onClick={() => router.push("/learning-notes")}
                className="px-6 py-3 rounded-xl border border-gray-600 text-white font-semibold hover:bg-gray-800/60 transition-colors"
              >
                학습노트 살펴보기
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AI_ROOM_TYPE_OPTIONS.map((option) => (
              <div key={option.type} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-white">{option.title}</h3>
                  {option.badge ? (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-600 text-white">{option.badge}</span>
                  ) : null}
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{option.description}</p>
                <p className="text-gray-400 text-xs leading-relaxed flex-1">{option.details}</p>
                <button
                  type="button"
                  onClick={() => handleSelectAIRoomType(option.type)}
                  className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-700 hover:bg-emerald-500 text-white font-medium transition-colors"
                >
                  프롬프트 선택하기
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <p className="text-sm text-gray-300">
              Tip. 상황극(ROLE_PLAY)은 실전 회화 루틴을 빠르게 만들어 주고, <span className="text-white font-semibold">개인화 튜터</span>와 <span className="text-white font-semibold">유사도 튜터</span>는 학습노트 데이터를 활용해 표현 확장과 피드백을 제공합니다. 하루에 여러 모드를 번갈아 사용해 보면 가장 빠르게 말하기 감각이 올라갑니다.
            </p>
          </div>
        </div>
      );
    }

    return renderPeopleContent();
  };

  const TabButton = ({ tab, label, Icon }: { tab: ActiveTab; label: string; Icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
        activeTab === tab ? "bg-gray-800 text-emerald-400" : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
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
          <p className="text-gray-300">Discover new people, groups, and AI to practice English with.</p>
        </div>

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
                type="button"
                onClick={handlePlusClick}
                className="text-gray-400 hover:text-white transition-colors"
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
