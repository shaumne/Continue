import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthScreen } from '@/components/auth/auth-screen';
import AppTabs from '@/components/app-tabs';
import { getDeviceLanguage, initI18n } from '@/i18n';
import { queryClient } from '@/lib/query-client';
import { useLanguage } from '@/store/language';
import { initSessionListener, useSession } from '@/store/session';

SplashScreen.preventAutoHideAsync();

// Initialize i18n synchronously with the device locale so t() works on first
// render; the persisted language override (if any) is applied on rehydrate.
initI18n(getDeviceLanguage());

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // Subscribe so the component re-renders when the language changes.
  useLanguage((s) => s.resolved);

  const initialized = useSession((s) => s.initialized);
  const session = useSession((s) => s.session);

  useEffect(() => {
    const unsubscribe = initSessionListener();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initialized) SplashScreen.hideAsync();
  }, [initialized]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {/* Session guard: no session -> auth; otherwise the tab app. */}
        {!initialized ? null : session ? <AppTabs /> : <AuthScreen />}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
