"use client";

import { ReactNode } from "react";

import { useLanguage } from "@/contexts/LanguageContext";

interface ProfileSummaryHeaderProps {
    imageUrl?: string | null;
    imageAlt?: string;
    fallbackName?: string;
    nickname?: string;
    name?: string;
    memberId?: number | null;
    onClickChangeAvatar?: () => void;
    changeButtonDisabled?: boolean;
    changeButtonText?: string;
    isUploadingAvatar?: boolean;
    uploadingIndicatorText?: string;
    className?: string;
    children?: ReactNode;
}

const baseClassName = "flex items-center gap-4";

const combineClassName = (className?: string) => {
    if (!className) {
        return baseClassName;
    }
    return `${baseClassName} ${className}`;
};

const resolveFallbackInitial = (source?: string) => {
    if (!source) {
        return "?";
    }
    const trimmed = source.trim();
    if (!trimmed) {
        return "?";
    }
    return trimmed.charAt(0).toUpperCase();
};

export function ProfileSummaryHeader({
    imageUrl,
    imageAlt,
    fallbackName,
    nickname,
    name,
    memberId,
    onClickChangeAvatar,
    changeButtonDisabled,
    changeButtonText,
    isUploadingAvatar,
    uploadingIndicatorText,
    className,
    children,
}: ProfileSummaryHeaderProps) {
    const { t } = useLanguage();
    const displayImageUrl = imageUrl && imageUrl.length > 0 ? imageUrl : undefined;
    const fallbackInitial = resolveFallbackInitial(fallbackName);
    const resolvedImageAlt = imageAlt ?? t("profile.info.avatar.alt", {
        name: fallbackName ?? nickname ?? name ?? t("profile.info.labels.name"),
    });
    const resolvedChangeButtonText = changeButtonText ?? t("profile.info.actions.changeAvatar");
    const resolvedUploadingText = uploadingIndicatorText ?? t("profile.info.actions.uploading");

    return (
        <div className={combineClassName(className)} data-member-id={memberId ?? undefined}>
            <div
                className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] flex items-center justify-center text-2xl font-semibold"
                style={{ color: "var(--page-text)" }}
            >
                {displayImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayImageUrl} alt={resolvedImageAlt} className="w-full h-full object-cover" />
                ) : (
                    <span>{fallbackInitial}</span>
                )}
                {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-[var(--surface-overlay)] flex items-center justify-center text-xs text-white">
                        {resolvedUploadingText}
                    </div>
                )}
            </div>
            <div className="space-y-1">
                {nickname && (
                    <p className="text-base font-semibold" style={{ color: "var(--page-text)" }}>{nickname}</p>
                )}
                {name && (
                    <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{name}</p>
                )}
                {children}
                {onClickChangeAvatar && (
                    <button
                        type="button"
                        onClick={onClickChangeAvatar}
                        disabled={changeButtonDisabled}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel-muted)] px-3 py-1.5 text-xs font-medium text-[var(--page-text)] transition-colors hover:border-emerald-400 hover:text-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2.586a1 1 0 01-.707-.293l-.414-.414A2 2 0 0011.586 1H8.414a2 2 0 00-1.414.586l-.414.414A1 1 0 015.879 3H4zm6 4a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        {resolvedChangeButtonText}
                    </button>
                )}
            </div>
        </div>
    );
}
