import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loud in dev; env is wired via .env (EXPO_PUBLIC_* auto-exposed by Expo).
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // RN has no URL to parse; OAuth is handled via deep links, not URL detection.
    detectSessionInUrl: false,
    // PKCE: the redirect returns a `code` we exchange for a session (see
    // signInWithGoogle in src/store/session.ts). More secure than implicit on
    // mobile, and the code verifier is persisted in AsyncStorage for us.
    flowType: 'pkce',
  },
});
