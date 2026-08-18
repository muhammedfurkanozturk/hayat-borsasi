"use client";

import type { ReactNode } from "react";
import { MenuIcon } from "@/components/icons";
import { useMobileNav } from "@/lib/mobile-nav-context";
import { ProfileMenu } from "./ProfileMenu";

export function PageHeader({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const { toggle } = useMobileNav();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6 sm:py-5 md:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Menüyü aç"
          className="btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-soft text-muted hover:border-accent/40 hover:text-foreground md:hidden"
        >
          <MenuIcon width={18} height={18} />
        </button>

        <div className="flex min-w-0 flex-col gap-1">
          {children ?? (
            <>
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
              {subtitle && <span className="hidden text-xs text-muted sm:inline">{subtitle}</span>}
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {right}
        <ProfileMenu />
      </div>
    </header>
  );
}
