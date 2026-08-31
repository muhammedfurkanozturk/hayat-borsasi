import type { IconKey } from "./types";

// Bir kategorinin hangi özel modülü açtığını belirler — sadece bu
// şablonlardan oluşturulan kategorilere set edilir, kullanıcının kendi
// oluşturduğu kategoriler her zaman "standard" kalır (bkz. bölüm 1:
// dayatma yok). "habit" — Kötü Alışkanlıklar — kategori bazlı bir modül:
// bu kategoriye eklenen her görev otomatik olarak bir "kötü alışkanlık"
// (is_habit_break=true) sayılır, bkz. HabitTrackerPanel.
export type CategoryModuleType =
  | "standard"
  | "focus"
  | "finance"
  | "nutrition"
  | "style"
  | "digital"
  | "sport"
  | "habit"
  | "travel";

export interface OnboardingTemplate {
  key: string;
  name: string;
  icon: IconKey;
  description: string;
  moduleType: CategoryModuleType;
}

// Hesap oluşturma sonrası "ilk alışkanlıklarını seç" ekranında sunulan 7
// hazır kategori şablonu. Bunlar sadece öneri — kullanıcı hiçbirini
// seçmeyebilir (bkz. CLAUDE.md bölüm 1: "hiçbir görev zorunlu değil").
export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    key: "beslenme",
    name: "Sağlıklı Beslenme",
    icon: "apple",
    description: "Öğünlerini takip et, yemek fotoğrafından AI kalori/besin analizi al.",
    moduleType: "nutrition",
  },
  {
    key: "spor",
    name: "Spor & Vücut",
    icon: "dumbbell",
    description: "Antrenmanlarında set/tekrar/ağırlık takibi yap.",
    moduleType: "sport",
  },
  {
    key: "stil",
    name: "Stil & Giyim",
    icon: "palette",
    description: "Günlük kombinlerini fotoğrafla, kendi stil galerini oluştur.",
    moduleType: "style",
  },
  {
    key: "finans",
    name: "Finans & Portföy",
    icon: "wallet",
    description: "Hisse ve altın alım satımlarını kaydet, pozisyonunu takip et.",
    moduleType: "finance",
  },
  {
    key: "odaklanma",
    name: "Ders & Odaklanma",
    icon: "clock",
    description: "Pomodoro zamanlayıcısıyla odaklanma sürelerini kaydet.",
    moduleType: "focus",
  },
  {
    key: "dijital",
    name: "Yol Haritam",
    icon: "compass",
    description: "Bir alan seç (örn. Frontend), dallanan yol haritasında konuları tamamladıkça işaretle.",
    moduleType: "digital",
  },
  {
    key: "aliskanlik",
    name: "Kötü Alışkanlıklar",
    icon: "flame",
    description: "Bırakmaya çalıştığın alışkanlıkları ekle, her gün kullandın mı kullanmadın mı işaretle — seri takibi açılır.",
    moduleType: "habit",
  },
  {
    key: "seyahat",
    name: "Seyahat",
    icon: "plane",
    description: "Gezdiğin ülke/il/ilçeleri dünya haritasında işaretle, kendi 'Seyahat Pasaportu'nu oluştur.",
    moduleType: "travel",
  },
];
