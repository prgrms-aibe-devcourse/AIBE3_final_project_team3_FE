"use client";

import { useEffect, useState } from "react";

interface GrammarFeedback {
  id: string;
  error: string;
  correction: string;
  explanation: string;
  originalSentence: string;
  timestamp: string;
  tag: "grammar";
}

interface VocabularyFeedback {
  id: string;
  word: string;
  suggestion: string;
  meaning: string;
  example: string;
  originalSentence: string;
  correctedSentence: string;
  timestamp: string;
  tag: "vocabulary";
}

type FeedbackItem = GrammarFeedback | VocabularyFeedback;

export default function LearningNotesPage() {
  const [activeTab, setActiveTab] = useState<"grammar" | "vocabulary">(
    "grammar"
  );
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Toggle expanded state for items
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Load feedback from localStorage
  useEffect(() => {
    const loadFeedback = () => {
      try {
        const existingNotes = localStorage.getItem("learningNotes");
        let notes: any = {};

        if (existingNotes) {
          notes = JSON.parse(existingNotes);
        }

        // Initial vocabulary data
        const initialVocabulary = [
          {
            id: "vocab_1",
            word: "점심",
            suggestion: "lunch",
            meaning: "The midday meal",
            example: "I had lunch at 12 PM.",
            originalSentence: "Yesterday I had 점심. It was really delicious!",
            correctedSentence:
              "Yesterday I had lunch. It was really delicious!",
            timestamp: "2024-11-05T09:30:00.000Z",
            tag: "vocabulary",
          },
          {
            id: "vocab_2",
            word: "숙제",
            suggestion: "homework",
            meaning: "School work assigned to be done outside the classroom",
            example: "I need to finish my homework before dinner.",
            originalSentence:
              "I have too much 숙제 today. Should I do it at the library?",
            correctedSentence:
              "I have too much homework today. Should I do it at the library?",
            timestamp: "2024-11-05T08:15:00.000Z",
            tag: "vocabulary",
          },
          {
            id: "vocab_3",
            word: "친구",
            suggestion: "friend",
            meaning: "A person you know well and like",
            example: "My friend helped me with my English homework.",
            originalSentence:
              "I met a new 친구. They are a really kind person.",
            correctedSentence:
              "I met a new friend. They are a really kind person.",
            timestamp: "2024-11-04T16:45:00.000Z",
            tag: "vocabulary",
          },
          {
            id: "vocab_4",
            word: "학교",
            suggestion: "school",
            meaning: "An educational institution",
            example: "I go to school every day except weekends.",
            originalSentence:
              "I have to go to 학교 early tomorrow. There's an exam.",
            correctedSentence:
              "I have to go to school early tomorrow. There's an exam.",
            timestamp: "2024-11-04T14:20:00.000Z",
            tag: "vocabulary",
          },
          {
            id: "vocab_5",
            word: "커피",
            suggestion: "coffee",
            meaning: "A hot drink made from coffee beans",
            example: "I drink coffee every morning.",
            originalSentence:
              "I feel good when I drink a cup of 커피 in the morning.",
            correctedSentence:
              "I feel good when I drink a cup of coffee in the morning.",
            timestamp: "2024-11-04T12:10:00.000Z",
            tag: "vocabulary",
          },
          {
            id: "vocab_6",
            word: "영화",
            suggestion: "movie",
            meaning: "A film shown in a cinema or on television",
            example: "We watched a movie last night.",
            originalSentence: "I'm planning to go see a new 영화 this weekend.",
            correctedSentence:
              "I'm planning to go see a new movie this weekend.",
            timestamp: "2024-11-04T10:30:00.000Z",
            tag: "vocabulary",
          },
          {
            id: "vocab_7",
            word: "음식",
            suggestion: "food",
            meaning: "Something that people eat",
            example: "Korean food is very delicious.",
            originalSentence: "This 음식 is really spicy but delicious!",
            correctedSentence: "This food is really spicy but delicious!",
            timestamp: "2024-11-03T18:45:00.000Z",
            tag: "vocabulary",
          },
          {
            id: "vocab_8",
            word: "책",
            suggestion: "book",
            meaning: "A set of written pages bound together",
            example: "I'm reading an interesting book.",
            originalSentence: "I borrowed a new 책 from the library.",
            correctedSentence: "I borrowed a new book from the library.",
            timestamp: "2024-11-03T15:20:00.000Z",
            tag: "vocabulary",
          },
        ];

        // Add initial vocabulary if not exists, or merge with existing
        if (!notes.vocabulary) {
          notes.vocabulary = initialVocabulary;
        } else {
          // Check if initial words already exist, add if not
          const existingIds = notes.vocabulary.map((item: any) => item.id);
          initialVocabulary.forEach((vocab) => {
            if (!existingIds.includes(vocab.id)) {
              notes.vocabulary.push(vocab);
            }
          });
        }

        // Ensure grammar data exists
        if (!notes.grammar) {
          notes.grammar = [
            {
              id: "grammar_1",
              error: "my name Zeri",
              correction: "my name is Zeri",
              explanation:
                "Missing 'is' verb. In English, we need the be verb: 'My name is [name]'.",
              originalSentence: "Hello, my name Zeri. Nice to meet you!",
              timestamp: "2024-11-05T10:00:00.000Z",
              tag: "grammar",
            },
          ];
        }

        // Save updated notes to localStorage
        localStorage.setItem("learningNotes", JSON.stringify(notes));

        const allFeedback: FeedbackItem[] = [];

        // Load grammar feedback
        if (notes.grammar) {
          allFeedback.push(
            ...notes.grammar.map((item: any) => ({
              ...item,
              tag: "grammar" as const,
            }))
          );
        }

        // Load vocabulary feedback
        if (notes.vocabulary) {
          allFeedback.push(
            ...notes.vocabulary.map((item: any) => ({
              ...item,
              tag: "vocabulary" as const,
            }))
          );
        }

        // Sort by timestamp (newest first)
        allFeedback.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setFeedbackItems(allFeedback);
      } catch (error) {
        console.error("Failed to load learning notes:", error);
      }
    };

    loadFeedback();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadFeedback();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Filter feedback items
  const grammarFeedback = feedbackItems.filter(
    (item): item is GrammarFeedback => item.tag === "grammar"
  );

  const vocabularyFeedback = feedbackItems.filter(
    (item): item is VocabularyFeedback => item.tag === "vocabulary"
  );

  const filteredGrammarFeedback = grammarFeedback.filter((item) => {
    return (
      item.error.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.correction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalSentence.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredVocabularyFeedback = vocabularyFeedback.filter((item) => {
    return (
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.suggestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.example.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalSentence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.correctedSentence.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">학습 노트</h1>
          <p className="mt-2 text-gray-600">
            AI와의 대화에서 학습한 문법과 어휘를 확인하세요
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="학습 내용을 검색하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("grammar")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "grammar"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              문법 피드백 ({filteredGrammarFeedback.length})
            </button>
            <button
              onClick={() => setActiveTab("vocabulary")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "vocabulary"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              단어장 ({filteredVocabularyFeedback.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "grammar" ? (
            <>
              {filteredGrammarFeedback.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">
                    {searchTerm
                      ? "검색 조건에 맞는 문법 피드백이 없습니다."
                      : "아직 문법 피드백이 없습니다. AI와 대화하며 학습해보세요!"}
                  </p>
                </div>
              ) : (
                filteredGrammarFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            오류
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString(
                              "ko-KR"
                            )}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              원본 문장:
                            </p>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded">
                              {item.originalSentence}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-red-600 mb-1">오류:</p>
                            <p className="text-red-800 line-through">
                              {item.error}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-green-600 mb-1">수정:</p>
                            <p className="text-green-800 font-medium">
                              {item.correction}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 mb-1">설명:</p>
                            <p className="text-blue-800">{item.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {filteredVocabularyFeedback.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">
                    {searchTerm
                      ? "검색 조건에 맞는 단어가 없습니다."
                      : "아직 저장된 단어가 없습니다. AI와 대화하며 새로운 단어를 학습해보세요!"}
                  </p>
                </div>
              ) : (
                filteredVocabularyFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Always visible content */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              단어
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              {new Date(item.timestamp).toLocaleDateString(
                                "ko-KR"
                              )}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-4">
                              <div>
                                <span className="text-lg font-semibold text-gray-900">
                                  {item.word}
                                </span>
                                <span className="text-gray-400 mx-2">→</span>
                                <span className="text-lg font-medium text-blue-600">
                                  {item.suggestion}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-700">{item.meaning}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                예문:
                              </p>
                              <p className="text-gray-800 italic">
                                "{item.example}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Toggle button */}
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <span>원본/수정 문장 보기</span>
                        <svg
                          className={`ml-1 w-4 h-4 transition-transform ${
                            expandedItems.has(item.id) ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Collapsible content */}
                      {expandedItems.has(item.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              한국어 원본:
                            </p>
                            <p className="text-gray-900 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                              {item.originalSentence}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              영어 번역:
                            </p>
                            <p className="text-gray-900 bg-green-50 p-3 rounded border-l-4 border-green-400">
                              {item.correctedSentence}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
