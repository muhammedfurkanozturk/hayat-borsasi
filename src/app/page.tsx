import { FeatureSection } from "@/components/landing/FeatureSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNav />
      <Hero />

      <FeatureSection
        icon="target"
        eyebrow="Kategori & Görev"
        title="Kendi kategorilerini, kendi kurallarınla yarat"
        description="Hazır bir şablon dayatmıyoruz. Girişimcilik, Sağlık, Disiplin — sana anlamlı gelen kategorileri sen oluşturursun, her görevin önemini sen belirlersin."
        image="/landing/kategori-gorev.webp"
        imageAlt="Kategori ve görev kartlarını gösteren uygulama arayüzü"
      />

      <FeatureSection
        icon="rocket"
        eyebrow="Endeks"
        title="Günlük, haftalık, aylık, yıllık endeks"
        description="Gelişimin bir borsa endeksi gibi anlık hesaplanır, zaman içindeki trendini tek bakışta görürsün."
        image="/landing/endeks.webp"
        imageAlt="Kendi gelişimini takip eden bir kullanıcı"
        reverse
      />

      <FeatureSection
        icon="badge"
        eyebrow="Karakter Kartı"
        title="Tüm kategorilerin tek bir kartta"
        description="Kategorilerine göre otomatik hesaplanan bir gelişim profili — hangi alanda güçlüsün, hangisinde geride kaldığını bir bakışta gör."
        image="/landing/karakter-karti.webp"
        imageAlt="Kategorilere göre hesaplanan karakter kartı arayüzü"
      />

      <HowItWorks />
      <FinalCta />
      <LandingFooter />
    </div>
  );
}
