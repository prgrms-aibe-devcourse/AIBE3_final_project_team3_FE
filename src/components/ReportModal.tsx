"use client";

import { useState } from "react";
import { X, ShieldAlert, AlertTriangle, MessageSquareWarning, FileWarning } from "lucide-react";
import { ReportCategory } from "@/global/types/report.types";
import { useCreateReport } from "@/global/api/useReportMutation";
import { useToastStore } from "@/global/stores/useToastStore";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMemberId: number;
  targetNickname: string;
  reportedMessage?: string; // 특정 메시지 신고 시 사용
}

const CATEGORY_OPTIONS = [
  {
    value: "ABUSE" as ReportCategory,
    label: "욕설 및 비속어",
    description: "욕설, 비속어, 저속한 표현 사용",
    icon: MessageSquareWarning,
    color: "text-red-400",
  },
  {
    value: "SCAM" as ReportCategory,
    label: "사기 및 사칭",
    description: "사기 행위, 타인 사칭, 금전 요구",
    icon: AlertTriangle,
    color: "text-orange-400",
  },
  {
    value: "INAPPROPRIATE" as ReportCategory,
    label: "부적절한 언행",
    description: "성희롱, 차별, 혐오 표현",
    icon: ShieldAlert,
    color: "text-yellow-400",
  },
  {
    value: "OTHER" as ReportCategory,
    label: "기타",
    description: "위에 해당하지 않는 기타 사유",
    icon: FileWarning,
    color: "text-gray-400",
  },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetMemberId,
  targetNickname,
  reportedMessage,
}: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [reason, setReason] = useState("");
  const { mutate: createReport, isPending } = useCreateReport();
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedCategory) {
      addToast("신고 사유를 선택해주세요.", "error");
      return;
    }

    createReport(
      {
        targetMemberId,
        category: selectedCategory,
        reportedMsgContent: reportedMessage,
        reportedReason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          addToast("신고가 완료되었습니다. 검토 후 조치 예정입니다.", "success");
          handleClose();
        },
        onError: (error) => {
          addToast(error.message || "신고 접수에 실패했습니다.", "error");
        },
      }
    );
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setReason("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <ShieldAlert size={22} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">사용자 신고</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {targetNickname}님을 신고합니다
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="닫기"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Reported Message (if exists) */}
          {reportedMessage && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2 font-semibold">신고 대상 메시지</p>
              <p className="text-sm text-gray-200 break-words">{reportedMessage}</p>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              신고 사유 <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {CATEGORY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedCategory === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedCategory(option.value)}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all duration-200
                      flex items-start gap-3 text-left
                      ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-gray-700 bg-gray-900/30 hover:border-gray-600 hover:bg-gray-900/50"
                      }
                    `}
                  >
                    <Icon
                      size={20}
                      className={`flex-shrink-0 mt-0.5 ${isSelected ? "text-emerald-400" : option.color}`}
                    />
                    <div className="flex-1">
                      <p
                        className={`font-semibold text-sm ${isSelected ? "text-emerald-400" : "text-gray-200"}`}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                    </div>
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
                        flex items-center justify-center transition-all
                        ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-600"}
                      `}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              상세 내용 (선택)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="추가로 전달하고 싶은 내용이 있다면 작성해주세요."
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg
                       text-gray-200 placeholder-gray-500 resize-none
                       focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                       transition-all duration-200"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {reason.length} / 500
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-xs text-blue-300 leading-relaxed">
              신고는 익명으로 처리되며, 허위 신고 시 제재를 받을 수 있습니다.
              신고 내용은 관리자가 검토 후 적절한 조치를 취합니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg
                     hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCategory || isPending}
            className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg
                     hover:bg-red-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                처리중...
              </>
            ) : (
              <>
                <ShieldAlert size={18} />
                신고하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
