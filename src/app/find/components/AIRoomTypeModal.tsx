import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AiChatRoomType } from "@/global/types/chat.types";
import { X } from "lucide-react";
import React from "react";
import { AI_ROOM_TYPE_OPTIONS } from "../constants/aiRoomTypes";

interface AIRoomTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (roomType: AiChatRoomType) => void;
}

const AIRoomTypeModal: React.FC<AIRoomTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    if (!isOpen) return null;

    const overlayClass = theme === "dark" ? "bg-black bg-opacity-60" : "bg-black bg-opacity-30";
    const panelClass = theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900";
    const cardBase = theme === "dark"
        ? "bg-gray-700 hover:bg-gray-600 text-white border-transparent hover:border-emerald-400"
        : "bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 hover:border-emerald-400";

    return (
        <div className={`fixed inset-0 ${overlayClass} flex items-center justify-center p-4 z-50`}>
            <div className={`${panelClass} rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-lg`}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{t('find.aiModals.type.title')}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {AI_ROOM_TYPE_OPTIONS.map((option) => (
                            <button
                                key={option.type}
                                onClick={() => onSelect(option.type)}
                                className={`${cardBase} p-5 rounded-lg text-left transition-colors`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-semibold">{t(option.titleKey)}</h3>
                                    {option.badgeKey && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-emerald-600 text-white">{t(option.badgeKey)}</span>
                                    )}
                                </div>
                                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm mb-2`}>{t(option.descriptionKey)}</p>
                                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs`}>{t(option.detailsKey)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIRoomTypeModal;
