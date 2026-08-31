import { CookieConsent } from "@/components/landing/CookieConsent";
import { FeatureMarquee } from "@/components/landing/FeatureMarquee";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";

const KATEGORI_GRADIENT =
  "linear-gradient(135deg, rgba(139,92,246,0.28) 0%, rgba(236,72,153,0.15) 55%, rgba(236,72,153,0.08) 100%)";
const ENDEKS_GRADIENT =
  "linear-gradient(135deg, rgba(245,180,0,0.28) 0%, rgba(244,114,63,0.15) 55%, rgba(244,114,63,0.08) 100%)";
const KARAKTER_GRADIENT =
  "linear-gradient(135deg, rgba(54,211,159,0.28) 0%, rgba(10,209,235,0.15) 55%, rgba(10,209,235,0.08) 100%)";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <ParticlesBackground />
      <LandingNav />
      <Hero />

      <FeatureSection
        icon="target"
        eyebrow="Kategori & Görev"
        title="Kendi kategorilerini, kendi kurallarınla yarat"
        description="Hazır bir şablon dayatmıyoruz. Girişimcilik, Sağlık, Disiplin — sana anlamlı gelen kategorileri sen oluşturursun, her görevin önemini sen belirlersin."
        image="/landing/kategori-gorev.webp"
        imageAlt="Kategori ve görev kartlarını gösteren uygulama arayüzü"
        gradient={KATEGORI_GRADIENT}
      />

      <FeatureSection
        icon="rocket"
        eyebrow="Endeks"
        title="Günlük, haftalık, aylık, yıllık endeks"
        description="Gelişimin bir borsa endeksi gibi anlık hesaplanır, zaman içindeki trendini tek bakışta görürsün."
        image="/landing/endeks.webp"
        imageAlt="Kendi gelişimini takip eden bir kullanıcı"
        gradient={ENDEKS_GRADIENT}
        reverse
      />

      <FeatureSection
        icon="badge"
        eyebrow="Karakter Kartı"
        title="Tüm kategorilerin tek bir kartta"
        description="Kategorilerine göre otomatik hesaplanan bir gelişim profili — hangi alanda güçlüsün, hangisinde geride kaldığını bir bakışta gör."
        image="/landing/karakter-karti.webp"
        imageAlt="Kategorilere göre hesaplanan karakter kartı arayüzü"
        gradient={KARAKTER_GRADIENT}
      />

      <HowItWorks />
      <FeatureMarquee />
      <FinalCta />
      <LandingFooter />
      <CookieConsent />
    </div>
  );
}
