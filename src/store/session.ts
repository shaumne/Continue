import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

// Dismisses the auth popup automatically once the redirect lands (web/native).
WebBrowser.maybeCompleteAuthSession();

/** Result of an auth attempt: error message (localized upstream) or null on success. */
export interface AuthResult {
  error: string | null;
  /** True when sign-up needs email confirmation before a session exists. */
  needsConfirmation?: boolean;
}

interface SessionState {
  session: Session | null;
  /** false until the initial getSession() + listener are wired. */
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  initialized: false,
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If email confirmation is on, no session is returned yet.
    return { error: null, needsConfirmation: !data.session };
  },
  signInWithGoogle: async () => {
    // continue:// on native, http://localhost:8081/ on web. This exact prefix
    // must be allowlisted in Supabase → Auth → URL Configuration → Redirect URLs.
    const redirectTo = Linking.createURL('/');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return { error: error.message };
    if (!data?.url) return { error: 'Could not start Google sign-in' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    // User closed the sheet or hit back — not an error, just no session.
    if (result.type !== 'success' || !result.url) return { error: null };

    // PKCE: pull the `code` off the redirect and exchange it for a session.
    const { queryParams } = Linking.parse(result.url);
    const code = typeof queryParams?.code === 'string' ? queryParams.code : null;
    const providerError =
      typeof queryParams?.error_description === 'string'
        ? queryParams.error_description
        : null;
    if (providerError) return { error: providerError };
    if (!code) return { error: null };

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: exchangeError?.message ?? null };
    // On success, onAuthStateChange swaps the auth screen out.
  },
  signOut: async () => {
    await supabase.auth.signOut();
  },
}));

/**
 * Wire Supabase auth into the store. Call once at app root.
 * Returns an unsubscribe function.
 */
export function initSessionListener() {
  supabase.auth.getSession().then(({ data }) => {
    useSession.setState({ session: data.session, initialized: true });
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useSession.setState({ session, initialized: true });
  });

  return () => data.subscription.unsubscribe();
}
