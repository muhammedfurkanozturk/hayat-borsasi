// Bu dosya yalnızca statik Dashboard arayüzünü göstermek için örnek verilerdir.
// Supabase entegrasyonu yapıldığında bu dosya tamamen kaldırılacaktır.

export type CategoryKey =
  | "girisimcilik"
  | "akademisyenlik"
  | "disiplin"
  | "sosyal-sermaye"
  | "saglik"
  | "maneviyat";

export interface CategoryScore {
  key: CategoryKey;
  name: string;
  score: number;
  delta: number;
}

export const dailyIndex = {
  label: "Günlük Endeks",
  value: 78.4,
  delta: 4.2,
};

export const weeklyIndex = {
  label: "Haftalık Endeks",
  value: 71.0,
  delta: -1.8,
};

export const categoryScores: CategoryScore[] = [
  { key: "girisimcilik", name: "Girişimcilik", score: 82, delta: 6.1 },
  { key: "akademisyenlik", name: "Akademisyenlik", score: 64, delta: -2.4 },
  { key: "disiplin", name: "Disiplin", score: 88, delta: 3.0 },
  { key: "sosyal-sermaye", name: "Sosyal Sermaye", score: 55, delta: -4.7 },
  { key: "saglik", name: "Sağlık", score: 73, delta: 1.2 },
  { key: "maneviyat", name: "Maneviyat", score: 90, delta: 0.0 },
];

export const trendSeries = [
  { day: "1 Tem", score: 58 },
  { day: "3 Tem", score: 61 },
  { day: "5 Tem", score: 57 },
  { day: "7 Tem", score: 65 },
  { day: "9 Tem", score: 63 },
  { day: "11 Tem", score: 69 },
  { day: "13 Tem", score: 72 },
  { day: "15 Tem", score: 68 },
  { day: "17 Tem", score: 74 },
  { day: "19 Tem", score: 79 },
  { day: "21 Tem", score: 75 },
  { day: "23 Tem", score: 81 },
  { day: "25 Tem", score: 77 },
  { day: "27 Tem", score: 83 },
  { day: "29 Tem", score: 78.4 },
];

export interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  weight: number;
  completed: boolean;
}

export const todayChecklist: ChecklistItem[] = [
  { id: "1", title: "45 dakika kitap oku", category: "Akademisyenlik", weight: 6, completed: true },
  { id: "2", title: "Yeni müşteri görüşmesi yap", category: "Girişimcilik", weight: 9, completed: true },
  { id: "3", title: "Sabah 06:30'da kalk", category: "Disiplin", weight: 5, completed: true },
  { id: "4", title: "30 dakika koş", category: "Sağlık", weight: 7, completed: false },
  { id: "5", title: "Ailenle akşam yemeği ye", category: "Sosyal Sermaye", weight: 8, completed: false },
  { id: "6", title: "10 dakika meditasyon yap", category: "Maneviyat", weight: 4, completed: true },
  { id: "7", title: "Günlük harcamaları kaydet", category: "Disiplin", weight: 3, completed: false },
];
