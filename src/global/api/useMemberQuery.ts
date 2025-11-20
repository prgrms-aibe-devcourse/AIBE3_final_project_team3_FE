import apiClient from "@/global/backend/client";
import type { paths } from "@/global/backend/schema";
import { normaliseCountryValue } from "@/global/lib/countries";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MemberSummaryResp } from "@/global/types/auth.types";
import { MemberProfile, MemberProfileUpdateReq } from "@/global/types/member.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const fetchAllMembers = async (): Promise<MemberSummaryResp[]> => {
    const { data: apiResponse, error } = await apiClient.GET("/api/v1/members");

    if (error) {
        throw new Error(JSON.stringify(error));
    }

    const payload = (apiResponse ?? {}) as { data?: MemberSummaryResp[] };
    return payload.data ?? [];
};

export const useMembersQuery = () => {
    const { accessToken } = useLoginStore();

    return useQuery<MemberSummaryResp[], Error>({
        queryKey: ["members"],
        queryFn: fetchAllMembers,
        enabled: !!accessToken,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === "object" && "msg" in error && typeof (error as { msg?: unknown }).msg === "string") {
        return (error as { msg: string }).msg;
    }
    return fallback;
};

const normaliseNumericId = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    return undefined;
};

const pickFirstNumericId = (values: unknown[]): number | undefined => {
    for (const value of values) {
        const id = normaliseNumericId(value);
        if (typeof id === "number") {
            return id;
        }
    }
    return undefined;
};

const normaliseProfile = (payload: unknown): MemberProfile => {
    const profile = (payload ?? {}) as Record<string, any>;

    const resolveInterests = (): string[] => {
        const candidates = [profile.interests, profile.interest];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }

            if (typeof candidate === "string") {
                return candidate
                    .split(",")
                    .map((item) => item.trim())
                    .filter((item) => item.length > 0);
            }
        }

        return [];
    };

    const resolveEnglishLevel = (): MemberProfile["englishLevel"] => {
        const level = profile.englishLevel;

        if (typeof level === "string" && level.length > 0) {
            return level as MemberProfile["englishLevel"];
        }

        if (typeof level === "object" && level) {
            const levelRecord = level as Record<string, unknown>;
            const value = levelRecord.name ?? levelRecord.value ?? levelRecord.code;
            if (typeof value === "string" && value.length > 0) {
                return value as MemberProfile["englishLevel"];
            }
        }

        return "BEGINNER";
    };

    const interests = resolveInterests()
        .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
        .filter((item) => item.length > 0);

    const { code: countryCode, name: countryName } = normaliseCountryValue(profile.country);

    const friendRequestSentFlag = Boolean(
        profile.isFriendRequestSent ??
            profile.friendRequestSent ??
            profile.isPendingFriendRequestFromMe,
    );

    const receivedFriendRequestId = normaliseNumericId(
        profile.receivedFriendRequestId ??
            profile.pendingFriendRequestIdFromOpponent ??
            profile.friendRequestId ??
            profile.pendingFriendRequestId,
    );

    const pendingFromMeCandidates = [
        profile.pendingFriendRequestIdFromMe,
        profile.friendRequestIdFromMe,
        profile.pendingRequestIdFromMe,
        profile.friendRequestId,
        profile.pendingFriendRequestId,
    ];

    const pendingFromOpponentCandidates = [
        receivedFriendRequestId,
        profile.pendingFriendRequestIdFromOpponent,
        profile.friendRequestIdFromOpponent,
        profile.pendingRequestIdFromOpponent,
        profile.friendRequestId,
        profile.pendingFriendRequestId,
    ];

    let pendingFriendRequestIdFromMe = pickFirstNumericId(pendingFromMeCandidates);
    let pendingFriendRequestIdFromOpponent = pickFirstNumericId(pendingFromOpponentCandidates);
    const sharedPendingId = normaliseNumericId(profile.friendRequestId ?? profile.pendingFriendRequestId);

    if (!pendingFriendRequestIdFromMe && sharedPendingId && friendRequestSentFlag) {
        pendingFriendRequestIdFromMe = sharedPendingId;
    }

    const isPendingFriendRequestFromOpponent =
        typeof receivedFriendRequestId === "number"
            ? true
            : Boolean(profile.isPendingFriendRequestFromOpponent);

    if (!pendingFriendRequestIdFromOpponent && sharedPendingId && isPendingFriendRequestFromOpponent) {
        pendingFriendRequestIdFromOpponent = sharedPendingId;
    }

    const friendshipId = pickFirstNumericId([
        profile.friendshipId,
        profile.friendRelationId,
        profile.friendId,
        profile.friendMemberId,
    ]);

    return {
        name: profile.name ?? "",
        nickname: profile.nickname ?? "",
        country: countryCode,
        countryCode,
        countryName,
        englishLevel: resolveEnglishLevel(),
        interest: interests,
        interests,
        description: profile.description ?? "",
        email: profile.email ?? "",
        memberId: profile.memberId ?? profile.id,
        id: profile.id ?? profile.memberId,
        profileImageUrl: typeof profile.profileImageUrl === "string" ? profile.profileImageUrl : undefined,
        isFriend: Boolean(profile.isFriend),
        isPendingRequest: Boolean(profile.isPendingRequest),
        isPendingFriendRequestFromMe: friendRequestSentFlag,
        isPendingFriendRequestFromOpponent,
        isFriendRequestSent: friendRequestSentFlag,
        receivedFriendRequestId: receivedFriendRequestId ?? null,
        pendingFriendRequestIdFromMe,
        pendingFriendRequestIdFromOpponent,
        friendshipId,
        joinedAt: profile.joinedAt ?? profile.createdAt ?? profile.joinDate,
        totalChats: profile.totalChats ?? profile.chatCount,
        vocabularyLearned: profile.vocabularyLearned,
        streak: profile.streak,
    } as MemberProfile;
};

