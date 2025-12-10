'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  usePostQuery,
  useDeletePostMutation,
  useTogglePostLikeMutation,
} from '@/global/api/usePostQuery';
import CommentSection from '@/app/board/_components/CommentSection';
import { useLoginStore } from '@/global/stores/useLoginStore';

interface PostDetailPageProps {
  params: {
    id: string;
  };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const postId = parseInt(params.id);
  const router = useRouter();
  const { data: post, isLoading, error } = usePostQuery(postId);
  const deletePostMutation = useDeletePostMutation();
  const toggleLikeMutation = useTogglePostLikeMutation(postId);
  const [isLiked, setIsLiked] = useState(false);
  const member = useLoginStore((state) => state.member);

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

  const handleDelete = async () => {
    if (confirm('게시글을 삭제하시겠습니까?')) {
      await deletePostMutation.mutateAsync(postId);
      router.push('/board');
    }
  };

  const handleLike = async () => {
    await toggleLikeMutation.mutateAsync(isLiked);
    setIsLiked(!isLiked);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-500">게시글을 불러오는데 실패했습니다.</div>
      </div>
    );
  }

  const isOwner = member?.id === post.authorId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로가기 */}
      <div className="mb-4">
        <Link href="/board" className="text-blue-600 hover:text-blue-800">
          ← 목록으로
        </Link>
      </div>

      {/* 게시글 */}
      <div className="bg-white border rounded-lg p-8">
        {/* 헤더 */}
        <div className="mb-6 pb-6 border-b">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex gap-4">
              <span className="font-semibold">{post.authorNickname}</span>
              <span>{formatDate(post.createdAt)}</span>
              {post.createdAt !== post.modifiedAt && (
                <span className="text-gray-400">(수정됨)</span>
              )}
            </div>
            <div className="flex gap-4">
              <span>조회 {post.viewCount}</span>
              <span>❤️ {post.likeCount}</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="mb-6">
          <div className="prose max-w-none mb-6">
            <p className="whitespace-pre-wrap text-gray-800">{post.content}</p>
          </div>

          {/* 이미지 */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {post.imageUrls.map((url, index) => (
                <div key={index} className="relative h-64 rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 좋아요 버튼 */}
        <div className="flex justify-center py-6 border-y">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg transition ${
              isLiked
                ? 'bg-red-100 text-red-600 border-2 border-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-2xl">❤️</span>
            <span className="font-semibold">{post.likeCount}</span>
          </button>
        </div>

        {/* 버튼 */}
        {isOwner && (
          <div className="flex justify-end gap-2 mt-6">
            <Link
              href={`/board/edit/${postId}`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              수정
            </Link>
            <button
              onClick={handleDelete}
              disabled={deletePostMutation.isPending}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 댓글 */}
      <CommentSection postId={postId} />
    </div>
  );
}
