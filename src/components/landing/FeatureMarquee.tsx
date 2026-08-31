import type { JSX } from "react";
import {
  BadgeIcon,
  FileTextIcon,
  HeartIcon,
  ListCheckIcon,
  LockIcon,
  MicIcon,
  TargetIcon,
  TrendUpIcon,
  type IconProps,
} from "@/components/icons";

interface FeatureHighlight {
  Icon: (props: IconProps) => JSX.Element;
  title: string;
  description: string;
}

// Delta.app'teki yatay kayan şeridin UX kalıbı (kart-kart marquee) — ama
// içerik gerçek kullanıcı yorumu DEĞİL: proje henüz erken erişimde, gerçek
// bir kullanıcı tabanı yok (bkz. CLAUDE.md). Uydurma isim/yorum yazmak
// yanıltıcı olurdu, bu yüzden kartlar ürünün kendi (gerçek) özelliklerini
// anlatıyor. MarketTicker.tsx'teki aynı "iki kopya + %50 kayınca döngü"
// tekniğini kullanıyor.
const FEATURES: FeatureHighlight[] = [
  { Icon: TargetIcon, title: "Kendi kategorini yarat", description: "Hazır bir şablon yok — hepsi sana özel." },
  { Icon: ListCheckIcon, title: "Kendi ağırlığını ver", description: "Her göreve önem puanını sen belirlersin." },
  { Icon: TrendUpIcon, title: "Borsa hissiyle takip et", description: "Gelişimin bir endeks gibi grafiğe dönüşür." },
  { Icon: MicIcon, title: "Sesli not", description: "Konuş, otomatik olarak metne dönüşsün." },
  { Icon: FileTextIcon, title: "AI özet", description: "Claude ile günün ya da haftan özetlensin." },
  { Icon: BadgeIcon, title: "Karakter Kartı", description: "Kategorilerine göre otomatik hesaplanan profil." },
  { Icon: LockIcon, title: "Ses hiç saklanmaz", description: "Sadece deşifre edilen metin kaydedilir." },
  { Icon: HeartIcon, title: "Türkçe, sadece senin için", description: "Arayüzün tamamı Türkçe tasarlandı." },
];

export function FeatureMarquee() {
  const doubled = [...FEATURES, ...FEATURES];

  return (
    <section className="relative overflow-hidden border-y border-border-soft/60 bg-surface/40 py-10" aria-label="Öne çıkan özellikler">
      <div className="marquee-track flex w-max items-stretch gap-4 px-4">
        {doubled.map((feature, i) => (
          <div
            key={`${feature.title}-${i}`}
            className="flex w-72 shrink-0 flex-col gap-3 rounded-lg border border-border-soft bg-surface p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-accent-soft text-accent">
              <feature.Icon width={18} height={18} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
