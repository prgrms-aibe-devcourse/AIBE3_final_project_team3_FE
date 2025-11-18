// 인증 없이 접근 가능한 경로들을 정의합니다.
// 필요에 따라 추가/수정할 수 있습니다.
const ALLOWED_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/",
  "/api/v1/auth/login", // API 엔드포인트도 포함
  "/api/v1/auth/join",
  "/api/v1/auth/reissue",
  "/api/v1/auth/logout",
];

export const isAllowedPath = (pathname: string) => {
  // pathname이 ALLOWED_PATHS 중 하나로 시작하는지 확인
  return ALLOWED_PATHS.some((path) => pathname.startsWith(path));
};
