import { TrendUpIcon } from "@/components/icons";

export function LandingFooter() {
  return (
    <footer className="border-t border-border-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:px-10">
        <div className="flex items-center gap-2">
          <TrendUpIcon width={14} height={14} className="text-muted" />
          <span>Hayat Borsası</span>
        </div>
        <span className="text-xs text-muted-soft">© 2026 Hayat Borsası. Tüm hakları saklıdır.</span>
      </div>
    </footer>
  );
}
