'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  usePostQuery,
  useDeletePostMutation,
  useTogglePostLikeMutation,
} from '@/global/api/usePostQuery';
import { useFetchMe } from '@/global/api/useAuthQuery';
import CommentSection from '@/app/board/_components/CommentSection';
import { useLoginStore } from '@/global/stores/useLoginStore';
import { getApiTime, parseApiDate } from '@/global/lib/date';

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { t, language } = useLanguage();
  const { id } = use(params);
  const postId = parseInt(id);
  const router = useRouter();
  const { data: post, isLoading, error } = usePostQuery(postId);
  const deletePostMutation = useDeletePostMutation();
  const { mutate: toggleLike } = useTogglePostLikeMutation(postId);
  const member = useLoginStore((state) => state.member);
  const { data: meData } = useFetchMe();

  const formatDate = (dateString: string) => {
    const date = parseApiDate(dateString) ?? new Date(dateString);
    const locale = language === 'ko' ? 'ko-KR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (confirm(t('board.detail.confirmDelete'))) {
      await deletePostMutation.mutateAsync(postId);
      router.push('/board');
    }
  };

  const handleLike = () => {
    if (post) {
      toggleLike(post.isLiked);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">{t('board.detail.loading')}</div>
      </div>
    );
  }

  if (error || !post) {
    console.error('게시글 상세보기 에러:', error);
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-500">
          {t('board.detail.error')}
          {error && (
            <div className="text-sm mt-2">{t('board.detail.errorDetail', { message: error.message })}</div>
          )}
        </div>
      </div>
    );
  }

  const currentUserId = meData?.id ?? member?.id;
  const isOwner = currentUserId != null && post.authorId != null && currentUserId === post.authorId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로가기 */}
      <div className="mb-4">
        <Link href="/board" className="text-blue-600 hover:text-blue-800">
          {t('board.detail.backToList')}
        </Link>
      </div>

      {/* 게시글 */}
      <div className="border rounded-lg p-8" style={{ background: 'var(--surface-panel)', borderColor: 'var(--surface-border)' }}>
        {/* 헤더 */}
        <div className="mb-6 pb-6 border-b">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex gap-4">
              <span className="font-semibold">{post.authorNickname}</span>
              <span>{formatDate(post.createdAt)}</span>
              {getApiTime(post.createdAt) !== getApiTime(post.modifiedAt) && (
                <span className="text-gray-400">{t('board.detail.modified', { date: formatDate(post.modifiedAt) })}</span>
              )}
            </div>
            <div className="flex gap-4">
              <span>{t('board.detail.views', { count: String(post.viewCount) })}</span>
              <span>❤️ {post.likeCount}</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="mb-6">
          <div className="prose max-w-none mb-6">
            <p className="whitespace-pre-wrap" style={{ color: 'var(--page-text)' }}>{post.content}</p>
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
                    className="object-contain"
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
              post.isLiked
                ? 'bg-red-100 text-red-600 border-2 border-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              background: post.isLiked ? 'var(--accent-color-muted)' : 'var(--surface-muted)',
              color: post.isLiked ? 'var(--accent-color)' : 'var(--page-text-muted)',
              borderColor: post.isLiked ? 'var(--accent-color)' : 'var(--surface-border)',
            }}
          >
            <span className="text-2xl">❤️</span>
            <span className="font-semibold">{post.isLiked ? t('board.detail.unlike') : t('board.detail.like')}</span>
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
              {t('board.detail.edit')}
            </Link>
            <button
              onClick={handleDelete}
              disabled={deletePostMutation.isPending}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              {t('board.detail.delete')}
            </button>
          </div>
        )}
      </div>

      {/* 댓글 */}
      <CommentSection postId={postId} />
    </div>
  );
}
