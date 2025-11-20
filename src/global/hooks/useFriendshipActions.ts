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

export interface FriendshipActions {
  sendFriendRequest: (receiverId: number) => Promise<void>;
  acceptFriendRequest: (requestId: number) => Promise<void>;
  rejectFriendRequest: (requestId: number) => Promise<void>;
  deleteFriend: (friendId: number) => Promise<void>;
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
    async (receiverId: number) => {
      await sendMutation.mutateAsync({ receiverId });
    },
    [sendMutation],
  );

  const acceptFriendRequest = useCallback(
    async (requestId: number) => {
      await acceptMutation.mutateAsync({ requestId });
    },
    [acceptMutation],
  );

  const rejectFriendRequest = useCallback(
    async (requestId: number) => {
      await rejectMutation.mutateAsync({ requestId });
    },
    [rejectMutation],
  );

  const deleteFriend = useCallback(
    async (friendId: number) => {
      await deleteMutation.mutateAsync({ friendId });
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
