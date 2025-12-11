"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useDeleteMyAccount, useUpdateProfile, useUploadProfileImage } from "@/global/api/useMemberQuery";
import { COUNTRY_OPTIONS, getCountryLabel } from "@/global/lib/countries";
import { useLoginStore } from "@/global/stores/useLoginStore";
import { MemberProfileUpdateReq } from "@/global/types/member.types";
import { ProfileSummaryHeader } from "./ProfileSummaryHeader";
import { useProfileTabs } from "./ProfileTabsProvider";

interface UserProfile {
  memberId: number | null;
  name: string;
  nickname: string;
  email: string;
  countryCode: string;
  countryName: string;
  level: MemberProfileUpdateReq["englishLevel"];
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

const ENGLISH_LEVEL_LABEL_KEYS: Record<MemberProfileUpdateReq["englishLevel"], string> = {
  BEGINNER: "profile.info.englishLevels.BEGINNER",
  INTERMEDIATE: "profile.info.englishLevels.INTERMEDIATE",
  ADVANCED: "profile.info.englishLevels.ADVANCED",
  NATIVE: "profile.info.englishLevels.NATIVE",
};

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

export function ProfileInfoPanel() {
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

  const { profileQuery } = useProfileTabs();
  const { data: profileData, isLoading, error } = profileQuery;
  const updateProfileMutation = useUpdateProfile();
  const uploadProfileImageMutation = useUploadProfileImage();
  const deleteAccountMutation = useDeleteMyAccount();
  const isSaving = updateProfileMutation.isPending;
  const isUploadingAvatar = uploadProfileImageMutation.isPending;
  const isDeletingAccount = deleteAccountMutation.isPending;
  const { t } = useLanguage();

  const syncFormWithProfile = useCallback(
    (source?: typeof profileData) => {
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
    [profileData, accountEmail],
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
      alert(t("profile.info.alerts.requiredFields"));
      return;
    }

    if (sanitisedInterests.length === 0) {
      alert(t("profile.info.alerts.interestsRequired"));
      return;
    }

    const countryCode = (editForm.country ?? "").trim().toUpperCase();

    if (!countryCode) {
      alert(t("profile.info.alerts.countryRequired"));
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
      alert(t("profile.info.alerts.unsupportedImage"));
      input.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      alert(t("profile.info.alerts.imageTooLarge"));
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

    const confirmed = window.confirm(t("profile.info.alerts.deleteConfirm"));
    if (!confirmed) {
      return;
    }

    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        alert(t("profile.info.alerts.deleteSuccess"));
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
    const legacyInterests = Array.isArray((profileData as { interest?: unknown }).interest)
      ? ((profileData as { interest?: string[] }).interest ?? [])
      : undefined;
    const interests = (legacyInterests ?? profileData.interests ?? [])
      .map((item: any) => item?.trim?.() ?? String(item ?? "").trim())
      .filter((item: string) => item.length > 0);
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
      level: englishLevel as MemberProfileUpdateReq["englishLevel"],
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
    <div className="grid grid-cols-1 gap-8 text-[var(--page-text)]">
      <div>
        <div className="theme-card rounded-3xl p-6">
          <div className="flex flex-wrap justify-between gap-4 items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: "var(--page-text)" }}>{t("profile.info.sectionTitle")}</h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400"
              >
                {t("profile.info.actions.edit")}
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-2xl bg-emerald-500 px-4 py-2 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? t("profile.info.actions.saving") : t("profile.info.actions.save")}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] px-4 py-2 font-semibold text-[var(--page-text)] transition-colors hover:border-emerald-300"
                >
                  {t("profile.info.actions.cancel")}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ProfileSummaryHeader
              imageUrl={displayProfileImageUrl}
              imageAlt={t("profile.info.avatar.alt", {
                name: profile.nickname || profile.name || t("profile.info.labels.name"),
              })}
              fallbackName={profile.nickname || profile.name}
              nickname={profile.nickname || "-"}
              name={profile.name}
              memberId={profile.memberId}
              onClickChangeAvatar={handleAvatarButtonClick}
              changeButtonDisabled={isUploadingAvatar}
              isUploadingAvatar={isUploadingAvatar}
            >
              {resolvedEmail && <p className="text-xs" style={{ color: "var(--surface-muted-text)" }}>{resolvedEmail}</p>}
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
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--page-text)" }}>
                {t("profile.info.labels.name")}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-[var(--page-text)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                />
              ) : (
                <p>{profile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--page-text)" }}>
                {t("profile.info.labels.nickname")}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-[var(--page-text)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                />
              ) : (
                <p>{profile.nickname || "-"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--page-text)" }}>
                {t("profile.info.labels.email")}
              </label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    value={editForm.email ?? accountEmail ?? ""}
                    readOnly
                    disabled
                    className="w-full rounded-2xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-panel-muted)] px-4 py-3 text-[var(--surface-muted-text)] cursor-not-allowed"
                    aria-readonly="true"
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--surface-muted-text)" }}>{t("profile.info.notes.emailReadOnly")}</p>
                </>
              ) : (
                <p>{resolvedEmail || t("profile.info.notes.emailMissing")}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--page-text)" }}>
                {t("profile.info.labels.about")}
              </label>
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-[var(--page-text)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                />
              ) : (
                <p className="whitespace-pre-line" style={{ color: "var(--page-text)" }}>
                  {profile.description || t("profile.info.messages.descriptionEmpty")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--page-text)" }}>
                {t("profile.info.labels.country")}
              </label>
              {isEditing ? (
                <select
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-[var(--page-text)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  <option value="">{t("profile.info.placeholders.country")}</option>
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p>
                  {profile.countryName || getCountryLabel(profile.countryCode) || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--page-text)" }}>
                {t("profile.info.labels.englishLevel")}
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
                  className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-[var(--page-text)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  {ENGLISH_LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t(ENGLISH_LEVEL_LABEL_KEYS[option])}
                    </option>
                  ))}
                </select>
              ) : (
                <p>
                  {t(ENGLISH_LEVEL_LABEL_KEYS[profile.level])}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--page-text)" }}>
                {t("profile.info.labels.interests")}
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={interestDraft}
                    onChange={(e) => setInterestDraft(e.target.value)}
                    placeholder={t("profile.info.placeholders.interests")}
                    className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-[var(--page-text)] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--surface-muted-text)" }}>{t("profile.info.helpers.interests")}</p>
                </div>
              ) : profile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={`${interest}-${index}`}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "var(--surface-panel-muted)",
                        color: "var(--page-text)",
                        border: "1px solid var(--surface-border)",
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t("profile.info.messages.interestsEmpty")}</p>
              )}
            </div>

            <div className="mt-8 border-t border-[var(--surface-border)] pt-6">
              <h3 className="text-sm font-semibold text-red-500 mb-2">{t("profile.info.danger.title")}</h3>
              <p className="text-sm mb-4" style={{ color: "var(--surface-muted-text)" }}>{t("profile.info.danger.description")}</p>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-2xl border border-red-500/40 bg-[var(--surface-panel-muted)] text-red-400 font-semibold transition-colors hover:border-red-500/70 hover:bg-red-500/5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeletingAccount
                  ? t("profile.info.danger.deleting")
                  : t("profile.info.danger.delete")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
