"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useLogin } from "@/global/api/useAuthQuery";
import { useLoginStore } from "@/global/stores/useLoginStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { t } = useLanguage();
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const setAccountEmail = useLoginStore((state) => state.setAccountEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    login(formData, {
      onSuccess: () => {
        setAccountEmail(formData.email);
        // 로그인 성공 시 채팅 페이지로 이동
        router.push("/chat");
      },
      onError: (error) => {
        // 로그인 실패 시 에러 메시지 표시
        console.error("Login failed:", error);
        alert(`${t("auth.login.alerts.failure")}: ${error.message}`);
      },
    });
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[color:var(--auth-heading)]">
            {t("auth.login.title")}
          </h2>
          <p className="mt-2 text-center text-sm text-[color:var(--auth-subtext)]">
            {t("auth.login.subtitlePrefix")}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t("auth.login.subtitleLink")}
            </Link>
            {t("auth.login.subtitleSuffix")}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {t("auth.login.fields.email")}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t("auth.login.placeholders.email")}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t("auth.login.fields.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[color:var(--auth-input-border)] bg-[color:var(--auth-input-bg)] placeholder:text-[color:var(--auth-input-placeholder)] text-[color:var(--auth-input-text)] rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t("auth.login.placeholders.password")}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-[color:var(--auth-input-border)] rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-[color:var(--auth-heading)]"
              >
                {t("auth.login.options.remember")}
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t("auth.login.options.forgot")}
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? t("auth.login.buttons.submitting")
                : t("auth.login.buttons.submit")}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[color:var(--auth-input-border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[color:var(--auth-bg)] text-[color:var(--auth-subtext)]">
                  {t("auth.login.divider")}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-[color:var(--auth-input-border)] rounded-md shadow-sm bg-[color:var(--auth-input-bg)] text-sm font-medium text-[color:var(--auth-subtext)] hover:bg-[color:var(--auth-bg)]"
              >
                <span className="sr-only">
                  {t("auth.login.buttons.googleSr")}
                </span>
                <span>{t("auth.login.buttons.google")}</span>
              </button>

              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-[color:var(--auth-input-border)] rounded-md shadow-sm bg-[color:var(--auth-input-bg)] text-sm font-medium text-[color:var(--auth-subtext)] hover:bg-[color:var(--auth-bg)]"
              >
                <span className="sr-only">
                  {t("auth.login.buttons.githubSr")}
                </span>
                <span>{t("auth.login.buttons.github")}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
