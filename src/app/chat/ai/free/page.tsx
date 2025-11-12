"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  originalText?: string; // For Korean input before translation
  analysis?: AnalysisResult; // AI analysis of the message
}

interface AnalysisResult {
  hasErrors: boolean;
  grammarErrors: GrammarError[];
  vocabularyIssues: VocabularyIssue[];
  suggestions: string[];
}

interface GrammarError {
  id: string;
  error: string;
  correction: string;
  explanation: string;
  category: string; // e.g., "tense", "article", "subject-verb agreement"
}

interface VocabularyIssue {
  id: string;
  word: string;
  suggestion: string;
  meaning: string;
  example: string;
}

interface Feedback {
  id: number;
  type: "grammar" | "vocabulary" | "pronunciation" | "general";
  message: string;
  timestamp: Date;
}

interface ConversationHistory {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export default function FreeChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI English tutor. Feel free to mix Korean and English in your messages - I'll automatically translate any Korean words to English when you send!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationHistory[]
  >([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  );

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleMessageExpansion = (messageId: number) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const analyzeUserMessage = async (
    originalText: string,
    translatedText: string
  ): Promise<AnalysisResult> => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalText,
          translatedText,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to analyze message:", error);
      return {
        hasErrors: false,
        grammarErrors: [],
        vocabularyIssues: [],
        suggestions: [],
      };
    }
  };

  const saveFeedbackToLearningNotes = async (
    analysis: AnalysisResult,
    originalText: string,
    translatedText: string
  ) => {
    try {
      // Get existing learning notes
      const existingNotes = localStorage.getItem("learningNotes");
      const notes = existingNotes
        ? JSON.parse(existingNotes)
        : { grammar: [], vocabulary: [], sentences: [] };

      // Save grammar errors
      if (analysis.grammarErrors.length > 0) {
        if (!notes.grammar) notes.grammar = [];
        analysis.grammarErrors.forEach((error) => {
          const grammarFeedback = {
            id: Date.now() + Math.random(),
            originalText,
            translatedText,
            error: error.error,
            correction: error.correction,
            explanation: error.explanation,
            category: error.category,
            timestamp: new Date().toISOString(),
            type: "grammar" as const,
          };
          notes.grammar.push(grammarFeedback);
        });
      }

      // Save vocabulary issues
      if (analysis.vocabularyIssues.length > 0) {
        if (!notes.vocabulary) notes.vocabulary = [];
        analysis.vocabularyIssues.forEach((issue) => {
          const vocabularyFeedback = {
            id: Date.now() + Math.random(),
            word: issue.word,
            suggestion: issue.suggestion,
            meaning: issue.meaning,
            example: issue.example,
            originalContext: originalText,
            timestamp: new Date().toISOString(),
            type: "vocabulary" as const,
          };
          notes.vocabulary.push(vocabularyFeedback);
        });
      }

      // Save updated notes
      localStorage.setItem("learningNotes", JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to save feedback:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const currentInput = inputText;
    setInputText(""); // Clear input immediately
    setIsTranslating(true);
    setIsSendingMessage(true);

    // Add user message immediately (with original text for now)
    const tempUserMessageId = Date.now();
    const tempUserMessage: Message = {
      id: tempUserMessageId,
      text: currentInput,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      // Check if translation is needed
      const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(currentInput);

      // Call unified Chat API with translation capability
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory,
          needsTranslation: hasKorean,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      // Update user message with translated text if available
      const finalUserText = data.translatedMessage || currentInput;

      // Analyze the message for errors if translation occurred
      let analysis: AnalysisResult | undefined;
      if (data.translatedMessage && currentInput !== finalUserText) {
        analysis = await analyzeUserMessage(currentInput, finalUserText);

        // Automatically save analysis results to learning notes
        if (analysis.hasErrors) {
          await saveFeedbackToLearningNotes(
            analysis,
            currentInput,
            finalUserText
          );
        }
      }

      const updatedUserMessage: Message = {
        id: tempUserMessageId,
        text: finalUserText,
        sender: "user",
        timestamp: new Date(),
        originalText:
          data.translatedMessage && data.translatedMessage !== currentInput
            ? currentInput
            : undefined,
        analysis: analysis,
      };

      // Add actual AI response
      const finalAiResponse: Message = {
        id: Date.now() + 2,
        text: data.message,
        sender: "ai",
        timestamp: new Date(),
      };

      // Update messages: replace temp user message and add AI response
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) => {
          if (msg.id === tempUserMessageId) return updatedUserMessage;
          return msg;
        });
        return [...updatedMessages, finalAiResponse];
      });

      // Update conversation history
      const newUserEntry: ConversationHistory = {
        role: "user",
        parts: [{ text: finalUserText }],
      };

      const newAiEntry: ConversationHistory = {
        role: "model",
        parts: [{ text: data.message }],
      };

      setConversationHistory((prev) => [...prev, newUserEntry, newAiEntry]);
    } catch (error) {
      console.error("Failed to send message:", error);

      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 2,
        text: `Sorry, I'm having trouble connecting right now. ${
          error instanceof Error ? error.message : "Please try again later."
        }`,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTranslating(false);
      setIsSendingMessage(false);
    }
  };

  const getFeedback = async () => {
    if (messages.length <= 1) return; // No user messages to analyze

    setIsGettingFeedback(true);

    try {
      // Get the last few user messages for analysis
      const userMessages = messages
        .filter((msg) => msg.sender === "user")
        .slice(-3) // Analyze last 3 messages
        .map((msg) => msg.text)
        .join(" ");

      if (!userMessages.trim()) {
        setIsGettingFeedback(false);
        return;
      }

      // Call Gemini API for feedback
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessages,
          type: "feedback",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Feedback request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      // Parse the feedback from the API response
      if (data.feedback && Array.isArray(data.feedback)) {
        const newFeedbacks: Feedback[] = data.feedback.map(
          (fb: any, index: number) => ({
            id: Date.now() + index,
            type: fb.type || "general",
            message: fb.message || fb.text || "No specific feedback available.",
            timestamp: new Date(),
          })
        );

        setFeedbackList((prev) => [...newFeedbacks, ...prev]);
      } else {
        // Fallback if feedback format is unexpected
        const fallbackFeedback: Feedback = {
          id: Date.now(),
          type: "general",
          message:
            typeof data.feedback === "string"
              ? data.feedback
              : "Keep practicing! Your English is improving.",
          timestamp: new Date(),
        };

        setFeedbackList((prev) => [fallbackFeedback, ...prev]);
      }
    } catch (error) {
      console.error("Failed to get feedback:", error);

      // Add error feedback
      const errorFeedback: Feedback = {
        id: Date.now(),
        type: "general",
        message:
          "Unable to generate feedback at the moment. Please try again later.",
        timestamp: new Date(),
      };

      setFeedbackList((prev) => [errorFeedback, ...prev]);
    } finally {
      setIsGettingFeedback(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getFeedbackTypeIcon = (type: Feedback["type"]) => {
    switch (type) {
      case "grammar":
        return "📝";
      case "vocabulary":
        return "📚";
      case "pronunciation":
        return "🗣️";
      default:
        return "💡";
    }
  };

  const getFeedbackTypeColor = (type: Feedback["type"]) => {
    switch (type) {
      case "grammar":
        return "text-blue-400";
      case "vocabulary":
        return "text-green-400";
      case "pronunciation":
        return "text-purple-400";
      default:
        return "text-amber-400";
    }
  };

  return (
    <div className="flex h-full bg-gray-800">
      {/* Main Chat Area - 2/3 width */}
      <div className="flex flex-col w-2/3 border-r border-gray-700">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-lg">🗣️</span>
              </div>
              <div>
                <h1 className="font-semibold text-white">Free Chat</h1>
                <p className="text-sm text-gray-300">
                  Casual conversation practice
                </p>
              </div>
            </div>
            <button
              onClick={getFeedback}
              disabled={isGettingFeedback || messages.length <= 1}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isGettingFeedback ? "Analyzing..." : "Get Feedback"}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
          style={{
            maxHeight: "calc(100vh - 220px)",
            scrollbarWidth: "thin",
            scrollbarColor: "#4B5563 transparent",
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md ${
                  message.sender === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-700 text-gray-200 shadow-sm border border-gray-600"
                } rounded-lg overflow-hidden`}
              >
                {/* Main message content */}
                <div className="px-4 py-2">
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {/* Dropdown toggle for user messages with originalText */}
                {message.sender === "user" && message.originalText && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() => toggleMessageExpansion(message.id)}
                      className="text-xs opacity-75 hover:opacity-100 transition-opacity flex items-center space-x-1"
                    >
                      <span>Show details</span>
                      <svg
                        className={`w-3 h-3 transform transition-transform ${
                          expandedMessages.has(message.id) ? "rotate-180" : ""
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Expanded content */}
                {expandedMessages.has(message.id) && message.originalText && (
                  <div className="px-4 pb-3 pt-1 border-t border-emerald-500 bg-emerald-700">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold opacity-90 mb-1">
                          Original sentence:
                        </p>
                        <p className="text-sm opacity-80 bg-emerald-800 px-2 py-1 rounded">
                          {message.originalText}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold opacity-90 mb-1">
                          Translated sentence:
                        </p>
                        <p className="text-sm opacity-80 bg-emerald-800 px-2 py-1 rounded">
                          {message.text}
                        </p>
                      </div>

                      {/* Analysis Results */}
                      {message.analysis && (
                        <div className="space-y-3">
                          {message.analysis.hasErrors ? (
                            <div className="bg-yellow-900/50 border border-yellow-600 rounded p-3">
                              <p className="text-xs font-semibold text-yellow-300 mb-2">
                                🔍 AI Analysis - Learning Opportunities Found
                              </p>

                              {/* Grammar Errors */}
                              {message.analysis.grammarErrors.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-red-300 mb-1">
                                    📝 Grammar (
                                    {message.analysis.grammarErrors.length})
                                  </p>
                                  <div className="space-y-1">
                                    {message.analysis.grammarErrors.map(
                                      (error) => (
                                        <div
                                          key={error.id}
                                          className="text-xs bg-red-900/30 border border-red-700 rounded p-2"
                                        >
                                          <p className="text-red-200">
                                            <span className="font-medium">
                                              Error:
                                            </span>{" "}
                                            {error.error}
                                          </p>
                                          <p className="text-green-200">
                                            <span className="font-medium">
                                              Fix:
                                            </span>{" "}
                                            {error.correction}
                                          </p>
                                          <p className="text-gray-300 mt-1">
                                            {error.explanation}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Vocabulary Issues */}
                              {message.analysis.vocabularyIssues.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-blue-300 mb-1">
                                    📚 Vocabulary (
                                    {message.analysis.vocabularyIssues.length})
                                  </p>
                                  <div className="space-y-1">
                                    {message.analysis.vocabularyIssues.map(
                                      (issue) => (
                                        <div
                                          key={issue.id}
                                          className="text-xs bg-blue-900/30 border border-blue-700 rounded p-2"
                                        >
                                          <p className="text-blue-200">
                                            <span className="font-medium">
                                              Word:
                                            </span>{" "}
                                            {issue.word} → {issue.suggestion}
                                          </p>
                                          <p className="text-gray-300">
                                            <span className="font-medium">
                                              Meaning:
                                            </span>{" "}
                                            {issue.meaning}
                                          </p>
                                          <p className="text-gray-300 text-xs mt-1">
                                            <span className="font-medium">
                                              Example:
                                            </span>{" "}
                                            {issue.example}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              <p className="text-xs text-green-300 mt-2">
                                ✅ Feedback automatically saved to Learning
                                Notes!
                              </p>
                            </div>
                          ) : (
                            <div className="bg-green-900/50 border border-green-600 rounded p-3">
                              <p className="text-xs text-green-300">
                                ✅ Great job! No major errors detected in your
                                translation.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isSendingMessage && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-700 text-gray-200 shadow-sm border border-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-gray-900 border-t border-gray-700 p-4 flex-shrink-0">
          <div className="flex space-x-3 items-end">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Mix Korean and English! AI will translate Korean words automatically)"
              className="flex-1 border border-gray-600 bg-gray-800 text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm placeholder-gray-400 overflow-hidden"
              rows={2}
              style={{ minHeight: "60px", maxHeight: "120px", height: "auto" }}
              disabled={isSendingMessage}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "60px";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isTranslating || isSendingMessage}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              style={{ minHeight: "60px" }}
            >
              {isTranslating
                ? "Translating..."
                : isSendingMessage
                ? "Thinking..."
                : "Send"}
            </button>
          </div>
          <p className="text-xs text-gray-300 mt-2">
            Tip: Mix Korean and English freely! AI will translate any Korean
            words when you send. Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Feedback Panel - 1/3 width */}
      <div className="flex flex-col w-1/3 bg-gray-850">
        {/* Feedback Header */}
        <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm">💡</span>
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Feedback</h2>
              <p className="text-xs text-gray-400">
                Personalized learning insights
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {feedbackList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-sm">
                Start chatting and click "Get Feedback" to receive personalized
                learning insights!
              </p>
            </div>
          ) : (
            feedbackList.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-gray-800 border border-gray-600 rounded-lg p-4"
              >
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">
                    {getFeedbackTypeIcon(feedback.type)}
                  </span>
                  <span
                    className={`text-sm font-semibold capitalize ${getFeedbackTypeColor(
                      feedback.type
                    )}`}
                  >
                    {feedback.type}
                  </span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed mb-2">
                  {feedback.message}
                </p>
                <p className="text-xs text-gray-500">
                  {feedback.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Feedback Actions */}
        <div className="bg-gray-900 border-t border-gray-700 p-4 flex-shrink-0">
          <button
            onClick={() => setFeedbackList([])}
            disabled={feedbackList.length === 0}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Clear Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
