"use client";

import { useState } from "react";
import Link from "next/link";
import { usePostsQuery } from "@/global/api/usePostQuery";
import { PostSortType } from "@/global/types/post.types";
import { useAdminPostDeleteMutation } from "@/global/hooks/useAdminPostDeleteMutation";
import { useToastStore } from "@/global/stores/useToastStore";
import { useLoginStore } from "@/global/stores/useLoginStore"; // ✅ 관리자 검증

// 🔵 삭제 이유 선택 옵션
const DELETE_REASONS = [
  { code: 1, label: "욕설/비방" },
  { code: 2, label: "부적절 표현" },
  { code: 3, label: "스팸/도배" },
  { code: 4, label: "불법/유해 콘텐츠" },
  { code: 5, label: "음란물/청소년 유해" },
  { code: 99, label: "기타" },
];

export default function BoardListPage() {
  const [sort, setSort] = useState<PostSortType>(PostSortType.LATEST);
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = usePostsQuery(sort, page, 20);

  const { addToast } = useToastStore();
  const deleteMutation = useAdminPostDeleteMutation();

  const { role } = useLoginStore();           // ✅ 로그인 정보에서
  const isAdmin = role === "ROLE_ADMIN";      // ✅ 관리자 여부

  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [reasonCode, setReasonCode] = useState<number>(1);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // -----------------------------
  // 🔥 삭제 요청 처리
  // -----------------------------
  const handleDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(
      { postId: deleteTarget, reasonCode },
      {
        onSuccess: () => {
          addToast("게시글이 삭제되었습니다.", "success");
          setDeleteTarget(null);
        },
        onError: (err: any) => {
          addToast(err.message || "삭제 실패", "error");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    console.error("게시판 로딩 에러:", error);
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-500">
          게시글을 불러오는데 실패했습니다.
          <div className="text-sm mt-2">에러: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">게시판</h1>
        <Link
          href="/board/write"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          글쓰기
        </Link>
      </div>

      {/* 게시글 목록 */}
      {data && data.content.length > 0 ? (
        <div className="space-y-4">
          {data.content.map((post) => (
            <div key={post.id} className="relative">
              {/* 게시글 카드 */}
              <Link
                href={`/board/${post.id}`}
                className="block border rounded-lg p-6 hover:shadow-lg transition"
                style={{
                  background: "var(--surface-panel)",
                  borderColor: "var(--surface-border)",
                  color: "var(--page-text)",
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold flex-1">{post.title}</h2>

                  {/* 🔵 관리자만 메뉴 버튼 (⋮) 보이게 */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpenId(menuOpenId === post.id ? null : post.id);
                      }}
                      className="px-2 text-xl"
                    >
                      ⋮
                    </button>
                  )}
                </div>

                <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex gap-4">
                    <span>{post.authorNickname}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex gap-4">
                    <span>조회 {post.viewCount}</span>
                    <span>❤️ {post.likeCount}</span>
                  </div>
                </div>
              </Link>

              {/* 🔵 관리자 메뉴 Dropdown (관리자만 열 수 있음) */}
              {isAdmin && menuOpenId === post.id && (
                <div className="absolute right-4 top-12 bg-white shadow-lg rounded-lg border z-20 w-36">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();    // 링크 클릭 방지
                      e.preventDefault();
                      setDeleteTarget(post.id);
                      setMenuOpenId(null);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                  >
                    게시글 삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">게시글이 없습니다.</div>
      )}

      {/* 🔥 삭제 모달 (관리자가 삭제 버튼 눌렀을 때만 deleteTarget 세팅됨) */}
      {isAdmin && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">게시글 삭제</h2>

            <label className="block text-sm font-semibold mb-2">삭제 사유</label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(Number(e.target.value))}
              className="w-full border rounded-lg p-2 mb-4"
            >
              {DELETE_REASONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>

            <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
