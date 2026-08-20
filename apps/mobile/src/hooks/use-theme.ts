/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Elevation } from '@/constants/theme';
import { useThemeMode } from '@/lib/theme-context';

export function useTheme() {
  return useThemeMode().colors;
}

// Input/kart yüzeylerine derinlik vermek için: style dizisine spread edilir,
// örn. style={[styles.input, { backgroundColor: theme.backgroundSelected }, useElevatedStyle()]}
export function useElevatedStyle() {
  return Elevation[useThemeMode().theme];
}
