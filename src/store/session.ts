import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

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
