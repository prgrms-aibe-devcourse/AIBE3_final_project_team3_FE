import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateLearningNote } from "@/global/api/useLearningNotes";
import { AiFeedbackResp } from "@/global/types/chat.types";
import { Loader2, Save, X, CheckCircle, AlertTriangle, BookOpen } from "lucide-react";
import { useState } from "react";

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

  if (!isOpen || !feedbackData) return null;

  const handleSave = () => {
    createNote(
      {
        originalContent: originalContent,
        correctedContent: feedbackData.correctedContent,
        feedback: feedbackData.feedback.map(item => ({
          tag: item.tag,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-850">
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
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Original</label>
              <p className="text-gray-300 text-lg">{originalContent}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Translated (Intention)</label>
              <p className="text-gray-300 text-lg">{translatedContent}</p>
            </div>
          </div>

          {/* Correction Section */}
          <div className="bg-emerald-900/20 p-5 rounded-xl border border-emerald-500/30">
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
              Analysis & Feedback
            </h3>
            
            {feedbackData.feedback.length === 0 ? (
              <div className="text-gray-400 text-center py-8 bg-gray-900 rounded-lg border border-dashed border-gray-700">
                No errors found! Perfect sentence. 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackData.feedback.map((item, index) => (
                  <div key={index} className="bg-gray-750 p-4 rounded-lg border-l-4 border-yellow-500 bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                        {item.tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm mb-2">
                      <span className="text-red-400 line-through">{item.problem}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-green-400 font-bold">{item.correction}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{item.extra}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-850 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              isSaved
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
  );
}
