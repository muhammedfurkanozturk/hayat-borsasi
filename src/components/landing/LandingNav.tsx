import Link from "next/link";
import { TrendUpIcon } from "@/components/icons";

export function LandingNav() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <TrendUpIcon width={16} height={16} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">Hayat Borsası</span>
      </div>

      <nav className="flex items-center gap-2">
        <Link
          href="/giris"
          className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground sm:inline-flex"
        >
          Giriş Yap
        </Link>
        <Link
          href="/kayit"
          className="rounded-lg bg-accent-soft px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
        >
          Ücretsiz Başla
        </Link>
      </nav>
    </header>
  );
}
