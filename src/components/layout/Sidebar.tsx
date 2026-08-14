"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppIcon,
  BadgeIcon,
  FileTextIcon,
  ListCheckIcon,
  PencilIcon,
  TrendUpIcon,
} from "@/components/icons";
import { useAppData } from "@/lib/supabase/app-data-context";

const activeNavItems = [
  { label: "Günlükler", icon: PencilIcon, href: "/gunluk-giris", pro: false },
  { label: "AI Rapor", icon: FileTextIcon, href: "/rapor", pro: true },
  { label: "Karakter Kartı", icon: BadgeIcon, href: "/karakter-karti", pro: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const { categories, loading } = useAppData();
  const isCategorySectionActive = pathname.startsWith("/kategori/");

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background-elevated">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <TrendUpIcon width={16} height={16} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">Hayat Borsası</span>
      </Link>

      <nav className="flex flex-col gap-0.5 px-3">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
            pathname === "/dashboard" ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          <TrendUpIcon width={16} height={16} />
          Dashboard
        </Link>

        <div className="mt-2 flex items-center gap-2 px-3 py-1">
          <ListCheckIcon
            width={14}
            height={14}
            className={isCategorySectionActive ? "text-accent" : "text-muted-soft"}
          />
          <span
            className={`text-xs font-medium uppercase tracking-wider ${
              isCategorySectionActive ? "text-accent" : "text-muted-soft"
            }`}
          >
            Kategoriler
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          {loading ? (
            <div className="flex flex-col gap-1.5 py-1 pl-8 pr-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 animate-pulse rounded-md bg-surface-hover" />
              ))}
            </div>
          ) : (
            categories.map((category) => {
              const href = `/kategori/${category.id}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={category.id}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg py-1.5 pl-8 pr-3 text-sm ${
                    isActive ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                  }`}
                >
                  <AppIcon name={category.icon} width={14} height={14} />
                  <span className="truncate">{category.name}</span>
                </Link>
              );
            })
          )}
        </div>

        <div className="mt-2 flex flex-col gap-0.5">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                <Icon width={16} height={16} />
                <span className="flex-1">{item.label}</span>
                {item.pro && (
                  <span className="rounded-full bg-pro-soft px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-pro">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
