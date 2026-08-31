import Link from "next/link";
import { CompassIcon, HomeIcon } from "@/components/icons";

// 21st.dev'in "not-found-2" component'inden ilham (shadcn Empty/Button/
// Avatar kaldırıldı — projede zaten yok, kendi tokenlerimize/icons.tsx'e
// çevrildi). Borsa temamıza uygun küçük bir söz oyunu: "piyasadan çekilmiş
// hisse" metaforu.
export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-mono text-8xl font-extrabold tabular-nums text-negative sm:text-9xl">404</span>

      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold text-foreground">Bu sayfa piyasadan çekildi.</h1>
        <p className="text-sm text-muted">Aradığın sayfa taşınmış ya da hiç işlem görmemiş olabilir.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/dashboard"
          className="btn flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:brightness-110"
        >
          <HomeIcon width={16} height={16} />
          Ana Sayfaya Dön
        </Link>
        <Link
          href="/karakter-karti"
          className="btn flex h-10 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium text-foreground hover:border-accent/50 hover:text-accent"
        >
          <CompassIcon width={16} height={16} />
          Keşfet
        </Link>
      </div>
    </div>
  );
}
