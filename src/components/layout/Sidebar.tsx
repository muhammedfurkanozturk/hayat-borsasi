"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
const COLLAPSE_COOKIE = "sidebar-collapsed";

// Daraltılmışken ikonun sağında beliren küçük tooltip — `nav`'ın kendi
// `overflow-y-auto`'su (çok kategori olursa kaydırma için) yüzünden basit
// bir CSS `absolute` + `group-hover` tooltip kırpılıyordu (bir eksen "auto"
// olunca CSS'in kendi kuralı diğer ekseni de "visible" yerine "auto" yapıyor,
// MDN). Bunun yerine `document.body`'ye portal'lanan, `position: fixed` ile
// ankraj elemanının gerçek ekran konumundan hesaplanan bir tooltip —
// hiçbir ata konteynerin overflow'undan etkilenmiyor.
function CollapsedTooltip({ label, anchorRef, visible }: { label: string; anchorRef: React.RefObject<HTMLElement | null>; visible: boolean }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPos(null);
      return;
    }
    const rect = anchorRef.current?.getBoundingClientRect();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (rect) setPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  }, [visible, anchorRef]);

  if (!visible || !pos || typeof document === "undefined") return null;

  return createPortal(
    <span
      role="tooltip"
      style={{ top: pos.top, left: pos.left }}
      className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-background-elevated px-2 py-1 text-xs font-medium text-foreground shadow-card"
    >
      {label}
    </span>,
    document.body
  );
}

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
  collapsed,
  pro,
  children,
}: {
  href: string;
  isActive: boolean;
  onClick: () => void;
  icon: ReactNode;
  compact?: boolean;
  collapsed?: boolean;
  pro?: boolean;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const label = typeof children === "string" ? children : undefined;
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={linkRef}
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={collapsed ? label : undefined}
      className={`group btn relative flex items-center overflow-visible rounded-lg text-sm ${
        collapsed ? "justify-center px-0 py-2" : compact ? "gap-3 py-1.5 pl-8 pr-3" : "gap-3 px-3 py-2 font-medium"
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
      {!collapsed && (
        <>
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
        </>
      )}
      {collapsed && label && <CollapsedTooltip label={label} anchorRef={linkRef} visible={hovered} />}
    </Link>
  );
}

export function Sidebar({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const pathname = usePathname();
  const { categories, loading } = useAppData();
  const { open, setOpen, toggle: toggleMobileNav } = useMobileNav();
  const isCategorySectionActive = pathname.startsWith("/kategori/");
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function closeMobileNav() {
    setOpen(false);
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        document.cookie = `${COLLAPSE_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000`;
      } catch {
        // Çerezler kapalıysa (gizli sekme vb.) sadece bu oturumda hatırlanır.
      }
      return next;
    });
  }

  // Ctrl/Cmd+B — shadcn'in kendi Sidebar'ında da kullanılan, artık yaygın
  // bilinen bir kısayol. Masaüstünde daraltmayı, mobilde çekmeceyi açıp
  // kapatır (o an hangisi görünüyorsa).
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 768px)").matches) {
          toggleCollapsed();
        } else {
          toggleMobileNav();
        }
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-background-elevated transition-transform md:static md:z-auto md:translate-x-0 ${
          collapsed ? "md:w-[68px]" : "md:w-56"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ transitionDuration: "var(--dur-slow)", transitionTimingFunction: "var(--ease-snap)" }}
      >
        <div className={`flex items-center gap-2 px-5 py-5 ${collapsed ? "md:justify-center md:px-0" : "justify-between"}`}>
          <Link href="/dashboard" onClick={closeMobileNav} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <TrendUpIcon width={16} height={16} />
            </div>
            {!collapsed && <span className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">Hayat Borsası</span>}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Sidebar'ı daralt"
              className="btn hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground md:flex"
            >
              <ChevronDownIcon width={14} height={14} strokeWidth={2.5} className="rotate-90" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Sidebar'ı genişlet"
            className="btn mx-auto mb-2 hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground md:flex"
          >
            <ChevronDownIcon width={14} height={14} strokeWidth={2.5} className="-rotate-90" />
          </button>
        )}

        <nav className={`flex flex-col gap-0.5 overflow-y-auto overflow-x-visible pb-4 ${collapsed ? "md:px-2" : "px-3"}`}>
          <SidebarLink
            href="/dashboard"
            isActive={pathname === "/dashboard"}
            onClick={closeMobileNav}
            collapsed={collapsed}
            icon={<TrendUpIcon width={16} height={16} />}
          >
            Dashboard
          </SidebarLink>

          {!collapsed && (
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
          )}

          {/* Daraltılmışken kategori grubunun kendi aç/kapa'sı devre dışı —
              sadece ikonlar, alt alta, tooltip'le tanınıyor. */}
          <AnimatePresence initial={false}>
            {(collapsed || categoriesOpen) && (
              <motion.div
                key="categories"
                initial={collapsed ? false : { height: 0, opacity: 0 }}
                animate={collapsed ? { height: "auto", opacity: 1 } : { height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={collapsed ? "" : "overflow-hidden"}
              >
                <div className={`flex flex-col gap-0.5 ${collapsed ? "mt-2 border-t border-border-soft pt-2" : "pt-0.5"}`}>
                  {loading ? (
                    <div className={`flex flex-col gap-1.5 py-1 ${collapsed ? "" : "pl-8 pr-3"}`}>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-5 animate-pulse rounded-md bg-surface-hover" />
                      ))}
                    </div>
                  ) : (
                    categories.map((category) => {
                      const href = `/kategori/${category.slug ?? category.id}`;
                      return (
                        <SidebarLink
                          key={category.id}
                          href={href}
                          isActive={pathname === href}
                          onClick={closeMobileNav}
                          compact={!collapsed}
                          collapsed={collapsed}
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

          <div className={`flex flex-col gap-0.5 ${collapsed ? "mt-2 border-t border-border-soft pt-2" : "mt-2"}`}>
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarLink
                  key={item.label}
                  href={item.href}
                  isActive={pathname === item.href}
                  onClick={closeMobileNav}
                  collapsed={collapsed}
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
