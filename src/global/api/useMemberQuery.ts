import apiClient from "@/global/backend/client";
import type { paths } from "@/global/backend/schema";
import { API_BASE_URL } from "@/global/consts";
import { normaliseCountryValue } from "@/global/lib/countries";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MemberPresenceSummaryResp } from "@/global/types/auth.types";
import { FriendDetail, FriendSummary, MemberProfile, MemberProfileUpdateReq } from "@/global/types/member.types";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type PaginatedListPage<T> = {
    items: T[];
    totalPages: number | null;
    totalElements: number | null;
    pageIndex: number;
    pageSize: number;
    isFirst: boolean;
    isLast: boolean;
};

const createEmptyListPage = <T>(): PaginatedListPage<T> => ({
    items: [],
    totalPages: null,
    totalElements: null,
    pageIndex: 0,
    pageSize: 0,
    isFirst: true,
    isLast: true,
});

type MemberListPage = PaginatedListPage<MemberPresenceSummaryResp>;
type FriendListPage = PaginatedListPage<FriendSummary>;

const normaliseInteger = (value: unknown, fallback: number | null): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
    }

    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    return fallback;
};

const toBooleanOr = (value: unknown, fallback: boolean): boolean => {
    if (typeof value === "boolean") {
        return value;
    }
    return fallback;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return null;
};

const extractItemsArray = <T>(record: Record<string, unknown>): T[] => {
    const candidates = [record.content, record.data, record.items];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate as T[];
        }
    }

    return [];
};

const extractPaginatedPayload = <T>(payload: unknown): PaginatedListPage<T> => {
    if (!payload) {
        return createEmptyListPage<T>();
    }

    const root = asRecord(payload);
    const dataNode = root?.data && asRecord(root.data) ? (root.data as Record<string, unknown>) : root;

    if (!dataNode) {
        return createEmptyListPage<T>();
    }

    const pageableNode = asRecord(dataNode.pageable);
    const items = extractItemsArray<T>(dataNode);
    const sizeCandidate = dataNode.size ?? pageableNode?.pageSize;
    const directPageCandidate = normaliseInteger(
        dataNode.page ?? dataNode.pageNumber ?? pageableNode?.page ?? pageableNode?.pageNumber,
        null,
    );
    const zeroIndexedCandidate =
        normaliseInteger(dataNode.number, null) ?? normaliseInteger(pageableNode?.pageNumber, null);
    const pageCandidate = directPageCandidate ?? zeroIndexedCandidate;

    const size = normaliseInteger(sizeCandidate, items.length) ?? items.length;
    const page = Math.max(pageCandidate ?? 0, 0);
    const totalPages = normaliseInteger(dataNode.totalPages, null);
    const totalElements = normaliseInteger(dataNode.totalElements, null);
    const isFirst = toBooleanOr(dataNode.first, page <= 0);
    const inferredLast = (() => {
        if (typeof dataNode.last === "boolean") {
            return dataNode.last;
        }

        if (typeof totalPages === "number" && totalPages > 0) {
            return page >= totalPages - 1;
        }

        if (size > 0) {
            return items.length < size;
        }

        return items.length === 0;
    })();

    return {
        items,
        totalPages,
        totalElements,
        pageIndex: page,
        pageSize: size,
        isFirst,
        isLast: inferredLast,
    };
};

const unwrapDataNode = <T>(payload: unknown): T => {
    if (payload && typeof payload === "object" && "data" in payload) {
        const dataNode = (payload as { data?: unknown }).data;
        if (dataNode) {
            return dataNode as T;
        }
    }

    return payload as T;
};

type MemberQueryOptions = {
    page?: number;
    size?: number;
    onlineOnly?: boolean;
};

const normalisePageParam = (value: unknown, fallback: number): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(Math.trunc(value), 0);
    }

    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
            return Math.max(parsed, 0);
        }
    }

    return Math.max(fallback, 0);
};

const fetchMembers = async (options?: MemberQueryOptions): Promise<MemberListPage> => {
    const { accessToken } = useLoginStore.getState();
    const page = normalisePageParam(options?.page, 0);
    const size = Math.max(normaliseInteger(options?.size, 20) ?? 20, 1);
    const path = options?.onlineOnly ? "/api/v1/members/online" : "/api/v1/members";
    const url = new URL(path, API_BASE_URL);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));

    const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
    }

    const apiResponse = await response.json();
    return extractPaginatedPayload<MemberPresenceSummaryResp>(apiResponse);
};

const fetchFriends = async (options?: MemberQueryOptions): Promise<FriendListPage> => {
    const { accessToken } = useLoginStore.getState();
    const page = normalisePageParam(options?.page, 0);
    const size = Math.max(normaliseInteger(options?.size, 20) ?? 20, 1);
    const url = new URL("/api/v1/members/friends", API_BASE_URL);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));

    const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch friends: ${response.status}`);
    }

    const apiResponse = await response.json();
    return extractPaginatedPayload<FriendSummary>(apiResponse);
};

const fetchFriendDetail = async (friendId: number): Promise<FriendDetail> => {
    if (!Number.isFinite(friendId)) {
        throw new Error("Invalid friendId");
    }

    const { accessToken } = useLoginStore.getState();
    const url = new URL(`/api/v1/members/friends/${friendId}`, API_BASE_URL);

    const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch friend detail: ${response.status}`);
    }

    const apiResponse = await response.json();
    const detail = unwrapDataNode<FriendDetail>(apiResponse);

    return {
        ...detail,
        interests: Array.isArray(detail.interests) ? detail.interests : [],
        description: typeof detail.description === "string" ? detail.description : "",
        profileImageUrl:
            typeof detail.profileImageUrl === "string" && detail.profileImageUrl.length > 0
                ? detail.profileImageUrl
                : "",
    };
};

export const useMembersQuery = (options?: MemberQueryOptions) => {
    const { accessToken } = useLoginStore();
    const normalisedOptions: Required<Pick<MemberQueryOptions, "page" | "size">> & {
        onlineOnly: boolean;
    } = {
        page: normalisePageParam(options?.page, 0),
        size: Math.max(normaliseInteger(options?.size, 20) ?? 20, 1),
        onlineOnly: Boolean(options?.onlineOnly),
    };

    return useQuery<MemberListPage, Error>({
        queryKey: ["members", normalisedOptions],
        queryFn: () => fetchMembers(normalisedOptions),
        enabled: !!accessToken,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

export const useFriendsQuery = (options?: MemberQueryOptions) => {
    const { accessToken } = useLoginStore();
    const page = normalisePageParam(options?.page, 0);
    const size = Math.max(normaliseInteger(options?.size, 20) ?? 20, 1);

    return useQuery<FriendListPage, Error>({
        queryKey: ["friends", page, size],
        queryFn: () => fetchFriends({ page, size }),
        enabled: !!accessToken,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    });
};

export const useFriendDetailQuery = (friendId?: number) => {
    const { accessToken } = useLoginStore();

    return useQuery<FriendDetail, Error>({
        queryKey: ["friend-detail", friendId],
        queryFn: () => {
            if (typeof friendId !== "number") {
                throw new Error("friendId is required");
            }
            return fetchFriendDetail(friendId);
        },
        enabled: !!accessToken && typeof friendId === "number",
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
