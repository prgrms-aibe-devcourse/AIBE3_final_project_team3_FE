import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateLearningNote } from "@/global/api/useLearningNotes";
import { AiFeedbackResp } from "@/global/types/chat.types";
import { AlertTriangle, BookOpen, CheckCircle, CheckSquare, Loader2, Save, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

interface LearningNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  translatedContent: string;
  feedbackData: AiFeedbackResp | null;
}

export default function LearningNoteModal({
  isOpen,
  onClose,
  originalContent,
  translatedContent,
  feedbackData,
}: LearningNoteModalProps) {
  const { t } = useLanguage();
  const { mutate: createNote, isPending: isSaving } = useCreateLearningNote();
  const [isSaved, setIsSaved] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && feedbackData) {
      const allIndices = new Set(feedbackData.feedback.map((_, i) => i));
      setSelectedIndices(allIndices);
    }
  }, [isOpen, feedbackData]);

  if (!isOpen || !feedbackData) return null;

  const toggleFeedback = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  const toLearningTagParam = (value: string): "GRAMMAR" | "VOCABULARY" | "TRANSLATION" => {
    const upper = typeof value === "string" ? value.toUpperCase() : "";
    if (upper === "VOCABULARY" || upper === "TRANSLATION") {
      return upper;
    }
    return "GRAMMAR";
  };

  const handleSave = () => {
    const selectedFeedback = feedbackData.feedback.filter((_, index) => selectedIndices.has(index));

    createNote(
      {
        originalContent: originalContent,
        correctedContent: feedbackData.correctedContent,
        feedback: selectedFeedback.map((item) => ({
          tag: toLearningTagParam(item.tag),
          problem: item.problem,
          correction: item.correction,
          extra: item.extra
        }))
      },
      {
        onSuccess: () => {
          setIsSaved(true);
          setTimeout(() => {
            onClose();
            setIsSaved(false); // Reset for next time
          }, 1500);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center theme-overlay backdrop-blur-sm p-4">
      <div className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden theme-surface flex flex-col">

        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--surface-border)" }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="text-emerald-500" size={24} />
            <h2 className="text-xl font-bold text-white">AI Learning Feedback</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Comparison Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg theme-surface-muted">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Original</label>
              <p className="text-gray-300 text-lg">{originalContent}</p>
            </div>
            <div className="p-4 rounded-lg theme-surface-muted">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Translated (Intention)</label>
              <p className="text-gray-300 text-lg">{translatedContent}</p>
            </div>
          </div>

          {/* Correction Section */}
          <div className="p-5 rounded-xl" style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <label className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-2 uppercase">
              <CheckCircle size={16} />
              AI Correction
            </label>
            <p className="text-white text-xl font-medium">{feedbackData.correctedContent}</p>
          </div>

          {/* Feedback List */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              Analysis & Feedback <span className="text-sm font-normal text-gray-400 ml-2">(Select items to save)</span>
            </h3>

            {feedbackData.feedback.length === 0 ? (
              <div className="text-gray-500 text-center py-8 rounded-lg border border-dashed" style={{ borderColor: "var(--surface-border)" }}>
                No errors found! Perfect sentence. 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackData.feedback.map((item, index) => {
                  const isSelected = selectedIndices.has(index);
                  return (
                    <div
                      key={index}
                      onClick={() => toggleFeedback(index)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${isSelected
                          ? "theme-surface border-yellow-500/50"
                          : "theme-surface-muted opacity-80 hover:opacity-100"
                        }`}
                    >
                      <div className={`mt-1 flex-shrink-0 ${isSelected ? "text-yellow-500" : "text-gray-500"}`}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${isSelected ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-700 text-gray-400"
                            }`}>
                            {item.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm mb-2">
                          <span className="text-red-400 line-through">{item.problem}</span>
                          <span className="text-gray-500">→</span>
                          <span className={`font-bold ${isSelected ? "text-emerald-500" : "text-emerald-700"}`}>{item.correction}</span>
                        </div>
                        <p className={`text-sm ${isSelected ? "text-gray-300" : "text-gray-500"}`}>{item.extra}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex justify-between items-center gap-3"
          style={{ borderColor: "var(--surface-border)" }}
        >
          <div className="text-sm text-gray-400 pl-2">
            {selectedIndices.size} items selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-300 transition-colors hover:bg-[var(--surface-panel-muted)]"
            >
              Close
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${isSaved
                  ? "bg-green-600 text-white cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : isSaved ? (
                <CheckCircle size={18} />
              ) : (
                <Save size={18} />
              )}
              {isSaved ? "Saved!" : "Save to Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
