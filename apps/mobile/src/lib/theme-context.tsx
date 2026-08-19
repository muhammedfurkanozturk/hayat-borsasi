import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Colors, type ThemeColor, type ThemeColors } from "@/constants/theme";

export type Theme = "dark" | "light";

const STORAGE_KEY = "hayat-borsasi-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Web'deki gibi koyu tema varsayılan — kullanıcı elle değiştirmediyse
// cihazın sistem temasını takip etmiyoruz, sabit koyu ile başlıyoruz.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "dark" || stored === "light") setThemeState(stored);
    });
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: Colors[theme] }}>{children}</ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode, ThemeProvider içinde kullanılmalı");
  return ctx;
}

export type { ThemeColor };
