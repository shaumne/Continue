/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    // Deep navy base to match the design mockup (not pure black).
    text: '#ffffff',
    background: '#0B0F1A',
    backgroundElement: '#161C2E',
    backgroundSelected: '#232A42',
    textSecondary: '#8E94A8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Continue brand + gamification accents (shared across light/dark). */
export const Brand = {
  primary: '#7C5CFC',
  primaryMuted: '#5B45B8',
  xp: '#F5A623',
  streak: '#FF6B4A',
  success: '#2ECC71',
  danger: '#E5484D',
} as const;

/** Per content-type color coding used in Library / Stats / badges. */
export const ContentTypeColors = {
  game: '#7C5CFC',
  movie: '#FF6B4A',
  tv: '#4A9EFF',
  book: '#2ECC71',
  anime: '#E15CFC',
  podcast: '#F5A623',
  youtube: '#E5484D',
  course: '#00C2A8',
} as const;

export type ContentType = keyof typeof ContentTypeColors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
