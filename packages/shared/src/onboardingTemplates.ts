import type { IconKey } from "./types";

export interface OnboardingTemplate {
  key: string;
  name: string;
  icon: IconKey;
  description: string;
}

// Hesap oluşturma sonrası "ilk alışkanlıklarını seç" ekranında sunulan 7
// hazır kategori şablonu. Bunlar sadece öneri — kullanıcı hiçbirini
// seçmeyebilir (bkz. CLAUDE.md bölüm 1: "hiçbir görev zorunlu değil").
// Her biri normal bir `categories` satırı olarak oluşturulur; ileride
// eklenecek özel modüller (kalori AI analizi, portföy takibi vb.) bu
// kategorilerin üzerine inşa edilecek, henüz yok.
export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    key: "beslenme",
    name: "Sağlıklı Beslenme",
    icon: "apple",
    description: "Öğünlerini takip et — ileride yemek fotoğrafından AI kalori analizi eklenecek.",
  },
  {
    key: "spor",
    name: "Spor & Vücut",
    icon: "dumbbell",
    description: "Antrenmanlarını işaretle — ileride set/tekrar takibi ve ilerleme analizi eklenecek.",
  },
  {
    key: "stil",
    name: "Stil & Giyim",
    icon: "palette",
    description: "Günlük kombinlerini not al — ileride bir stil galerisine dönüşecek.",
  },
  {
    key: "finans",
    name: "Finans & Portföy",
    icon: "wallet",
    description: "Hisse ve altın alım satımlarını kaydet — ileride anlık kâr/zarar takibi eklenecek.",
  },
  {
    key: "odaklanma",
    name: "Ders & Odaklanma",
    icon: "clock",
    description: "Odaklanma sürelerini takip et — ileride Pomodoro zamanlayıcısı eklenecek.",
  },
  {
    key: "dijital",
    name: "Dijital Gelişim",
    icon: "code",
    description: "Üretken sitelerde geçirdiğin süreyi kendin gir ve takip et.",
  },
  {
    key: "aliskanlik",
    name: "Alışkanlık Bırakma",
    icon: "flame",
    description: "Bırakmak istediğin bir alışkanlığı takip et — ileride seri (streak) sayacı eklenecek.",
  },
];
