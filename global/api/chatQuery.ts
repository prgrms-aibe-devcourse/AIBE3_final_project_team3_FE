import { apiClient } from '@/global/lib/api-client';
import type { RoleplayScenario } from '@/global/types';

export const chatQuery = {
  // 롤플레이 시나리오 조회
  getRoleplayScenarios: async (): Promise<RoleplayScenario[]> => {
    return apiClient.request('/api/v1/chat/roleplay/scenarios');
  },
};