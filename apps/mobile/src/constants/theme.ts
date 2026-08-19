/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Web'deki (globals.css) borsa terminali paletiyle eşleşir — koyu tema
// varsayılan (bkz. CLAUDE.md bölüm 7).
export const Colors = {
  light: {
    text: '#1d1d1f',
    background: '#f5f5f7',
    backgroundElement: '#ffffff',
    backgroundSelected: '#f0f0f2',
    textSecondary: '#48484c',
    border: '#e8e8ed',
    accent: '#0071e3',
    positive: '#16a34a',
    negative: '#dc2626',
  },
  dark: {
    text: '#e5e7eb',
    background: '#040506',
    backgroundElement: '#0a0c0f',
    backgroundSelected: '#15191e',
    textSecondary: '#9ba0ab',
    border: '#1a212b',
    accent: '#0ad1eb',
    positive: '#36d39f',
    negative: '#f43e5c',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColors = Record<ThemeColor, string>;

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
