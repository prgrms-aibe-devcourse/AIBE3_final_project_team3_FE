"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCloseRoomMutation } from "@/global/api/useAdminCloseRoomQuery";
import { GroupChatRoomPublicResp } from "@/global/types/chat.types";
import { useGetPublicGroupChatRoomsQuery, useJoinGroupChat } from "@/global/api/useChatQuery";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { Hash, Lock, MoreVertical, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Avatar from "boring-avatars"; // boring-avatars 임포트

// Password Modal Component
const PasswordModal = ({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center theme-overlay">
      <div className="theme-surface rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">{t('find.groupRooms.passwordModal.title')}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('find.groupRooms.passwordModal.placeholder')}
            className="w-full theme-field px-4 py-2 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md transition-colors"
              style={{ background: "var(--surface-panel-muted)", color: "var(--page-text)" }}
            >
              {t('find.groupRooms.passwordModal.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              {t('find.groupRooms.passwordModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// 방 폐쇄 모달 (관리자 전용)
const CloseRoomModal = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonCode: number) => void;
}) => {
  const [reasonCode, setReasonCode] = useState<number | null>(null);

  if (!isOpen) return null;

  const reasons = [
    { code: 1, label: "불건전한 대화" },
    { code: 2, label: "규칙 위반 다수 발생" },
    { code: 3, label: "신고 누적" },
    { code: 4, label: "스팸/광고 방" },
    { code: 5, label: "비정상 활동 탐지" },
    { code: 99, label: "기타 사유" },
  ];

  const handleSubmit = () => {
    if (reasonCode === null) {
      alert("폐쇄 사유를 선택해주세요.");
      return;
    }
    onConfirm(reasonCode);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999] theme-overlay">
      <div className="theme-surface rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">방 폐쇄</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
          ⚠ 되돌릴 수 없습니다. 모든 멤버가 강제로 퇴장됩니다.
        </div>

        <label className="block mb-2 font-medium text-sm text-gray-700">
          폐쇄 사유 *
        </label>
        <select
          value={reasonCode ?? ""}
          onChange={(e) => setReasonCode(Number(e.target.value))}
          className="w-full theme-field rounded-md p-2 mb-6"
        >
          <option value="">폐쇄 사유 선택</option>
          {reasons.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md transition"
            style={{ background: "var(--surface-panel-muted)", color: "var(--page-text)" }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
          >
            폐쇄하기
          </button>
        </div>
      </div>
    </div>
  );
};

// Individual Group Room Card Component
const GroupRoomCard = ({ room }: { room: GroupChatRoomPublicResp }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const joinGroupChat = useJoinGroupChat();
  const { role } = useLoginStore();
  const closeRoomMutation = useCloseRoomMutation();

  const handleJoinRoom = () => {
    if (room.hasPassword) {
      setIsPasswordModalOpen(true);
    } else {
      joinGroupChat.mutate({ roomId: room.id });
    }
  };

  const handlePasswordSubmit = (password: string) => {
    setIsPasswordModalOpen(false);
    joinGroupChat.mutate({ roomId: room.id, password });
  };

  /* --- 관리자: 방 폐쇄 --- */
  const handleConfirmClose = (reasonCode: number) => {
    closeRoomMutation.mutate(
      { roomId: room.id, reasonCode },
      {
        onSuccess() {
          alert("채팅방이 성공적으로 폐쇄되었습니다.");
          setIsCloseModalOpen(false);
          setIsMenuOpen(false);
        },
        onError(err) {
          alert("채팅방 폐쇄 실패: " + err?.message);
        },
      }
    );
  };

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <>
      <div className="theme-card rounded-2xl flex flex-col justify-between hover:border-emerald-400 transition-all duration-300 relative hover:-translate-y-1 overflow-hidden">
        {/* 상단 아바타/이미지 영역 */}
        <div className="h-32 w-full relative bg-gray-700 flex items-center justify-center overflow-hidden">
            <Avatar
                size={128} // 이미지 영역 크기에 맞게 조절
                name={room.topic || room.name || `room-${room.id}`} // topic > name > id 순으로 시드 사용
                variant="beam" // 'marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus' 중 선택
                colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]} // 테마에 맞는 색상 팔레트
            />
            {room.hasPassword && (
                <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full backdrop-blur-sm">
                    <Lock size={14} className="text-white" />
                </div>
            )}
        </div>

        {/* 컨텐츠 영역 */}
        <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
                <h3 className="text-lg font-bold text-white break-all">{room.name}</h3>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                {/* 관리자만 메뉴 보이기 */}
                {role === "ROLE_ADMIN" && (
                <div className="relative" ref={menuRef}>
                    <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 rounded transition-colors hover:bg-[var(--surface-panel-muted)]"
                    aria-label="메뉴"
                    >
                    <MoreVertical size={18} className="text-gray-400" />
                    </button>

                    {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 theme-popover rounded-lg z-10">
                        <button
                        onClick={() => setIsCloseModalOpen(true)}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-[var(--surface-panel-muted)] rounded-lg transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                        방 폐쇄하기
                        </button>
                    </div>
                    )}
                </div>
                )}
            </div>
            </div>

            <p className="text-sm text-gray-400 mb-3 line-clamp-2 h-[40px]">{room.description || "채팅방 설명이 없습니다."}</p>
            <div className="flex items-center text-xs text-gray-400 mb-4">
            <Hash size={14} className="mr-1" />
            <span>{room.topic || "자유 주제"}</span>
            </div>

            <div className="flex justify-between items-center mt-auto pt-2">
            <div className="flex items-center text-sm text-gray-300">
                <Users size={16} className="mr-2" />
                <span>{room.memberCount} / 50</span>
            </div>
            <button
                onClick={handleJoinRoom}
                disabled={joinGroupChat.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-[var(--surface-panel-muted)] disabled:text-[var(--surface-muted-text)] disabled:cursor-not-allowed"
            >
                {joinGroupChat.isPending ? "참가 중..." : "Join"}
            </button>
            </div>
        </div>
      </div>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />
      {/* 🔥 폐쇄 모달 */}
      <CloseRoomModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={handleConfirmClose}
      />
    </>
  );
};


