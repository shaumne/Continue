import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ja from './locales/ja.json';
import tr from './locales/tr.json';

export const SUPPORTED_LANGUAGES = ['en', 'tr', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  ja: { translation: ja },
} as const;

/** First supported language from the device, else the fallback. */
export function getDeviceLanguage(): SupportedLanguage {
  for (const locale of getLocales()) {
    const code = locale.languageCode as SupportedLanguage | null;
    if (code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code)) {
      return code;
    }
  }
  return FALLBACK_LANGUAGE;
}

/** Map an app language to the provider locale used by TMDB / AniList etc. */
export function toProviderLocale(lang: SupportedLanguage): string {
  return { en: 'en-US', tr: 'tr-TR', ja: 'ja-JP' }[lang];
}

let initialized = false;

export function initI18n(language: SupportedLanguage) {
  if (initialized) {
    void i18n.changeLanguage(language);
    return i18n;
  }
  void i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  initialized = true;
  return i18n;
}

export default i18n;
