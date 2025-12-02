import { components } from "@/global/backend/schema";

export type MemberProfileUpdateReq = components["schemas"]["MemberInfoModifyReq"];
export type FriendSummary = components["schemas"]["FriendSummaryResp"];
export type FriendDetail = components["schemas"]["FriendDetailResp"];

export type MemberProfile = MemberProfileUpdateReq & {
  memberId?: number;
  id?: number;
  email?: string;
  interests?: string[];
  profileImageUrl?: string;
  lastSeenAt?: string;
  isFriend?: boolean;
  isPendingRequest?: boolean;
  isPendingFriendRequestFromMe?: boolean;
  isPendingFriendRequestFromOpponent?: boolean;
  isFriendRequestSent?: boolean;
  receivedFriendRequestId?: number | null;
  pendingFriendRequestIdFromMe?: number;
  pendingFriendRequestIdFromOpponent?: number;
  friendshipId?: number;
  countryCode?: string;
  countryName?: string;
  joinedAt?: string;
  totalChats?: number;
  vocabularyLearned?: number;
  streak?: number;
};
