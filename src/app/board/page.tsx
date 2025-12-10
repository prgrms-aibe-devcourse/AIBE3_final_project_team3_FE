'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePostsQuery } from '@/global/api/usePostQuery';
import { PostSortType } from '@/global/types/post.types';

export default function BoardListPage() {
  const [sort, setSort] = useState<PostSortType>(PostSortType.LATEST);
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = usePostsQuery(sort, page, 20);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-500">게시글을 불러오는데 실패했습니다.</div>
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

      {/* 정렬 옵션 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setSort(PostSortType.LATEST);
            setPage(0);
          }}
          className={`px-4 py-2 rounded-lg transition ${
            sort === PostSortType.LATEST
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          최신순
        </button>
        <button
          onClick={() => {
            setSort(PostSortType.POPULAR);
            setPage(0);
          }}
          className={`px-4 py-2 rounded-lg transition ${
            sort === PostSortType.POPULAR
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          인기순
        </button>
      </div>

      {/* 게시글 목록 */}
      {data && data.content.length > 0 ? (
        <div className="space-y-4">
          {data.content.map((post) => (
            <Link
              key={post.id}
              href={`/board/${post.id}`}
              className="block bg-white border rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold flex-1">{post.title}</h2>
                {post.imageUrls.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">📷 {post.imageUrls.length}</span>
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
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          게시글이 없습니다.
        </div>
      )}

      {/* 페이지네이션 */}
      {data && data.totalPages > 0 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage(page - 1)}
            disabled={data.first}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            이전
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              const pageNum = Math.floor(page / 5) * 5 + i;
              if (pageNum >= data.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={data.last}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
