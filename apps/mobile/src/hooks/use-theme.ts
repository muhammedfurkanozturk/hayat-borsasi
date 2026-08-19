/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemeMode } from '@/lib/theme-context';

export function useTheme() {
  return useThemeMode().colors;
}
