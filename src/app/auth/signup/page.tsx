"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useSignup } from "@/global/api/useAuthQuery";
import type { CountryCode } from "@/global/lib/countries";
import { COUNTRY_OPTIONS, isSupportedCountryCode } from "@/global/lib/countries";

const ENGLISH_LEVEL_OPTIONS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"] as const;
type EnglishLevel = (typeof ENGLISH_LEVEL_OPTIONS)[number];

interface SignupFormState {
  name: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: CountryCode | "";
  level: EnglishLevel | "";
  interests: string;
  description: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { mutate: signup, isPending } = useSignup();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<SignupFormState>({
    name: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    level: "",
    interests: "",
    description: "",
  });
  const [isLevelTooltipOpen, setIsLevelTooltipOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert(t("auth.signup.alerts.passwordMismatch"));
      return;
    }

    const interests = formData.interests
      .split(",")
      .map((interest) => interest.trim())
      .filter((interest) => interest.length > 0);

    if (interests.length === 0) {
      alert(t("auth.signup.alerts.interestsRequired"));
      return;
    }

    const countryCode = formData.country.trim().toUpperCase();

    if (!isSupportedCountryCode(countryCode)) {
      alert(t("auth.signup.alerts.countryRequired"));
      return;
    }

    const englishLevel = formData.level;

    if (!englishLevel) {
      alert(t("auth.signup.alerts.levelRequired"));
      return;
    }

    signup(
      {
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        name: formData.name,
        country: countryCode,
        nickname: formData.nickname,
        englishLevel,
        interests,
        description: formData.description,
      },
      {
        onSuccess: () => {
          alert(t("auth.signup.alerts.success"));
          router.replace("/auth/login");
        },
        onError: (error) => {
          const message =
            error instanceof Error && error.message
              ? error.message
              : t("auth.signup.alerts.generic");
          alert(message || t("auth.signup.alerts.generic"));
        },
      }
    );
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[color:var(--auth-heading)]">
            {t("auth.signup.title")}
          </h2>
          <p className="mt-2 text-center text-sm text-[color:var(--auth-subtext)]">
            {t("auth.signup.subtitlePrefix")}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t("auth.signup.subtitleLink")}
            </Link>
            {t("auth.signup.subtitleSuffix")}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[color:var(--auth-heading)]"
              >
                {t("auth.signup.fields.name")}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("auth.signup.placeholders.name")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-[color:var(--auth-heading)]"
              >
                {t("auth.signup.fields.nickname")}
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("auth.signup.placeholders.nickname")}
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[color:var(--auth-heading)]"
              >
                {t("auth.signup.fields.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("auth.signup.placeholders.email")}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-[color:var(--auth-heading)]"
              >
                {t("auth.signup.fields.country")}
              </label>
              <select
                id="country"
                name="country"
                required
                className="mt-1 block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] text-[color:var(--auth-input-text)] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    country: e.target.value as CountryCode | "",
                  })
                }
              >
                <option value="">{t("auth.signup.placeholders.country")}</option>
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div
                className="flex items-center gap-2 relative"
                onMouseEnter={() => setIsLevelTooltipOpen(true)}
                onMouseLeave={() => setIsLevelTooltipOpen(false)}
              >
                <label
                  htmlFor="level"
                  className="block text-sm font-medium text-[color:var(--auth-heading)]"
                >
                  {t("auth.signup.fields.level")}
                </label>
                <button
                  type="button"
                  className="w-5 h-5 flex items-center justify-center rounded-full border border-blue-200 text-xs font-semibold text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label={t("auth.signup.helpers.levelTooltipLabel")}
                  onFocus={() => setIsLevelTooltipOpen(true)}
                  onBlur={() => setIsLevelTooltipOpen(false)}
                >
                  !
                </button>
                {isLevelTooltipOpen && (
                  <div
                    role="tooltip"
                    className="absolute left-8 top-full z-10 mt-1 w-72 rounded-md bg-gray-900 p-4 text-xs text-white shadow-lg"
                  >
                    <p className="font-semibold mb-2">
                      {t("auth.signup.helpers.levelTooltipLabel")}
                    </p>
                    <p className="leading-relaxed whitespace-pre-line">
                      {t("auth.signup.helpers.levelTooltip")}
                    </p>
                  </div>
                )}
              </div>
              <select
                id="level"
                name="level"
                required
                className="mt-1 block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] text-[color:var(--auth-input-text)] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value as EnglishLevel })
                }
              >
                <option value="" disabled>
                  {t("auth.signup.placeholders.level")}
                </option>
                {ENGLISH_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {t(`profile.info.englishLevels.${option}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="interests"
                className="block text-sm font-medium text-[color:var(--auth-heading)]"
              >
                {t("auth.signup.fields.interests")}
              </label>
              <input
                id="interests"
                name="interests"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("auth.signup.placeholders.interests")}
                value={formData.interests}
                onChange={(e) =>
                  setFormData({ ...formData, interests: e.target.value })
                }
              />
              <p className="text-xs text-[color:var(--auth-subtext)] mt-1">
                {t("auth.signup.helpers.interests")}
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[color:var(--auth-heading)]"
              >
                {t("auth.signup.fields.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("auth.signup.placeholders.password")}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[color:var(--auth-heading)]"
              >
                {t("auth.signup.fields.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("auth.signup.placeholders.confirmPassword")}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[color:var(--auth-heading)]"
              >
                {t("auth.signup.fields.description")}
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("auth.signup.placeholders.description")}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? t("auth.signup.buttons.submitting")
                : t("auth.signup.buttons.submit")}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[color:var(--auth-input-border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[color:var(--auth-bg)] text-[color:var(--auth-subtext)]">
                  {t("auth.signup.divider")}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-[color:var(--auth-input-border)] rounded-md shadow-sm bg-[color:var(--auth-input-bg)] text-sm font-medium text-[color:var(--auth-subtext)] hover:bg-[color:var(--auth-bg)]"
              >
                <span className="sr-only">{t("auth.signup.buttons.googleSr")}</span>
                <span>{t("auth.signup.buttons.google")}</span>
              </button>

              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-[color:var(--auth-input-border)] rounded-md shadow-sm bg-[color:var(--auth-input-bg)] text-sm font-medium text-[color:var(--auth-subtext)] hover:bg-[color:var(--auth-bg)]"
              >
                <span className="sr-only">{t("auth.signup.buttons.githubSr")}</span>
                <span>{t("auth.signup.buttons.github")}</span>
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 rounded-lg border border-[color:var(--auth-input-border)] bg-[color:var(--auth-bg)] p-4">
          <h3 className="text-sm font-medium text-[color:var(--auth-heading)] mb-2">
            {t("auth.signup.helpers.gettingStartedTitle")}
          </h3>
          <p className="text-sm text-[color:var(--auth-subtext)]">
            {t("auth.signup.helpers.gettingStartedDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}
