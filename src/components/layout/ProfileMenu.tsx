"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CrownIcon, GearIcon, SignOutIcon } from "@/components/icons";
import { useTheme } from "@/lib/theme-context";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/supabase/profile-context";
import { Avatar } from "./Avatar";

export function ProfileMenu() {
  const router = useRouter();
  const { displayName, isPro } = useProfile();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
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
        className="transition-opacity hover:opacity-90"
      >
        <Avatar initial={initial} isPro={isPro} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-background-elevated p-1.5 shadow-lg">
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
            <div className="flex items-center gap-1 rounded-lg border border-border-soft bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  theme === "dark" ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                Koyu
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  theme === "light" ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                Açık
              </button>
            </div>
          </div>

          <div className="my-1 border-t border-border-soft" />

          <Link
            href="/ayarlar"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <GearIcon width={16} height={16} />
            Ayarlar
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          >
            <SignOutIcon width={16} height={16} />
            {signingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </button>
        </div>
      )}
    </div>
  );
}
