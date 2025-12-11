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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--surface-overlay)" }}
    >
      <div className="theme-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "var(--page-text)" }}>{title}</h2>
            <button onClick={onClose} className="text-[var(--surface-muted-text)] hover:text-emerald-400 text-2xl">
              <X size={24} />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8" style={{ color: "var(--surface-muted-text)" }}>
              {t('find.aiModals.situation.loading')}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category)}
                  className="w-full text-left rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-panel)] hover:border-emerald-400 p-4 transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--page-text)" }}>{category.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--surface-muted-text)" }}>
                    <span className="uppercase tracking-wide">
                      {category.rolePlayType ?? t('find.aiModals.situation.otherType')}
                    </span>
                    <span style={{ color: "var(--surface-border)" }}>·</span>
                    <span>{formatRolePlayTypeLabel(category.rolePlayType, t)}</span>
                    <span style={{ color: "var(--surface-border)" }}>·</span>
                    <span>{t('find.aiModals.situation.promptCount', { count: String(category.scenarios.length) })}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4" style={{ color: "var(--surface-muted-text)" }}>
              <p>{t('find.aiModals.situation.empty')}</p>
              {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-[var(--surface-border)] text-[var(--page-text)] hover:border-emerald-400"
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
