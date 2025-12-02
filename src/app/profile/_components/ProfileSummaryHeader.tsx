import { ReactNode } from "react";

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
    changeButtonText = "프로필 사진 변경",
    isUploadingAvatar,
    uploadingIndicatorText = "업로드 중...",
    className,
    children,
}: ProfileSummaryHeaderProps) {
    const displayImageUrl = imageUrl && imageUrl.length > 0 ? imageUrl : undefined;
    const fallbackInitial = resolveFallbackInitial(fallbackName);

    return (
        <div className={combineClassName(className)} data-member-id={memberId ?? undefined}>
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-2xl text-gray-300">
                {displayImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayImageUrl} alt={imageAlt ?? fallbackName ?? "User profile"} className="w-full h-full object-cover" />
                ) : (
                    <span>{fallbackInitial}</span>
                )}
                {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white">
                        {uploadingIndicatorText}
                    </div>
                )}
            </div>
            <div className="space-y-1">
                {nickname && (
                    <p className="text-base font-semibold text-white">{nickname}</p>
                )}
                {name && (
                    <p className="text-sm text-gray-300">{name}</p>
                )}
                {children}
                {onClickChangeAvatar && (
                    <button
                        type="button"
                        onClick={onClickChangeAvatar}
                        disabled={changeButtonDisabled}
                        className="mt-2 inline-flex items-center gap-1 rounded-md bg-gray-700 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2.586a1 1 0 01-.707-.293l-.414-.414A2 2 0 0011.586 1H8.414a2 2 0 00-1.414.586l-.414.414A1 1 0 015.879 3H4zm6 4a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        {changeButtonText}
                    </button>
                )}
            </div>
        </div>
    );
}
