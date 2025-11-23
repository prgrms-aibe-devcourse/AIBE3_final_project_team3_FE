"use client";

import {
    useAcceptFriendRequest,
    useDeleteFriend,
    useRejectFriendRequest,
    useSendFriendRequest,
} from "@/global/api/useFriendshipMutation";
import { useCallback } from "react";

interface FriendshipActionStatus {
  isSending: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
  isDeleting: boolean;
}

type SendFriendRequestParams = {
  receiverId: number;
  refreshMembers?: boolean;
};

type FriendRequestDecisionParams = {
  requestId: number;
  opponentMemberId?: number;
  refreshMembers?: boolean;
};

type DeleteFriendParams = {
  friendId: number;
  opponentMemberId?: number;
  refreshMembers?: boolean;
};

export interface FriendshipActions {
  sendFriendRequest: (params: SendFriendRequestParams) => Promise<void>;
  acceptFriendRequest: (params: FriendRequestDecisionParams) => Promise<void>;
  rejectFriendRequest: (params: FriendRequestDecisionParams) => Promise<void>;
  deleteFriend: (params: DeleteFriendParams) => Promise<void>;
  status: FriendshipActionStatus;
}

const getPendingState = (mutation: { isPending?: boolean; isLoading?: boolean }) => {
  if (typeof mutation.isPending === "boolean") {
    return mutation.isPending;
  }
  if (typeof mutation.isLoading === "boolean") {
    return mutation.isLoading;
  }
  return false;
};

export const useFriendshipActions = (): FriendshipActions => {
  const sendMutation = useSendFriendRequest();
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();
  const deleteMutation = useDeleteFriend();

  const sendFriendRequest = useCallback(
    async ({ receiverId, refreshMembers }: SendFriendRequestParams) => {
      await sendMutation.mutateAsync({
        receiverId,
        targetProfileId: receiverId,
        refreshMembers,
      });
    },
    [sendMutation],
  );

  const acceptFriendRequest = useCallback(
    async ({ requestId, opponentMemberId, refreshMembers }: FriendRequestDecisionParams) => {
      await acceptMutation.mutateAsync({ requestId, opponentMemberId, refreshMembers });
    },
    [acceptMutation],
  );

  const rejectFriendRequest = useCallback(
    async ({ requestId, opponentMemberId, refreshMembers }: FriendRequestDecisionParams) => {
      await rejectMutation.mutateAsync({ requestId, opponentMemberId, refreshMembers });
    },
    [rejectMutation],
  );

  const deleteFriend = useCallback(
    async ({ friendId, opponentMemberId, refreshMembers }: DeleteFriendParams) => {
      await deleteMutation.mutateAsync({ friendId, opponentMemberId, refreshMembers });
    },
    [deleteMutation],
  );

  return {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    deleteFriend,
    status: {
      isSending: getPendingState(sendMutation),
      isAccepting: getPendingState(acceptMutation),
      isRejecting: getPendingState(rejectMutation),
      isDeleting: getPendingState(deleteMutation),
    },
  };
};
