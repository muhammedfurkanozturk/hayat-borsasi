"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CrownIcon, GearIcon, MoonStarIcon, SignOutIcon, SunIcon } from "@/components/icons";
import { runAnimatedThemeTransition } from "@/lib/animated-theme-transition";
import { useTheme } from "@/lib/theme-context";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/supabase/profile-context";
import { Avatar } from "./Avatar";

export function ProfileMenu() {
  const router = useRouter();
  const { displayName, isPro } = useProfile();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  // 2026-08-26: Koyu/Açık iki pillik segmented control yerine, tanıtım
  // sayfasındaki (LandingNav.tsx) gibi TEK güneş/ay ikon butonuna çevrildi
  // — kullanıcı isteği. Artık gerçek buton referansımız olduğu için geçiş
  // "ekran ortası" yerine bu butonun gerçek konumundan açılıyor.
  function handleThemeToggle() {
    const next = theme === "dark" ? "light" : "dark";
    const rect = themeButtonRef.current?.getBoundingClientRect();
    const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : ("center" as const);
    runAnimatedThemeTransition({ origin, nextTheme: next, setTheme });
  }
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Profil menüsü"
        aria-expanded={open}
        className="btn rounded-full hover:opacity-90"
      >
        <Avatar initial={initial} isPro={isPro} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.8 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-background-elevated p-1.5 shadow-lg"
          >
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <Avatar initial={initial} size="sm" isPro={isPro} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
                {isPro && (
                  <span className="flex w-fit items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-pro">
                    <CrownIcon width={10} height={10} strokeWidth={2.5} />
                    Pro Üye
                  </span>
                )}
              </div>
            </div>

            <div className="my-1 border-t border-border-soft" />

            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
              <span className="text-xs text-muted">Tema</span>
              <button
                ref={themeButtonRef}
                type="button"
                onClick={handleThemeToggle}
                aria-label="Temayı değiştir"
                className="btn flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-surface-hover hover:text-accent"
              >
                {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonStarIcon width={16} height={16} />}
              </button>
            </div>

            <div className="my-1 border-t border-border-soft" />

            <Link
              href="/ayarlar"
              onClick={() => setOpen(false)}
              className="btn flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground"
            >
              <GearIcon width={16} height={16} />
              Ayarlar
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="btn flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            >
              <SignOutIcon width={16} height={16} />
              {signingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
