import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";

// Sayfa boyanmadan önce kayıtlı tema tercihini <html>'e uyguluyoruz —
// aksi halde her yüklemede önce koyu tema görünüp sonra açık temaya
// geçen bir "flash" olurdu. Varsayılan koyu tema (CLAUDE.md).
const themeInitScript = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
} catch (e) {}
`;

// DESIGN.md'deki tasarım sistemi kararı: IBM Plex Sans/Mono, self-hosted
// (next/font/local, dosyalar repoda src/app/fonts/'ta). Daha önce next/font/
// google (Geist) kullanıyorduk ama build/dev sırasında fonts.googleapis.com'a
// bağlanmaya çalışıp ağ erişimi olmadığında Next.js'in worker havuzunu
// bozuyordu ("Jest worker encountered N child process exceptions", bkz.
// CLAUDE.md). Dosyalar artık repoda gömülü olduğu için bu bağımlılık kalıcı
// olarak ortadan kalktı — hiçbir build/dev anında dış ağa istek atılmıyor.
const plexSans = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hayat Borsası",
  description: "Kendi hayatını kendi endeksinle takip et.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" suppressHydrationWarning className={`h-full antialiased ${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-full flex bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* body flex (row) konteyneri, tek çocuğuna min-w-0 vermeden bir
            torunun (örn. FeatureMarquee'nin w-max kayan şeridi) doğal
            içerik genişliğine göre viewport'tan taşabiliyordu — aynı sınıf
            hata (app)/layout.tsx'te de bulunup düzeltilmişti, bkz.
            CLAUDE.md. ThemeProvider kendi bir DOM elemanı render etmediği
            için min-w-0'ı burada, gerçek bir sarmalayıcıda vermek gerekti. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ThemeProvider>{children}</ThemeProvider>
        </div>
      </body>
    </html>
  );
}
