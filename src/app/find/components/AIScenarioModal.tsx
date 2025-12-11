// src/app/find/components/AIScenarioModal.tsx
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, X } from "lucide-react";
import React from "react";
import { AICategory, AIScenario, formatRolePlayTypeLabel } from "../constants/aiSituations";

interface AIScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  selectedCategory: AICategory | null;
  onSelectScenario: (scenario: AIScenario) => void;
}

const AIScenarioModal: React.FC<AIScenarioModalProps> = ({
  isOpen,
  onClose,
  onBack,
  selectedCategory,
  onSelectScenario,
}) => {
  const { t } = useLanguage();
  if (!isOpen || !selectedCategory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button onClick={onBack} className="text-gray-400 hover:text-white mr-4">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-white">{selectedCategory.title}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              <X size={24} />
            </button>
          </div>

          {selectedCategory.scenarios.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {selectedCategory.scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg text-left transition-colors"
                >
                  <h3 className="text-lg font-semibold">{scenario.title}</h3>
                  {scenario.description && (
                    <p className="text-gray-400 text-sm mt-1">{scenario.description}</p>
                  )}
                  {!scenario.description && (
                    <p className="text-gray-400 text-sm mt-1">
                      {formatRolePlayTypeLabel(scenario.rolePlayType ?? selectedCategory.rolePlayType ?? null, t)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-300 py-8">
              {t('find.aiModals.scenario.empty')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIScenarioModal;
