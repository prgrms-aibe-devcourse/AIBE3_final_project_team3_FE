import { useLanguage } from "@/contexts/LanguageContext";
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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">{t('find.aiModals.type.title')}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {AI_ROOM_TYPE_OPTIONS.map((option) => (
                            <button
                                key={option.type}
                                onClick={() => onSelect(option.type)}
                                className="bg-gray-700 hover:bg-gray-600 text-white p-5 rounded-lg text-left transition-colors border border-transparent hover:border-emerald-400"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-semibold">{t(option.titleKey)}</h3>
                                    {option.badgeKey && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-emerald-600 text-white">{t(option.badgeKey)}</span>
                                    )}
                                </div>
                                <p className="text-gray-300 text-sm mb-2">{t(option.descriptionKey)}</p>
                                <p className="text-gray-400 text-xs">{t(option.detailsKey)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIRoomTypeModal;
