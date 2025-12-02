"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { useDeleteMyAccount, useMyProfile, useUpdateProfile, useUploadProfileImage } from "@/global/api/useMemberQuery";
import { COUNTRY_OPTIONS, getCountryLabel } from "@/global/lib/countries";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MemberProfileUpdateReq } from "@/global/types/member.types";
import { ProfileSummaryHeader } from "./_components/ProfileSummaryHeader";

interface UserProfile {
  memberId: number | null;
  name: string;
  nickname: string;
  email: string;
  countryCode: string;
  countryName: string;
  level: string;
  description: string;
  interests: string[];
  profileImageUrl?: string;
}

type ProfileEditFormState = Omit<MemberProfileUpdateReq, "country"> & {
  country: string;
  email?: string;
  level?: MemberProfileUpdateReq["englishLevel"];
};

const DEFAULT_EDIT_FORM: ProfileEditFormState = {
  name: "",
  country: "",
  nickname: "",
  englishLevel: "BEGINNER",
  interests: [],
  description: "",
  email: "",
  level: "BEGINNER",
};

const ENGLISH_LEVEL_OPTIONS: MemberProfileUpdateReq["englishLevel"][] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "NATIVE",
];

const ENGLISH_LEVEL_LABELS: Record<MemberProfileUpdateReq["englishLevel"], string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  NATIVE: "Native",
};

interface Friend {
  id: number;
  name: string;
  country: string;
  isOnline: boolean;
  lastSeen: Date;
  level: string;
  avatar?: string;
}

const MAX_PROFILE_IMAGE_SIZE = 3 * 1024 * 1024;
const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/pjpeg",
];
const SUPPORTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const buildVersionedImageUrl = (url?: string | null, version?: number) => {
  if (!url) {
    return undefined;
  }

  if (!version) {
    return url;
  }

  const [base, queryString = ""] = url.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("v", String(version));
  const nextQuery = params.toString();
  return nextQuery ? `${base}?${nextQuery}` : base;
};

const isSupportedImageFile = (file: File) => {
  if (file.type && SUPPORTED_IMAGE_MIME_TYPES.includes(file.type)) {
    return true;
  }

  if (!file.type || file.type === "application/octet-stream") {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension) {
      return false;
    }
    return SUPPORTED_IMAGE_EXTENSIONS.includes(extension);
  }

  return false;
};

