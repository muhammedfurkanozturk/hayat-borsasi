import { flushSync } from "react-dom";
import type { Theme } from "@/lib/theme-context";

// MagicUI'nin "Animated Theme Toggler" component'inden ilham (kaynak:
// magicui.design/r/animated-theme-toggler.json, resmi shadcn registry
// endpoint'i üzerinden gerçek kaynak kodu çekildi) — ama birebir kopyalanıp
// kurulmadı, projemize göre uyarlandı:
// - classList.toggle("dark") yerine mevcut theme-context.tsx'in gerçek
//   setTheme'i çağrılıyor (biz `data-theme` attribute kullanıyoruz, class
//   değil — localStorage/attribute/theme-switching-flicker bastırma zaten
//   orada, burada tekrarlanmadı).
// - lucide-react'in Moon/Sun'ı yerine kendi icons.tsx'imiz kullanılıyor
//   (çağıran taraf ikonu kendi seçiyor, bu dosya sadece animasyonu yapıyor).
// - Sadece "circle" varyantı taşındı (kullanıcı bunu zaten önerdi, diğer 6
//   şekil — square/triangle/diamond/hexagon/rectangle/star — kapsam dışı
//   bırakıldı, bilinçli bir sadeleştirme).
// - prefers-reduced-motion'a saygı EKLENDİ (orijinalde yoktu) — CLAUDE.md'nin
//   genel erişilebilirlik kuralına uymak için.
let transitioning = false;

function circleClipPaths(cx: number, cy: number, maxRadius: number, vw: number, vh: number): [string, string] {
  const toX = (x: number) => `${(x / vw) * 100}%`;
  const toY = (y: number) => `${(y / vh) * 100}%`;
  // circle() yüzde yarıçapı, referans kutunun hypot(w,h)/√2'sine göre çözülür.
  const toRadius = (r: number) => `${(r / (Math.hypot(vw, vh) / Math.SQRT2)) * 100}%`;
  return [`circle(0% at ${toX(cx)} ${toY(cy)})`, `circle(${toRadius(maxRadius)} at ${toX(cx)} ${toY(cy)})`];
}

export function runAnimatedThemeTransition({
  origin,
  nextTheme,
  setTheme,
  duration = 400,
}: {
  origin: { x: number; y: number } | "center";
  nextTheme: Theme;
  setTheme: (theme: Theme) => void;
  duration?: number;
}) {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (
    transitioning ||
    prefersReducedMotion ||
    typeof document === "undefined" ||
    typeof document.startViewTransition !== "function"
  ) {
    setTheme(nextTheme);
    return;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const { x, y } = origin === "center" ? { x: vw / 2, y: vh / 2 } : origin;
  const maxRadius = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
  const clipPath = circleClipPaths(x, y, maxRadius, vw, vh);

  const root = document.documentElement;
  root.dataset.themeVt = "active";
  root.style.setProperty("--theme-vt-clip-from", clipPath[0]);

  function cleanup() {
    transitioning = false;
    delete root.dataset.themeVt;
    root.style.removeProperty("--theme-vt-clip-from");
  }

  transitioning = true;
  const transition = document.startViewTransition(() => {
    flushSync(() => setTheme(nextTheme));
  });
  transition.finished.finally(cleanup).catch(() => {});
  transition.ready
    .then(() => {
      root.animate(
        { clipPath },
        { duration, easing: "ease-in-out", fill: "forwards", pseudoElement: "::view-transition-new(root)" }
      );
    })
    .catch(() => {});
}
