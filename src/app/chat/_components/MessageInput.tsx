"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Mic, Loader2 } from "lucide-react";

type MessageInputProps = {
  onSendMessage: (message: { text: string; isTranslateEnabled: boolean }) => void;
  onFileSelect: (file: File) => void;
  isUploading: boolean;
};

export default function MessageInput({
  onSendMessage,
  onFileSelect,
  isUploading,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isTranslateEnabled, setIsTranslateEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (text.trim() && !isUploading) {
      onSendMessage({ text, isTranslateEnabled: isTranslateEnabled });
      setText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  return (
    <div className="flex-shrink-0 p-4 bg-gray-800 border-t border-gray-700">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex items-center justify-end px-2 mb-2">
        <label
          htmlFor="auto-translate"
          className="flex items-center cursor-pointer"
        >
          <span className="mr-2 text-sm text-gray-300">자동 번역</span>
          <div className="relative">
            <input
              id="auto-translate"
              type="checkbox"
              className="sr-only"
              checked={isTranslateEnabled}
              onChange={() => setIsTranslateEnabled(!isTranslateEnabled)}
            />
            <div className="block bg-gray-600 w-10 h-5 rounded-full"></div>
            <div
              className={`dot absolute left-1 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                isTranslateEnabled ? "translate-x-full !bg-emerald-400" : ""
              }`}
            ></div>
          </div>
        </label>
      </div>
      <div className="flex items-end gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400 disabled:opacity-50"
          rows={1}
          style={{ minHeight: "40px", maxHeight: "120px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
          disabled={isUploading}
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Paperclip size={20} />
            )}
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            <Mic size={20} />
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim() || isUploading}
            className="bg-emerald-600 text-white rounded-full p-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
