import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

interface SessionState {
  session: Session | null;
  /** false until the initial getSession() + listener are wired. */
  initialized: boolean;
  signOut: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  initialized: false,
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
