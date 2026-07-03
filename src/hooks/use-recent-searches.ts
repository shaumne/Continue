import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Cap the persisted list so it stays a quick "recent" glance, not a history log. */
const MAX_RECENT = 8;

interface RecentSearchesState {
  queries: string[];
  /** Push a query to the front, de-duped (case-insensitive), capped at MAX_RECENT. */
  add: (query: string) => void;
  clear: () => void;
}

/**
 * Small AsyncStorage-backed store of the user's last searches on the Add
 * Content screen. Mirrors the persist() pattern used by `src/store/language.ts`.
 */
export const useRecentSearches = create<RecentSearchesState>()(
  persist(
    (set) => ({
      queries: [],
      add: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        set((state) => ({
          queries: [
            trimmed,
            ...state.queries.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
          ].slice(0, MAX_RECENT),
        }));
      },
      clear: () => set({ queries: [] }),
    }),
    {
      name: 'continue.recentSearches',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
