import { components } from "@/global/backend/schema";

export type MemberProfileUpdateReq = components["schemas"]["MemberInfoModifyReq"];

export type MemberProfile = MemberProfileUpdateReq & {
  id?: number;
  email?: string;
  joinedAt?: string;
  totalChats?: number;
  vocabularyLearned?: number;
  streak?: number;
};
