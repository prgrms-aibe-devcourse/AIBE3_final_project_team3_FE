import createClient from "openapi-fetch";
import { API_BASE_URL } from "../consts";
import { useLoginStore } from "../stores/useLoginStore";
import type { paths } from "./schema";

let tokenRefreshPromise: Promise<string | null> | null = null;
// 공유 프로미스로 동시 재발급 요청을 막습니다.

const extractAccessToken = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (typeof record.accessToken === "string" && record.accessToken) {
    return record.accessToken;
  }

  const candidate = record.data;
  if (typeof candidate === "string" && candidate) {
    return candidate;
  }

  if (
    candidate &&
    typeof candidate === "object" &&
    typeof (candidate as Record<string, unknown>).accessToken === "string"
  ) {
    return (candidate as Record<string, unknown>).accessToken as string;
  }

  return null;
};

const extractTokenFromHeaders = (response: Response): string | null => {
  const headerValue =
    response.headers.get("authorization") ?? response.headers.get("Authorization");

  if (!headerValue) {
    return null;
  }

  const bearerMatch = headerValue.match(/^Bearer\s+(.+)$/i);
  return bearerMatch ? bearerMatch[1] : headerValue;
};

const requestTokenReissue = async (): Promise<string | null> => {
  if (!tokenRefreshPromise) {
    const refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/reissue`, {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          return null;
        }

        let newToken = extractTokenFromHeaders(response);

        if (!newToken) {
          const payload = await response.json().catch(() => null);
          newToken = extractAccessToken(payload);
        }

        if (newToken) {
          const { setAccessToken } = useLoginStore.getState();
          setAccessToken(newToken);
          return newToken;
        }

        return null;
      } catch (error) {
        console.error("Refresh token request failed", error);
        return null;
      } finally {
        tokenRefreshPromise = null;
      }
    })();

    tokenRefreshPromise = refreshPromise;
  }

  return tokenRefreshPromise;
};

const isMultipartLikeBody = (body: BodyInit | null | undefined): boolean => {
  if (!body) {
    return false;
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return true;
  }

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return true;
  }

  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    return true;
  }

  if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) {
    return true;
  }

  if (body instanceof ArrayBuffer) {
    return true;
  }

  if (ArrayBuffer.isView(body)) {
    return true;
  }

  return false;
};

const buildRequest = (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  accessToken: string | null,
) => {
  const request = new Request(input, {
    ...init,
    credentials: "include",
  });

  if (accessToken) {
    request.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const method = request.method?.toUpperCase?.() ?? "";
  const body = init?.body ?? null;
  const shouldAttachJsonHeader =
    (method === "POST" || method === "PUT" || method === "PATCH") &&
    !request.headers.has("Content-Type") &&
    !isMultipartLikeBody(body);

  if (shouldAttachJsonHeader) {
    request.headers.set("Content-Type", "application/json");
  }

  return request;
};

const customFetch: typeof fetch = async (input, init) => {
  const { accessToken, clearAccessToken } = useLoginStore.getState();

  const performFetch = async (token: string | null) => {
    const request = buildRequest(input, init, token);
    return fetch(request);
  };

  const initialRequest = buildRequest(input, init, accessToken ?? null);

  // 재발급 요청 자체에는 인터셉터를 다시 적용하지 않습니다.
  if (initialRequest.url.endsWith("/api/v1/auth/reissue")) {
    return fetch(initialRequest);
  }

  let response = await fetch(initialRequest);

  if (response.status !== 401) {
    return response;
  }

  // 401이면 리프레시 토큰으로 재발급을 시도합니다.
  const refreshedToken = await requestTokenReissue();

  if (!refreshedToken) {
    clearAccessToken();
    return response;
  }

  response = await performFetch(refreshedToken);
  return response;
};

const client = createClient<paths>({ baseUrl: API_BASE_URL, fetch: customFetch });

export default client;