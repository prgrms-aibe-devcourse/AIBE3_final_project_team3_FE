"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import adminEn from "../i18n/locales/admin/en.json";
import adminKo from "../i18n/locales/admin/ko.json";
import authEn from "../i18n/locales/auth/en.json";
import authKo from "../i18n/locales/auth/ko.json";
import chatEn from "../i18n/locales/chat/en.json";
import chatKo from "../i18n/locales/chat/ko.json";
import commonEn from "../i18n/locales/common/en.json";
import commonKo from "../i18n/locales/common/ko.json";
import findEn from "../i18n/locales/find/en.json";
import findKo from "../i18n/locales/find/ko.json";
import learningNotesEn from "../i18n/locales/learningNotes/en.json";
import learningNotesKo from "../i18n/locales/learningNotes/ko.json";
import miniGameEn from "../i18n/locales/miniGame/en.json";
import miniGameKo from "../i18n/locales/miniGame/ko.json";
import profileEn from "../i18n/locales/profile/en.json";
import profileKo from "../i18n/locales/profile/ko.json";

type Language = 'ko' | 'en';
type Translations = typeof commonKo & {
  admin: typeof adminKo;
  auth: typeof authKo;
  chat: typeof chatKo;
  find: typeof findKo;
  learningNotes: typeof learningNotesKo;
  miniGame: typeof miniGameKo;
  profile: typeof profileKo;
};

const translations: Record<Language, Translations> = {
  ko: {
    ...commonKo,
    admin: adminKo,
    auth: authKo,
    chat: chatKo,
    find: findKo,
    learningNotes: learningNotesKo,
    miniGame: miniGameKo,
    profile: profileKo,
  },
  en: {
    ...commonEn,
    admin: adminEn,
    auth: authEn,
    chat: chatEn,
    find: findEn,
    learningNotes: learningNotesEn,
    miniGame: miniGameEn,
    profile: profileEn,
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('ko');

  useEffect(() => {
    // 로컬 스토리지에서 언어 설정 불러오기
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as any)[k];
      } else {
        return key; // 키를 찾을 수 없으면 키 자체 반환
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [key, val]) => {
        return acc.replace(new RegExp(`{${key}}`, 'g'), val);
      }, value);
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};