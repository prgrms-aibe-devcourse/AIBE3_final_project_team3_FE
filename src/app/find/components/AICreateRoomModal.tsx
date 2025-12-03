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
        () => formatRolePlayTypeLabel(selectedPrompt?.rolePlayType ?? null),
        [selectedPrompt]
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-emerald-400 text-sm font-semibold">
                                {formatAiRoomTypeLabel(selectedRoomType)}
                            </p>
                            <h2 className="text-2xl font-bold text-white">AI 채팅방 생성</h2>
                        </div>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                        {typeOption ? (
                            <div>
                                <p className="text-sm text-gray-400">선택한 모드</p>
                                <p className="text-white font-semibold">{typeOption.title}</p>
                                <p className="text-gray-400 text-sm mt-1">{typeOption.description}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-red-400">채팅방 유형을 먼저 선택해 주세요.</p>
                        )}

                        {selectedPrompt ? (
                            <div className="pt-2 border-t border-gray-700">
                                <p className="text-sm text-gray-400">선택한 프롬프트</p>
                                <p className="text-white font-semibold">{selectedPrompt.title}</p>
                                <p className="text-gray-400 text-sm mt-1">{rolePlayLabel}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-red-400">프롬프트를 선택해 주세요.</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="ai-room-name" className="block text-sm font-medium text-gray-200 mb-2">
                            채팅방 이름
                        </label>
                        <input
                            id="ai-room-name"
                            type="text"
                            className="w-full rounded-lg bg-gray-900 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="예: 커리어 코치 상황극"
                            value={roomName}
                            onChange={(event) => setRoomName(event.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!isReady || isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                        {isSubmitting ? "생성 중..." : "AI 채팅방 만들기"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AICreateRoomModal;
