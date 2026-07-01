import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  getDeviceLanguage,
  initI18n,
  type SupportedLanguage,
} from '@/i18n';

interface LanguageState {
  /** Explicit user choice; null = follow device locale. */
  override: SupportedLanguage | null;
  /** Effective language currently applied to i18n. */
  resolved: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage | null) => void;
}

function resolve(override: SupportedLanguage | null): SupportedLanguage {
  return override ?? getDeviceLanguage();
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      override: null,
      resolved: resolve(null),
      setLanguage: (lang) => {
        const resolved = resolve(lang);
        initI18n(resolved);
        set({ override: lang, resolved });
      },
    }),
    {
      name: 'continue.language',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ override: s.override }),
      // After rehydrating the persisted override, apply it to i18n.
      onRehydrateStorage: () => (state) => {
        const resolved = resolve(state?.override ?? null);
        initI18n(resolved);
        state?.setLanguage(state.override);
      },
    },
  ),
);
