// ==================== 공통 ====================
export interface CustomResponse<T> {
  msg: string;
  data: T | null;
}

// ==================== 게시글 ====================
export interface PostSummary {
  id: number;
  authorNickname: string;
  title: string;
  content: string;
  imageUrls: string[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  modifiedAt: string;
}

export interface PostDetail {
  id: number;
  authorId: number;
  authorNickname: string;
  title: string;
  content: string;
  imageUrls: string[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  modifiedAt: string;
}

export interface PostCreateRequest {
  title: string;
  content: string;
  images?: File[];
}

export interface PostUpdateRequest {
  title: string;
  content: string;
  images?: File[];
}

export enum PostSortType {
  LATEST = 'LATEST',
  POPULAR = 'POPULAR'
}

// ==================== 댓글 ====================
export interface Comment {
  id: number;
  authorId: number;
  authorNickname: string;
  content: string;
  likeCount: number;
  createdAt: string;
  modifiedAt: string;
  replies: Comment[];
}

export interface CommentCreateRequest {
  parentId?: number | null;
  content: string;
}

export interface CommentUpdateRequest {
  content: string;
}

// ==================== 좋아요 ====================
export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

// ==================== 페이징 ====================
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
