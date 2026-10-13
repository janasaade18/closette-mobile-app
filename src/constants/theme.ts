/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#12263F',
    text: '#12263F',
    background: '#F5F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7EEF6',
    textSecondary: '#6E7C90',
    border: '#E4E8EF',
    onPrimary: '#FFFFFF',
    sand: '#E7D5B8',
    bubble: '#D7E2F0',
    canvas: '#F5F7FB',
    navySoft: '#1C3558',
    onPrimaryMuted: '#D5DEEA',
    outlineOnNavy: '#8EA0B8',
    slate: '#7E93AB',
  },

  dark: {
    primary: '#12263F',
    text: '#F5F7FB',
    background: '#0C1726',
    backgroundElement: '#18283C',
    backgroundSelected: '#24384F',
    textSecondary: '#B7C3D1',
    border: '#2C4158',
    onPrimary: '#FFFFFF',
    sand: '#E7D5B8',
    bubble: '#D7E2F0',
    canvas: '#0C1726',
    navySoft: '#1C3558',
    onPrimaryMuted: '#D5DEEA',
    outlineOnNavy: '#8EA0B8',
    slate: '#7E93AB',
  },
} as const;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Fredoka for display, Nunito for reading text. Both are the Google fonts in the onboarding designs. */
export const Typeface = {
  display: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  body: 'Nunito_600SemiBold',
  bodyStrong: 'Nunito_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: Typeface.body,
    serif: 'ui-serif',
    rounded: Typeface.display,
    mono: 'ui-monospace',
  },
  default: {
    sans: Typeface.body,
    serif: 'serif',
    rounded: Typeface.display,
    mono: 'monospace',
  },
  web: {
    sans: Typeface.body,
    serif: 'var(--font-serif)',
    rounded: Typeface.display,
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
