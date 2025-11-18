import apiClient from "@/global/backend/client";
import type { paths } from "@/global/backend/schema";
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

const normaliseProfile = (payload: unknown): MemberProfile => {
    const profile = (payload ?? {}) as Record<string, any>;
    const interest = Array.isArray(profile.interest)
        ? profile.interest
        : typeof profile.interest === "string"
            ? profile.interest.split(",").map((item: string) => item.trim()).filter(Boolean)
            : Array.isArray(profile.interests)
                ? profile.interests
                : [];

    return {
        name: profile.name ?? "",
        nickname: profile.nickname ?? "",
        country: profile.country ?? "",
        englishLevel: (profile.englishLevel ?? "BEGINNER") as MemberProfile["englishLevel"],
        interest,
        description: profile.description ?? "",
        email: profile.email ?? "",
        id: profile.id ?? profile.memberId,
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

const updateMyProfile = async (payload: MemberProfileUpdateReq) => {
    const { error } = await apiClient.PUT("/api/v1/members/profile", {
        body: payload as paths["/api/v1/members/profile"]["put"]["requestBody"]["content"]["application/json"],
    });

    if (error) {
        throw new Error(getApiErrorMessage(error, "프로필 정보를 수정하지 못했습니다."));
    }
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
