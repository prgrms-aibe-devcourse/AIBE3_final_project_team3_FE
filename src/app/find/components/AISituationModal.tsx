// src/app/find/components/AISituationModal.tsx
import { useLanguage } from "@/contexts/LanguageContext";
import { RefreshCcw, X } from "lucide-react";
import React from "react";
import { AICategory, formatRolePlayTypeLabel } from "../constants/aiSituations";

interface AISituationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: AICategory) => void;
  categories: AICategory[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  headerTitle?: string;
}

const AISituationModal: React.FC<AISituationModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  categories,
  isLoading,
  errorMessage,
  onRetry,
  headerTitle,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const title = headerTitle ?? t('find.aiModals.situation.title');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              <X size={24} />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-300 py-8">{t('find.aiModals.situation.loading')}</div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg text-left transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span className="uppercase tracking-wide">
                      {category.rolePlayType ?? t('find.aiModals.situation.otherType')}
                    </span>
                    <span className="text-gray-500">·</span>
                    <span>{formatRolePlayTypeLabel(category.rolePlayType, t)}</span>
                    <span className="text-gray-500">·</span>
                    <span>{t('find.aiModals.situation.promptCount', { count: String(category.scenarios.length) })}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-300 py-8 space-y-4">
              <p>{t('find.aiModals.situation.empty')}</p>
              {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                >
                  <RefreshCcw size={16} /> {t('find.aiModals.situation.retry')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISituationModal;
