import createClient from "openapi-fetch";
import { API_BASE_URL } from "../consts";
import type { paths } from "./schema";
import { useLoginStore } from "../stores/useLoginStore";

const customFetch: typeof fetch = async (input, init) => {
  const { accessToken } = useLoginStore.getState();

  // 추가된 디버깅 코드
  console.log("[API Client] Requesting:", input);
  console.log("[API Client] Token being sent:", accessToken);
  // ---

  // openapi-fetch가 생성한 Request 객체를 먼저 만듭니다.
  // 이렇게 하면 openapi-fetch가 설정한 기본 헤더(Content-Type 등)를 유지할 수 있습니다.
  const request = new Request(input, init);

  // Authorization 헤더만 추가/수정합니다.
  if (accessToken) {
    request.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Content-Type이 명시적으로 설정되지 않았다면, JSON 요청에 대해 기본값을 설정합니다.
  // openapi-fetch가 이미 설정했을 수도 있으므로, 없을 때만 추가합니다.
  if (
    (request.method === "POST" || request.method === "PUT") &&
    request.body &&
    !request.headers.has("Content-Type")
  ) {
    request.headers.set("Content-Type", "application/json");
  }

  return fetch(request); // 수정된 Request 객체를 fetch에 전달
};

const client = createClient<paths>({ baseUrl: API_BASE_URL, fetch: customFetch });

export default client;
