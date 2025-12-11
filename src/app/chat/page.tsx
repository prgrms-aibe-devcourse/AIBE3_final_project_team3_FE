'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function ChatPage() {
  const { t } = useLanguage();

  return (
    <main
      className="flex-1 hidden md:flex items-center justify-center text-center"
      style={{
        background: "var(--surface-panel)",
        color: "var(--page-text)",
      }}
    >
      <div>
        <div className="text-3xl mb-4">💬</div>
        <h2 className="text-2xl font-semibold text-gray-300">
          {t('chatPage.title')}
        </h2>
        <p className="text-gray-500 mt-2">
          {t('chatPage.description')}
        </p>
      </div>
    </main>
  );
}
