import { useLanguage } from "@/contexts/LanguageContext";
import { AiChatRoomType } from "@/global/types/chat.types";
import { X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { findAiRoomTypeOption, formatAiRoomTypeLabel } from "../constants/aiRoomTypes";
import { AIScenario, formatRolePlayTypeLabel } from "../constants/aiSituations";

interface AICreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRoomType: AiChatRoomType | null;
    selectedPrompt: AIScenario | null;
    onSubmit: (roomName: string) => void;
    isSubmitting?: boolean;
}

const AICreateRoomModal: React.FC<AICreateRoomModalProps> = ({
    isOpen,
    onClose,
    selectedRoomType,
    selectedPrompt,
    onSubmit,
    isSubmitting,
}) => {
    const { t } = useLanguage();
    const [roomName, setRoomName] = useState("");

    useEffect(() => {
        if (selectedPrompt?.title) {
            setRoomName((prev) => (prev ? prev : selectedPrompt.title));
        } else {
            setRoomName("");
        }
    }, [selectedPrompt]);

    const typeOption = useMemo(() => findAiRoomTypeOption(selectedRoomType), [selectedRoomType]);
    const rolePlayLabel = useMemo(
        () => formatRolePlayTypeLabel(selectedPrompt?.rolePlayType ?? null, t),
        [selectedPrompt, t]
    );

    if (!isOpen) return null;

    const isReady = Boolean(roomName.trim()) && Boolean(selectedRoomType) && Boolean(selectedPrompt);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isReady || isSubmitting) {
            return;
        }
        onSubmit(roomName.trim());
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "var(--surface-overlay)" }}
        >
            <div className="theme-card rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-emerald-400 text-sm font-semibold">
                                {formatAiRoomTypeLabel(selectedRoomType, t)}
                            </p>
                            <h2 className="text-2xl font-bold" style={{ color: "var(--page-text)" }}>{t('find.aiModals.create.title')}</h2>
                        </div>
                        <button type="button" onClick={onClose} className="text-[var(--surface-muted-text)] hover:text-emerald-400 text-2xl">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel)] p-4 space-y-3">
                        {typeOption ? (
                            <div>
                                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t('find.aiModals.create.selectedMode')}</p>
                                <p className="font-semibold" style={{ color: "var(--page-text)" }}>{t(typeOption.titleKey)}</p>
                                <p className="text-sm mt-1" style={{ color: "var(--surface-muted-text)" }}>{t(typeOption.descriptionKey)}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-red-400">{t('find.ai.alerts.selectRoomType')}</p>
                        )}

                        {selectedPrompt ? (
                            <div className="pt-2 border-t" style={{ borderColor: "var(--surface-border)" }}>
                                <p className="text-sm" style={{ color: "var(--surface-muted-text)" }}>{t('find.aiModals.create.selectedPrompt')}</p>
                                <p className="font-semibold" style={{ color: "var(--page-text)" }}>{selectedPrompt.title}</p>
                                <p className="text-sm mt-1" style={{ color: "var(--surface-muted-text)" }}>{rolePlayLabel}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-red-400">{t('find.aiModals.create.promptMissing')}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="ai-room-name" className="block text-sm font-medium mb-2" style={{ color: "var(--page-text)" }}>
                            {t('find.aiModals.create.roomNameLabel')}
                        </label>
                        <input
                            id="ai-room-name"
                            type="text"
                            className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-field)] px-4 py-3 text-[var(--page-text)] focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                            placeholder={t('find.aiModals.create.roomNamePlaceholder')}
                            value={roomName}
                            onChange={(event) => setRoomName(event.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!isReady || isSubmitting}
                        className="w-full rounded-2xl bg-emerald-500 text-white py-3 font-semibold transition-colors shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:bg-[var(--surface-border)] disabled:text-[var(--surface-muted-text)] disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? t('find.aiModals.create.submitting') : t('find.aiModals.create.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AICreateRoomModal;
