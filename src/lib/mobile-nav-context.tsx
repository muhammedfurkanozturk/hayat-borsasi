"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface MobileNavContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

// Mobilde sidebar'ı bir çekmece (drawer) olarak açıp kapatmak için — Sidebar
// ve PageHeader (hamburger butonu) ayrı ağaçlarda olduğundan state'i burada
// paylaşıyoruz.
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{ open, setOpen, toggle: () => setOpen((v) => !v) }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav, MobileNavProvider içinde kullanılmalı");
  return ctx;
}
