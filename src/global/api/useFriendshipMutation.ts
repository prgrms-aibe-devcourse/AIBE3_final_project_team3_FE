import apiClient from "@/global/backend/client";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

const extractStatusCode = (error: unknown): number | null => {
    if (!error || typeof error !== "object") return null;
    const record = error as Record<string, unknown>;
    const candidates: Array<unknown> = [record.status, record.statusCode, record.code];

    const nested = record.error;
    if (nested && typeof nested === "object") {
        const nestedRecord = nested as Record<string, unknown>;
        candidates.push(nestedRecord.status, nestedRecord.statusCode, nestedRecord.code);
    }

    const data = record.data;
    if (data && typeof data === "object") {
        const dataRecord = data as Record<string, unknown>;
        candidates.push(dataRecord.status, dataRecord.statusCode, dataRecord.code);
    }

    for (const candidate of candidates) {
        if (typeof candidate === "number") return candidate;
        if (typeof candidate === "string") {
            const parsed = Number(candidate);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }

    return null;
};

const extractErrorMessage = (error: unknown): string | null => {
    if (!error) return null;
    if (typeof error === "string") return error.trim() || null;
    if (error instanceof Error) return error.message.trim() || null;
    if (typeof error !== "object") return null;

    const record = error as Record<string, unknown>;
    const candidates: Array<unknown> = [record.msg, record.message];

    const nested = record.error;
    if (nested && typeof nested === "object") {
        const nestedRecord = nested as Record<string, unknown>;
        candidates.push(nestedRecord.msg, nestedRecord.message);
    }

    const data = record.data;
    if (data && typeof data === "object") {
        const dataRecord = data as Record<string, unknown>;
        candidates.push(dataRecord.msg, dataRecord.message);
    }

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate;
        }
    }

    return null;
};

const getApiErrorMessage = (
    error: unknown,
    fallback: string,
    options?: { notFoundMessage?: string },
) => {
    const status = extractStatusCode(error);
    if (status === 404 && options?.notFoundMessage) {
        return options.notFoundMessage;
    }

    const extracted = extractErrorMessage(error);
    if (extracted) {
        if (status === 404 && options?.notFoundMessage) {
            return options.notFoundMessage;
        }
        return extracted;
    }

    return fallback;
};

const sendFriendRequest = async (receiverId: number) => {
    const { error } = await apiClient.POST("/api/v1/members/friends", {
        body: { receiverId } as never,
    });

    if (error) {
        throw new Error(
            getApiErrorMessage(
                error,
                "친구 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
            ),
        );
    }
};

const acceptFriendRequest = async (requestId: number) => {
    const { error } = await apiClient.PATCH("/api/v1/members/friends/{requestId}/accept", {
        params: {
            path: {
                requestId,
            },
        },
    });

    if (error) {
        throw new Error(
            getApiErrorMessage(
                error,
                "친구 요청을 수락하지 못했습니다. 잠시 후 다시 시도해 주세요.",
                { notFoundMessage: "본인이 받은 친구 요청만 수락/거절할 수 있습니다." },
            ),
        );
    }
};

const rejectFriendRequest = async (requestId: number) => {
    const { error } = await apiClient.PATCH("/api/v1/members/friends/{requestId}/reject", {
        params: {
            path: {
                requestId,
            },
        },
    });

    if (error) {
        throw new Error(
            getApiErrorMessage(
                error,
                "친구 요청을 거절하지 못했습니다. 잠시 후 다시 시도해 주세요.",
                { notFoundMessage: "본인이 받은 친구 요청만 수락/거절할 수 있습니다." },
            ),
        );
    }
};

const deleteFriend = async (friendId: number) => {
    const { error } = await apiClient.DELETE("/api/v1/members/friends/{friendId}", {
        params: {
            path: {
                friendId,
            },
        },
    });

    if (error) {
        throw new Error(
            getApiErrorMessage(
                error,
                "친구 관계를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
            ),
        );
    }
};

type InvalidateOptions = {
    targetProfileId?: number | null;
    refreshMembers?: boolean;
};

const invalidateFriendshipCaches = (qc: QueryClient, options?: InvalidateOptions) => {
    if (options?.refreshMembers) {
        qc.invalidateQueries({ queryKey: ["members"] });
    }

    qc.invalidateQueries({ queryKey: ["member", "me"] });

    const targetId = options?.targetProfileId;
    if (typeof targetId === "number" && Number.isFinite(targetId)) {
        qc.invalidateQueries({ queryKey: ["member", "profile", targetId] });
        return;
    }

    qc.invalidateQueries({ queryKey: ["member", "profile"] });
};

type SendFriendRequestVariables = {
    receiverId: number;
    targetProfileId?: number | null;
    refreshMembers?: boolean;
};

type FriendRequestDecisionVariables = {
    requestId: number;
    opponentMemberId?: number | null;
    refreshMembers?: boolean;
};

type DeleteFriendVariables = {
    friendId: number;
    opponentMemberId?: number | null;
    refreshMembers?: boolean;
};

export const useSendFriendRequest = () => {
    const qc = useQueryClient();

    return useMutation<void, Error, SendFriendRequestVariables>({
        mutationFn: ({ receiverId }) => sendFriendRequest(receiverId),
        onSuccess: (_data, variables) => {
            invalidateFriendshipCaches(qc, {
                targetProfileId: variables.targetProfileId ?? variables.receiverId,
                refreshMembers: variables.refreshMembers,
            });
        },
    });
};

export const useAcceptFriendRequest = () => {
    const qc = useQueryClient();

    return useMutation<void, Error, FriendRequestDecisionVariables>({
        mutationFn: ({ requestId }) => acceptFriendRequest(requestId),
        onSuccess: (_data, variables) => {
            invalidateFriendshipCaches(qc, {
                targetProfileId: variables.opponentMemberId,
                refreshMembers: variables.refreshMembers,
            });
        },
    });
};

export const useRejectFriendRequest = () => {
    const qc = useQueryClient();

    return useMutation<void, Error, FriendRequestDecisionVariables>({
        mutationFn: ({ requestId }) => rejectFriendRequest(requestId),
        onSuccess: (_data, variables) => {
            invalidateFriendshipCaches(qc, {
                targetProfileId: variables.opponentMemberId,
                refreshMembers: variables.refreshMembers,
            });
        },
    });
};

export const useDeleteFriend = () => {
    const qc = useQueryClient();

    return useMutation<void, Error, DeleteFriendVariables>({
        mutationFn: ({ friendId }) => deleteFriend(friendId),
        onSuccess: (_data, variables) => {
            invalidateFriendshipCaches(qc, {
                targetProfileId: variables.opponentMemberId ?? variables.friendId,
                refreshMembers: variables.refreshMembers,
            });
        },
    });
};
