"use client";

import Link from "next/link";
import { useRef } from "react";
import { MoonStarIcon, SunIcon, TrendUpIcon } from "@/components/icons";
import { MotionCtaLink } from "@/components/ui/MotionCtaLink";
import { runAnimatedThemeTransition } from "@/lib/animated-theme-transition";
import { useTheme } from "@/lib/theme-context";

export function LandingNav() {
  const { theme, setTheme } = useTheme();
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  function handleThemeToggle() {
    const next = theme === "dark" ? "light" : "dark";
    const rect = themeButtonRef.current?.getBoundingClientRect();
    const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : ("center" as const);
    runAnimatedThemeTransition({ origin, nextTheme: next, setTheme });
  }

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 bg-background/70 backdrop-blur-md"
      style={{
        maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5 md:px-10">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent sm:h-8 sm:w-8">
            <TrendUpIcon width={16} height={16} />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight whitespace-nowrap text-foreground">
            Hayat Borsası
          </span>
        </div>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            ref={themeButtonRef}
            type="button"
            onClick={handleThemeToggle}
            aria-label="Temayı değiştir"
            className="btn flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-surface-hover hover:text-accent sm:h-9 sm:w-9"
          >
            {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonStarIcon width={16} height={16} />}
          </button>
          <Link
            href="/giris"
            className="btn hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:text-accent sm:inline-flex"
          >
            Giriş Yap
          </Link>
          <MotionCtaLink
            href="/kayit"
            className="whitespace-nowrap rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset] transition-colors hover:brightness-110 sm:px-4"
          >
            Ücretsiz Başla
          </MotionCtaLink>
        </nav>
      </div>
    </header>
  );
}
