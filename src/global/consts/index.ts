// 백엔드 API의 기본 URL 정의, 실제 배포 환경에서는 환경 변수 등으로 관리
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? "https://api.mixchat.yhcho.com" 
  : "http://localhost:8080";