const fetchMyProfile = async (): Promise<MemberProfile> => {
    const { data, error } = await apiClient.GET("/api/v1/members/me", {});

    if (error) {
        throw new Error(getApiErrorMessage(error, "프로필 정보를 불러오지 못했습니다."));
    }

    const payload = (data ?? {}) as { data?: unknown };
    return normaliseProfile(payload.data);
};

export const useMyProfile = () => {
    const { accessToken } = useLoginStore();

    return useQuery<MemberProfile, Error>({
        queryKey: ["member", "me"],
        queryFn: fetchMyProfile,
        enabled: !!accessToken,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

const fetchMemberProfile = async (memberId: number): Promise<MemberProfile> => {
    const { data, error } = await apiClient.GET("/api/v1/members/{id}", {
        params: {
            path: {
                id: memberId,
            },
        },
    });

    if (error) {
        throw new Error(getApiErrorMessage(error, "회원 정보를 불러오지 못했습니다."));
    }

    const payload = (data ?? {}) as { data?: unknown };
    return normaliseProfile(payload.data);
};

export const useMemberProfileQuery = (memberId?: number | null) => {
    const enabled = typeof memberId === "number" && Number.isFinite(memberId) && memberId > 0;

    return useQuery<MemberProfile, Error>({
        queryKey: ["member", "profile", memberId],
        queryFn: () => fetchMemberProfile(memberId as number),
        enabled,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

const updateMyProfile = async (payload: MemberProfileUpdateReq) => {
    const { error } = await apiClient.PUT("/api/v1/members/profile", {
        body: payload as paths["/api/v1/members/profile"]["put"]["requestBody"]["content"]["application/json"],
    });

    if (error) {
        throw new Error(getApiErrorMessage(error, "프로필 정보를 수정하지 못했습니다."));
    }
};

const extractProfileImageUrl = (payload: unknown): string | null => {
    if (!payload) {
        return null;
    }

    if (typeof payload === "string") {
        return payload;
    }

    if (typeof payload !== "object") {
        return null;
    }

    const record = payload as Record<string, unknown>;
    const candidateKeys = ["profileImageUrl", "url", "imageUrl"] as const;

    for (const key of candidateKeys) {
        const value = record[key];
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
    }

    const dataField = record.data;

    if (typeof dataField === "string" && dataField.length > 0) {
        return dataField;
    }

    if (dataField && typeof dataField === "object") {
        const nested = dataField as Record<string, unknown>;
        for (const key of candidateKeys) {
            const value = nested[key];
            if (typeof value === "string" && value.length > 0) {
                return value;
            }
        }
    }

    return null;
};

const uploadProfileImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("multipartFile", file);

    const { data, error } = await apiClient.PUT("/api/v1/members/profile/image", {
        body: formData as never,
    });

    if (error) {
        throw new Error(getApiErrorMessage(error, "프로필 이미지를 업로드하지 못했습니다."));
    }

    return extractProfileImageUrl(data);
};

export const useUpdateProfile = () => {
    const qc = useQueryClient();

    return useMutation<void, Error, MemberProfileUpdateReq>({
        mutationFn: updateMyProfile,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["member", "me"] });
        },
    });
};

export const useUploadProfileImage = () => {
    const qc = useQueryClient();

    return useMutation<string | null, Error, File>({
        mutationFn: uploadProfileImage,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["member", "me"] });
        },
    });
};
