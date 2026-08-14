"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // <html>'e gerçek değer, layout.tsx'teki inline script ile boyamadan önce
  // zaten uygulanmış oluyor (bkz. layout.tsx) — burada sadece React state'ini
  // o mevcut DOM durumuyla eşliyoruz.
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage kapalıysa (gizli sekme vb.) sessizce yoksay.
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı");
  return ctx;
}
