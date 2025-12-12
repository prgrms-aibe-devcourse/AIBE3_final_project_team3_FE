'use client';

import { useState } from 'react';
import { Comment, CommentCreateRequest } from '@/global/types/post.types';
import {
  useCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useToggleCommentLikeMutation,
} from '@/global/api/usePostQuery';
import { useLoginStore } from '@/global/stores/useLoginStore';

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { data: comments, isLoading } = useCommentsQuery(postId);
  const createCommentMutation = useCreateCommentMutation(postId);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const member = useLoginStore((state) => state.member);

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;
    
    const data: CommentCreateRequest = {
      content: newComment,
    };
    
    await createCommentMutation.mutateAsync(data);
    setNewComment('');
  };

  const handleCreateReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    
    const data: CommentCreateRequest = {
      parentId,
      content: replyContent,
    };
    
    await createCommentMutation.mutateAsync(data);
    setReplyTo(null);
    setReplyContent('');
  };

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
    return <div className="text-center py-4">댓글 로딩 중...</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">
        댓글 {comments?.length || 0}개
      </h3>

      {/* 댓글 작성 */}
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 작성하세요..."
          className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ background: 'var(--surface-field)', borderColor: 'var(--surface-border)', color: 'var(--page-text)' }}
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleCreateComment}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            댓글 작성
          </button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments?.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            currentUserId={member?.id}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            onReply={handleCreateReply}
            editingCommentId={editingCommentId}
            setEditingCommentId={setEditingCommentId}
            editContent={editContent}
            setEditContent={setEditContent}
          />
        ))}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  postId: number;
  currentUserId?: number;
  isReply?: boolean;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onReply: (parentId: number) => void;
  editingCommentId: number | null;
  setEditingCommentId: (id: number | null) => void;
  editContent: string;
  setEditContent: (content: string) => void;
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  isReply = false,
  replyTo,
  setReplyTo,
  replyContent,
  setReplyContent,
  onReply,
  editingCommentId,
  setEditingCommentId,
  editContent,
  setEditContent,
}: CommentItemProps) {
  const updateCommentMutation = useUpdateCommentMutation(postId, comment.id);
  const deleteCommentMutation = useDeleteCommentMutation(postId);
  const toggleLikeMutation = useToggleCommentLikeMutation(postId, comment.id);
  const [isLiked, setIsLiked] = useState(false);

  const handleEdit = () => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await updateCommentMutation.mutateAsync({ content: editContent });
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleDelete = async () => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      await deleteCommentMutation.mutateAsync(comment.id);
    }
  };

  const handleLike = async () => {
    await toggleLikeMutation.mutateAsync(isLiked);
    setIsLiked(!isLiked);
  };

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

  const isOwner = currentUserId === comment.authorId;

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="p-4 rounded-lg" style={{ background: 'var(--surface-panel-muted)', borderColor: 'var(--surface-border)' }}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-semibold">{comment.authorNickname}</span>
            <span className="text-sm text-gray-500 ml-2">
              {formatDate(comment.createdAt)}
            </span>
            {comment.createdAt !== comment.modifiedAt && (
              <span className="text-xs text-gray-400 ml-1">(수정됨)</span>
            )}
          </div>
        </div>

        {editingCommentId === comment.id ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--surface-field)', borderColor: 'var(--surface-border)', color: 'var(--page-text)' }}
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setEditingCommentId(null);
                  setEditContent('');
                }}
                className="px-4 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-2" style={{ color: 'var(--page-text)' }}>{comment.content}</p>
            <div className="flex gap-4 text-sm">
              <button
                onClick={handleLike}
                className={`${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-600`}
              >
                ❤️ {comment.likeCount}
              </button>
              {!isReply && (
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-gray-500 hover:text-blue-600"
                >
                  답글
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={handleEdit}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-gray-500 hover:text-red-600"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* 답글 작성 */}
        {replyTo === comment.id && !isReply && (
          <div className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 작성하세요..."
              className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--surface-field)', borderColor: 'var(--surface-border)', color: 'var(--page-text)' }}
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onReply(comment.id)}
                disabled={!replyContent.trim()}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                답글 작성
              </button>
              <button
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent('');
                }}
                className="px-4 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 대댓글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              isReply={true}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onReply={onReply}
              editingCommentId={editingCommentId}
              setEditingCommentId={setEditingCommentId}
              editContent={editContent}
              setEditContent={setEditContent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
