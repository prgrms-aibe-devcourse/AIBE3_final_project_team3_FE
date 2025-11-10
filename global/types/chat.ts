// global/types/chat.ts

// 롤플레이 시나리오 (예시)
export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
}

// 다른 팀원들이 필요한 타입들을 여기에 추가하세요
// 예: interface Post, interface User, interface Notification 등