export default function ProfilePage() {
  const router = useRouter();
  const accessToken = useLoginStore((state) => state.accessToken);
  const hasHydrated = useLoginStore((state) => state.hasHydrated);
  const clearAccessToken = useLoginStore((state) => state.clearAccessToken);
  const accountEmail = useLoginStore((state) => state.accountEmail ?? "");
  const [profile, setProfile] = useState<UserProfile>({
    memberId: null,
    name: "",
    nickname: "",
    email: accountEmail,
    countryCode: "",
    countryName: "",
    level: "BEGINNER",
    description: "",
    interests: [],
    profileImageUrl: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProfileEditFormState>(DEFAULT_EDIT_FORM);
  const [interestDraft, setInterestDraft] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const { data: profileData, isLoading, error } = useMyProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadProfileImageMutation = useUploadProfileImage();
  const deleteAccountMutation = useDeleteMyAccount();
  const isSaving = updateProfileMutation.isPending;
  const isUploadingAvatar = uploadProfileImageMutation.isPending;
  const isDeletingAccount = deleteAccountMutation.isPending;

  const syncFormWithProfile = useCallback(
    (source?: ReturnType<typeof useMyProfile>["data"]) => {
      const base = source ?? profileData;
      if (!base) {
        setEditForm(DEFAULT_EDIT_FORM);
        setInterestDraft("");
        return;
      }

      const englishLevel = base.englishLevel ?? "BEGINNER";
      const legacyInterests = Array.isArray((base as { interest?: unknown }).interest)
        ? ((base as { interest?: string[] }).interest ?? [])
        : undefined;
      const interests = legacyInterests ?? base.interests ?? [];

      setEditForm({
        name: base.name ?? "",
        nickname: base.nickname ?? "",
        country: (base.country ?? base.countryCode ?? "").toUpperCase(),
        englishLevel,
        level: englishLevel,
        interests,
        description: base.description ?? "",
        email: base.email ?? accountEmail ?? "",
      });
      setInterestDraft(interests.join(", "));
    },
    [profileData, accountEmail]
  );

  const handleSave = () => {
    const trimmedName = editForm.name.trim();
    const trimmedNickname = editForm.nickname.trim();
    const trimmedDescription = editForm.description.trim();
    const sanitisedInterests = interestDraft
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (!trimmedName || !trimmedNickname || !trimmedDescription) {
      alert("이름, 닉네임, 자기소개는 필수 입력 항목입니다.");
      return;
    }

    if (sanitisedInterests.length === 0) {
      alert("관심사를 최소 1개 이상 입력해주세요.");
      return;
    }

    const countryCode = (editForm.country ?? "").trim().toUpperCase();

    if (!countryCode) {
      alert("국가를 선택해주세요.");
      return;
    }

    const payload: MemberProfileUpdateReq = {
      name: trimmedName,
      nickname: trimmedNickname,
      country: countryCode as MemberProfileUpdateReq["country"],
      englishLevel: editForm.englishLevel ?? editForm.level ?? "BEGINNER",
      interests: sanitisedInterests,
      description: trimmedDescription,
    };

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setIsEditing(false);
      },
      onError: (mutationError) => {
        alert(mutationError.message);
      },
    });
  };

  const handleCancel = () => {
    syncFormWithProfile();
    setIsEditing(false);
  };

  const handleAvatarButtonClick = () => {
    if (isUploadingAvatar) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      input.value = "";
      return;
    }

    if (!isSupportedImageFile(file)) {
      alert("이미지 파일(jpg, jpeg, png, webp)만 업로드할 수 있습니다.");
      input.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      alert("이미지 파일은 최대 3MB까지 업로드할 수 있습니다.");
      input.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(previewUrl);

    uploadProfileImageMutation.mutate(file, {
      onSuccess: (uploadedUrl) => {
        if (uploadedUrl) {
          setProfile((prev) => ({
            ...prev,
            profileImageUrl: uploadedUrl,
          }));
          setAvatarPreviewUrl(null);
        }
        setAvatarVersion(Date.now());
      },
      onError: (mutationError) => {
        alert(mutationError.message);
        setAvatarPreviewUrl(null);
      },
      onSettled: () => {
        input.value = "";
      },
    });
  };

  useEffect(() => {
    const previousPreview = previewUrlRef.current;
    if (previousPreview && previousPreview !== avatarPreviewUrl) {
      URL.revokeObjectURL(previousPreview);
    }

    previewUrlRef.current = avatarPreviewUrl;
  }, [avatarPreviewUrl]);

  useEffect(() => {
    return () => {
      const preview = previewUrlRef.current;
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

  const handleDeleteAccount = () => {
    if (isDeletingAccount) {
      return;
    }

    const confirmed = window.confirm(
      "정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    );
    if (!confirmed) {
      return;
    }

    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        alert("계정이 삭제되었습니다. 다시 이용하려면 새로 가입해주세요.");
        clearAccessToken();
        router.replace("/auth/login");
      },
      onError: (mutationError) => {
        alert(mutationError.message);
      },
    });
  };

  useEffect(() => {
    if (!profileData) {
      return;
    }

    const englishLevel = profileData.englishLevel ?? "BEGINNER";
    const levelLabel = ENGLISH_LEVEL_LABELS[
      englishLevel as MemberProfileUpdateReq["englishLevel"]
    ] ?? englishLevel;
    const legacyInterests = Array.isArray((profileData as { interest?: unknown }).interest)
      ? ((profileData as { interest?: string[] }).interest ?? [])
      : undefined;
    const interests = (legacyInterests ?? profileData.interests ?? [])
      .map((item) => item?.trim?.() ?? String(item ?? "").trim())
      .filter((item) => item.length > 0);
    const countryCodeRaw = profileData.country ?? "";
    const countryCode = countryCodeRaw ? countryCodeRaw.toUpperCase() : "";
    const countryName = profileData.countryName ?? getCountryLabel(countryCode);

    setProfile({
      memberId: profileData.memberId ?? profileData.id ?? null,
      name: profileData.name ?? "",
      nickname: profileData.nickname ?? "",
      email: profileData.email ?? accountEmail ?? "",
      countryCode,
      countryName,
      level: levelLabel,
      description: profileData.description ?? "",
      interests,
      profileImageUrl: profileData.profileImageUrl ?? "",
    });

    if (!isEditing) {
      syncFormWithProfile(profileData);
    }
    if (avatarPreviewUrl && profileData.profileImageUrl) {
      setAvatarPreviewUrl(null);
    }
  }, [profileData, isEditing, syncFormWithProfile, avatarPreviewUrl, accountEmail]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!accessToken) {
      router.replace("/auth/login");
    }
  }, [accessToken, hasHydrated, router]);

  if (!hasHydrated) {
    return null;
  }

  if (!accessToken) {
    return null;
  }

  const displayProfileImageUrl = avatarPreviewUrl ?? buildVersionedImageUrl(
    profile.profileImageUrl,
    avatarVersion,
  );
  const resolvedEmail = profile.email || editForm.email || accountEmail || "";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-white">My Profile</h1>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-600 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                Profile Information
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <ProfileSummaryHeader
                imageUrl={displayProfileImageUrl}
                imageAlt={`${profile.nickname || profile.name} profile`}
                fallbackName={profile.nickname || profile.name}
                nickname={profile.nickname || "-"}
                name={profile.name}
                memberId={profile.memberId}
                onClickChangeAvatar={handleAvatarButtonClick}
                changeButtonDisabled={isUploadingAvatar}
                isUploadingAvatar={isUploadingAvatar}
              >
                {resolvedEmail && (
                  <p className="text-xs text-gray-400">{resolvedEmail}</p>
                )}
              </ProfileSummaryHeader>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
                disabled={isUploadingAvatar}
                aria-hidden="true"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-200">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nickname
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nickname: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-200">{profile.nickname || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      value={editForm.email ?? accountEmail ?? ""}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-400 rounded-lg cursor-not-allowed"
                      aria-readonly="true"
                    />
                    <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
                  </>
                ) : (
                  <p className="text-gray-200">
                    {resolvedEmail || "등록된 이메일이 없습니다."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  About Me
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-gray-200 whitespace-pre-line">
                    {profile.description || "소개가 아직 등록되지 않았습니다."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Country
                </label>
                {isEditing ? (
                  <select
                    value={editForm.country}
                    onChange={(e) =>
                      setEditForm({ ...editForm, country: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-200">
                    {profile.countryName || getCountryLabel(profile.countryCode) || "-"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  English Level
                </label>
                {isEditing ? (
                  <select
                    value={editForm.englishLevel ?? "BEGINNER"}
                    onChange={(e) => {
                      const nextLevel = e.target.value as MemberProfileUpdateReq["englishLevel"];
                      setEditForm({
                        ...editForm,
                        englishLevel: nextLevel,
                        level: nextLevel,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ENGLISH_LEVEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {ENGLISH_LEVEL_LABELS[option]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-200">{profile.level}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Interests
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={interestDraft}
                      onChange={(e) => setInterestDraft(e.target.value)}
                      placeholder="예: 영화 감상, 러닝, 여행"
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      복수의 관심사는 콤마(,)로 구분해서 입력해주세요.
                    </p>
                  </div>
                ) : profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span
                        key={`${interest}-${index}`}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">등록된 관심사가 없습니다.</p>
                )}
              </div>

              <div className="mt-8 border-t border-gray-700 pt-6">
                <h3 className="text-sm font-semibold text-red-400 mb-2">
                  위험 구역
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  계정을 삭제하면 채팅 기록과 설정이 복구 없이 제거됩니다.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeletingAccount ? "삭제 중..." : "계정 삭제"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
