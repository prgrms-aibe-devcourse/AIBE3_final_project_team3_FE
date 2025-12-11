"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          {t("home.heroTitle")}
          <span className="text-emerald-400">{t("home.heroHighlight")}</span>
        </h1>
        <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
          {t("home.heroSubtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/chat"
            className="bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            {t("home.primaryCta")}
          </a>
          <a
            href="/auth/signup"
            className="border-2 border-emerald-600 text-emerald-400 px-8 py-3 rounded-lg text-lg font-medium hover:bg-emerald-600 hover:text-white transition-colors"
          >
            {t("home.secondaryCta")}
          </a>
        </div>
      </section>

      {/* Translation Feature */}
      <section
        className="py-16 rounded-3xl border theme-card shadow-2xl transition-colors"
        style={{ borderColor: "var(--surface-border)" }}
      >
        <div className="text-center px-4 md:px-12">
          <h2 className="text-3xl font-bold mb-6" style={{ color: "var(--page-text)" }}>
            {t("home.translation.title")}
          </h2>
          <p
            className="text-xl mb-8 max-w-3xl mx-auto"
            style={{ color: "var(--surface-muted-text)" }}
          >
            {t("home.translation.description")}
          </p>
          <div
            className="p-6 md:p-8 rounded-2xl border shadow-inner max-w-2xl mx-auto"
            style={{ background: "var(--surface-panel)", borderColor: "var(--surface-border)" }}
          >
            <div className="text-left">
              <p className="text-sm mb-2" style={{ color: "var(--surface-muted-text)" }}>
                {t("home.translation.inputLabel")}
              </p>
              <p className="text-lg mb-4" style={{ color: "var(--page-text)" }}>
                "I want to go to the 도서관 to study"
              </p>
              <p className="text-sm mb-2" style={{ color: "var(--surface-muted-text)" }}>
                {t("home.translation.outputLabel")}
              </p>
              <p className="text-lg text-emerald-400">
                "I want to go to the library to study"
              </p>
              <p className="text-sm mt-3" style={{ color: "var(--surface-muted-text)" }}>
                ✓ "도서관 → library" {t("home.translation.saved")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          {t("home.featuresTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">
              {t("home.features.aiChat.title")}
            </h3>
            <p className="text-gray-300">
              {t("home.features.aiChat.description")}
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">
              {t("home.features.userChat.title")}
            </h3>
            <p className="text-gray-300">
              {t("home.features.userChat.description")}
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">
              {t("home.features.learningNotes.title")}
            </h3>
            <p className="text-gray-300">
              {t("home.features.learningNotes.description")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
