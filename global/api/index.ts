// global/api/index.ts
// Chat API만 export

export { chatQuery } from './chatQuery';

// 통합 API 객체 (Chat만 포함)
import { chatQuery } from './chatQuery';

export const api = {
  chat: chatQuery,
} as const;