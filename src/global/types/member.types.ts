import { components } from "@/global/backend/schema";

export type MemberProfileUpdateReq = components["schemas"]["MemberInfoModifyReq"];

export type MemberProfile = MemberProfileUpdateReq & {
  memberId?: number;
  id?: number;
  email?: string;
  interests?: string[];
  profileImageUrl?: string;
  isFriend?: boolean;
  isPendingRequest?: boolean;
  countryCode?: string;
  countryName?: string;
  joinedAt?: string;
  totalChats?: number;
  vocabularyLearned?: number;
  streak?: number;
};
