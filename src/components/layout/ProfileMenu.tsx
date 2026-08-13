"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GearIcon, SignOutIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/supabase/profile-context";

function Avatar({ initial, size = "md" }: { initial: string; size?: "sm" | "md" }) {
  const dimension = size === "md" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  return (
    <div
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-white`}
    >
      {initial}
    </div>
  );
}

export function ProfileMenu() {
  const router = useRouter();
  const { displayName } = useProfile();
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
        <Avatar initial={initial} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-background-elevated p-1.5 shadow-lg">
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar initial={initial} size="sm" />
            <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
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
