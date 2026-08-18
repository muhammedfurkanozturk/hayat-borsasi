"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Sunucu "document"ı göremediği için ilk render'da her zaman "dark" ile
  // başlıyoruz — sunucunun ürettiği HTML ile birebir aynı olsun diye
  // (aksi halde hydration uyuşmazlığı oluşuyordu). <html>'in gerçek rengi
  // zaten layout.tsx'teki script ile boyanmadan önce doğru ayarlanmış
  // oluyor; burada sadece React state'ini mount olduktan SONRA (yani
  // hydration bittikten sonra, uyuşmazlık yaratmadan) o gerçek değerle
  // senkronluyoruz.
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Mount'ta gerçek tercihi (dış sistem — DOM/localStorage) React state'iyle
    // eşliyoruz; hydration'dan sonra çalıştığı için uyuşmazlık yaratmıyor.
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "light") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState("light");
    }
  }, []);

  function setTheme(next: Theme) {
    // Tema değişince yüzlerce elemanın kendi "transition-colors" özelliği
    // aynı anda, farklı sürelerde tetiklenip kaotik bir "renk patlaması"
    // hissi yaratıyordu. Geçiş anında tüm renk animasyonlarını geçici
    // olarak kapatıp, yeni renkler boyandıktan sonraki karede geri açarak
    // anlık ve temiz bir geçiş sağlıyoruz.
    const root = document.documentElement;
    root.classList.add("theme-switching");
    setThemeState(next);
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage kapalıysa (gizli sekme vb.) sessizce yoksay.
    }
    // requestAnimationFrame arka plandaki/pasif sekmelerde güvenilir
    // tetiklenmiyor — setTimeout, tarayıcının o an render edip etmediğine
    // bakmaksızın sınıfın kesin olarak kaldırılmasını garanti ediyor.
    window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, 60);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı");
  return ctx;
}