// Main Component to Fetch and Display the List
const PAGE_SIZE = 12;
const MAX_PAGE_LINKS = 5;

const buildPageNumbers = (currentPage: number, totalPages?: number | null, maxLinks = MAX_PAGE_LINKS) => {
  if (typeof totalPages !== "number" || totalPages <= 0) {
    return [];
  }

  if (totalPages <= maxLinks) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
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

  return Array.from({ length: maxLinks }, (_, idx) => start + idx);
};

export default function GroupRoomList() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error, isFetching } = useGetPublicGroupChatRoomsQuery({
    page: currentPage - 1,
    size: PAGE_SIZE,
  });

  const rooms = data?.items ?? [];
  const totalPages = data?.totalPages ?? null;
  const derivedTotalPages = (() => {
    if (typeof totalPages === "number" && totalPages > 0) {
      return totalPages;
    }
    if (typeof data?.totalElements === "number" && data.totalElements > 0) {
      return Math.max(Math.ceil(data.totalElements / PAGE_SIZE), 1);
    }
    return null;
  })();
  const isFirstPage = data?.isFirst ?? currentPage <= 1;
  const isLastPage = data?.isLast ?? (typeof derivedTotalPages === "number" ? currentPage >= derivedTotalPages : rooms.length < PAGE_SIZE);

  useEffect(() => {
    if (typeof derivedTotalPages === "number" && derivedTotalPages > 0 && currentPage > derivedTotalPages) {
      setCurrentPage(derivedTotalPages);
    }
  }, [derivedTotalPages, currentPage]);

  if (isLoading && !data) {
    return (
      <div className="text-center text-white">
        <p>Loading group chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400">
        <p>Error loading groups: {error.message}</p>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center text-gray-400">
        <p>No public group chats found. Why not create one?</p>
      </div>
    );
  }

  const pageNumbers = buildPageNumbers(currentPage, derivedTotalPages);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <GroupRoomCard key={room.id} room={room} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={isFirstPage || isLoading}
          className="px-4 py-2 rounded border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] text-[var(--page-text)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[var(--surface-panel)]"
        >
          Previous
        </button>

        <div className="flex-1 min-w-[240px] flex flex-col items-center gap-2">
          {pageNumbers.length > 0 ? (
            <div className="flex items-center gap-2">
              {pageNumbers.map((pageNumber) => {
                const isActive = pageNumber === currentPage;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    disabled={isLoading && pageNumber === currentPage}
                    className={`min-w-[2.5rem] px-3 py-1.5 rounded-lg border text-sm transition-colors ${isActive
                      ? "border-emerald-500 text-white bg-emerald-500/10"
                      : "border-gray-600 text-gray-300 hover:border-emerald-400"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          ) : (
            <div />
          )}

          <div className="text-sm text-gray-300">
            Page {currentPage}
            {typeof derivedTotalPages === "number" && derivedTotalPages > 0 ? ` / ${derivedTotalPages}` : ""}
            {isFetching ? <span className="ml-2 text-xs text-gray-400">Updating...</span> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={isLastPage || isLoading}
          className="px-4 py-2 rounded border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] text-[var(--page-text)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[var(--surface-panel)]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
