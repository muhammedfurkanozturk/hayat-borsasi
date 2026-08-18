"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AppIcon,
  BadgeIcon,
  ChevronDownIcon,
  FileTextIcon,
  ListCheckIcon,
  PencilIcon,
  TrendUpIcon,
} from "@/components/icons";
import { useMobileNav } from "@/lib/mobile-nav-context";
import { useAppData } from "@/lib/supabase/app-data-context";

const activeNavItems = [
  { label: "Günlükler", icon: PencilIcon, href: "/gunluk-giris", pro: false },
  { label: "AI Rapor", icon: FileTextIcon, href: "/rapor", pro: true },
  { label: "Karakter Kartı", icon: BadgeIcon, href: "/karakter-karti", pro: false },
];

const pillSpring = { type: "spring", stiffness: 500, damping: 34, mass: 0.9 } as const;
const arrowTransition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

// Sidebar'daki her satır (Dashboard, kategori, alt nav) aynı davranışı
// paylaşıyor: aktif satırın arkasındaki vurgu tek bir Motion `layoutId` ile
// satırlar arasında yay fiziğiyle "akıyor" (sayfa geçişlerinde de), hover'da
// ise sağda ok işareti kayarak beliriyor — 21st.dev'deki menu-vertical
// bileşeninin kompakt sidebar'a uyarlanmış hali. Hover durumu Next.js
// `Link`'in üzerinde Motion variant propagation yerine bilerek kendi
// state'imizle yönetiliyor — nested motion(Link) üzerinde whileHover'ın
// güvenilir tetiklenmediği görüldü.
function SidebarLink({
  href,
  isActive,
  onClick,
  icon,
  compact,
  pro,
  children,
}: {
  href: string;
  isActive: boolean;
  onClick: () => void;
  icon: ReactNode;
  compact?: boolean;
  pro?: boolean;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`btn relative flex items-center gap-3 overflow-hidden rounded-lg text-sm ${
        compact ? "py-1.5 pl-8 pr-3" : "px-3 py-2 font-medium"
      } ${isActive ? "text-accent" : "text-muted hover:text-foreground"}`}
    >
      {isActive ? (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-lg bg-accent-soft"
          transition={pillSpring}
        />
      ) : (
        <motion.span
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 rounded-lg bg-surface-hover"
        />
      )}
      <span className="relative z-10 shrink-0">{icon}</span>
      <span className="relative z-10 flex-1 truncate">{children}</span>
      {pro && (
        <span className="relative z-10 rounded-full bg-pro-soft px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-pro">
          PRO
        </span>
      )}
      <motion.span
        animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -6 }}
        transition={arrowTransition}
        className="relative z-10 shrink-0 text-accent"
      >
        <ChevronDownIcon width={12} height={12} strokeWidth={2.5} className="-rotate-90" />
      </motion.span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { categories, loading } = useAppData();
  const { open, setOpen } = useMobileNav();
  const isCategorySectionActive = pathname.startsWith("/kategori/");
  const [categoriesOpen, setCategoriesOpen] = useState(true);

  function closeMobileNav() {
    setOpen(false);
  }

  return (
    <>
      {/* Mobilde çekmece açıkken arka planı karartan, tıklanınca kapatan katman. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={closeMobileNav}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-background-elevated transition-transform md:static md:z-auto md:w-56 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ transitionDuration: "var(--dur-slow)", transitionTimingFunction: "var(--ease-snap)" }}
      >
        <Link href="/dashboard" onClick={closeMobileNav} className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <TrendUpIcon width={16} height={16} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Hayat Borsası</span>
        </Link>

        <nav className="flex flex-col gap-0.5 overflow-y-auto px-3 pb-4">
          <SidebarLink
            href="/dashboard"
            isActive={pathname === "/dashboard"}
            onClick={closeMobileNav}
            icon={<TrendUpIcon width={16} height={16} />}
          >
            Dashboard
          </SidebarLink>

          <button
            type="button"
            onClick={() => setCategoriesOpen((v) => !v)}
            className="btn mt-2 flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-hover"
          >
            <ListCheckIcon width={15} height={15} className={isCategorySectionActive ? "text-accent" : "text-muted"} />
            <span
              className={`flex-1 text-left text-sm font-semibold ${
                isCategorySectionActive ? "text-accent" : "text-foreground"
              }`}
            >
              Kategoriler
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background-elevated shadow-card">
              <ChevronDownIcon
                width={14}
                height={14}
                strokeWidth={2.5}
                className={`text-accent transition-transform ${categoriesOpen ? "" : "-rotate-90"}`}
                style={{ transitionDuration: "var(--dur-base)", transitionTimingFunction: "var(--ease-snap)" }}
              />
            </div>
          </button>

          <AnimatePresence initial={false}>
            {categoriesOpen && (
              <motion.div
                key="categories"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-0.5 pt-0.5">
                  {loading ? (
                    <div className="flex flex-col gap-1.5 py-1 pl-8 pr-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-5 animate-pulse rounded-md bg-surface-hover" />
                      ))}
                    </div>
                  ) : (
                    categories.map((category) => {
                      const href = `/kategori/${category.id}`;
                      return (
                        <SidebarLink
                          key={category.id}
                          href={href}
                          isActive={pathname === href}
                          onClick={closeMobileNav}
                          compact
                          icon={<AppIcon name={category.icon} width={14} height={14} />}
                        >
                          {category.name}
                        </SidebarLink>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-2 flex flex-col gap-0.5">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarLink
                  key={item.label}
                  href={item.href}
                  isActive={pathname === item.href}
                  onClick={closeMobileNav}
                  pro={item.pro}
                  icon={<Icon width={16} height={16} />}
                >
                  {item.label}
                </SidebarLink>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
