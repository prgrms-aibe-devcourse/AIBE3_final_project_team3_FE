"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear().toString();

  return (
    <footer
      className="app-footer py-8 border-t"
      style={{ backgroundColor: "var(--footer-bg)", borderColor: "var(--footer-border)", color: "var(--footer-text)" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-emerald-400">
              {t("footer.brand.title")}
            </h3>
            <p className="text-[color:var(--footer-muted)]">
              {t("footer.brand.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[color:var(--footer-text)]">
              {t("footer.links.title")}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/chat"
                  className="text-[color:var(--footer-muted)] hover:text-emerald-400 transition-colors"
                >
                  {t("footer.links.chat")}
                </a>
              </li>
              <li>
                <a
                  href="/learning-notes"
                  className="text-[color:var(--footer-muted)] hover:text-emerald-400 transition-colors"
                >
                  {t("footer.links.learningNotes")}
                </a>
              </li>
              <li>
                <a
                  href="/profile"
                  className="text-[color:var(--footer-muted)] hover:text-emerald-400 transition-colors"
                >
                  {t("footer.links.profile")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[color:var(--footer-text)]">
              {t("footer.contact.title")}
            </h4>
            <div className="text-[color:var(--footer-muted)]">
              <p>{t("footer.contact.email")}</p>
              <p>{t("footer.contact.phone")}</p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center" style={{ borderColor: "var(--footer-border)" }}>
          <p className="text-[color:var(--footer-muted)]">
            {t("footer.legal.copyright", { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
