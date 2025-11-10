// global/types/common.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
}

export interface SuccessResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}