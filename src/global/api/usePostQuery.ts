import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PostSummary,
  PostDetail,
  PostCreateRequest,
  PostUpdateRequest,
  Comment,
  CommentCreateRequest,
  CommentUpdateRequest,
  LikeStatus,
  PageResponse,
  CustomResponse,
  PostSortType,
} from '@/global/types/post.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// ==================== 게시글 API ====================

// 게시글 목록 조회
export const usePostsQuery = (sort: PostSortType = PostSortType.LATEST, page = 0, size = 20) => {
  return useQuery({
    queryKey: ['posts', sort, page, size],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/api/v1/posts?sort=${sort}&page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('게시글 목록 조회 실패');
      const result: CustomResponse<PageResponse<PostSummary>> = await response.json();
      return result.data;
    },
  });
};

// 게시글 상세 조회
export const usePostQuery = (postId: number) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('게시글 조회 실패');
      const result: CustomResponse<PostDetail> = await response.json();
      return result.data;
    },
  });
};

// 게시글 작성
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PostCreateRequest) => {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('게시글 작성 실패');
      const result: CustomResponse<PostDetail> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 게시글 수정
export const useUpdatePostMutation = (postId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PostUpdateRequest) => {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('게시글 수정 실패');
      const result: CustomResponse<PostDetail> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};

// 게시글 삭제
export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('게시글 삭제 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 게시글 좋아요
export const useTogglePostLikeMutation = (postId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isLiked: boolean) => {
      const token = localStorage.getItem('accessToken');
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/likes`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('좋아요 처리 실패');
      const result: CustomResponse<LikeStatus> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// ==================== 댓글 API ====================

// 댓글 목록 조회
export const useCommentsQuery = (postId: number) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('댓글 조회 실패');
      const result: CustomResponse<Comment[]> = await response.json();
      return result.data;
    },
  });
};

// 댓글 작성
export const useCreateCommentMutation = (postId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CommentCreateRequest) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('댓글 작성 실패');
      const result: CustomResponse<Comment> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};

// 댓글 수정
export const useUpdateCommentMutation = (postId: number, commentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CommentUpdateRequest) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/api/v1/posts/${postId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('댓글 수정 실패');
      const result: CustomResponse<Comment> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};

// 댓글 삭제
export const useDeleteCommentMutation = (postId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/api/v1/posts/${postId}/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('댓글 삭제 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};

// 댓글 좋아요
export const useToggleCommentLikeMutation = (postId: number, commentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isLiked: boolean) => {
      const token = localStorage.getItem('accessToken');
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(
        `${API_BASE_URL}/api/v1/posts/${postId}/comments/${commentId}/likes`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('좋아요 처리 실패');
      const result: CustomResponse<LikeStatus> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};
