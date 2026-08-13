// Günlük skor artık Supabase'teki gerçek görev/işaretleme verisinden anlık
// hesaplanıyor (bkz. src/lib/supabase/app-data-context.tsx). Burada sadece
// henüz gün-gün/ay-ay geçmiş verisi tutmadığımız için statik kalan seriler
// var:
// - dailySeries: son 30 günün örnek günlük skoru (Haftalık/Aylık grafik aralıkları için)
// - monthlySeries: son 12 ayın örnek aylık skoru (Yıllık grafik aralığı için)

export const dailySeries = [
  { day: "30 Haz", score: 54 },
  { day: "1 Tem", score: 58 },
  { day: "2 Tem", score: 55 },
  { day: "3 Tem", score: 61 },
  { day: "4 Tem", score: 59 },
  { day: "5 Tem", score: 57 },
  { day: "6 Tem", score: 62 },
  { day: "7 Tem", score: 65 },
  { day: "8 Tem", score: 63 },
  { day: "9 Tem", score: 63 },
  { day: "10 Tem", score: 66 },
  { day: "11 Tem", score: 69 },
  { day: "12 Tem", score: 67 },
  { day: "13 Tem", score: 72 },
  { day: "14 Tem", score: 70 },
  { day: "15 Tem", score: 68 },
  { day: "16 Tem", score: 71 },
  { day: "17 Tem", score: 74 },
  { day: "18 Tem", score: 73 },
  { day: "19 Tem", score: 79 },
  { day: "20 Tem", score: 76 },
  { day: "21 Tem", score: 75 },
  { day: "22 Tem", score: 78 },
  { day: "23 Tem", score: 81 },
  { day: "24 Tem", score: 79 },
  { day: "25 Tem", score: 77 },
  { day: "26 Tem", score: 80 },
  { day: "27 Tem", score: 83 },
  { day: "28 Tem", score: 81 },
  { day: "29 Tem", score: 78.4 },
];

export const monthlySeries = [
  { month: "Ağu", score: 48 },
  { month: "Eyl", score: 52 },
  { month: "Eki", score: 55 },
  { month: "Kas", score: 51 },
  { month: "Ara", score: 58 },
  { month: "Oca", score: 61 },
  { month: "Şub", score: 64 },
  { month: "Mar", score: 62 },
  { month: "Nis", score: 68 },
  { month: "May", score: 71 },
  { month: "Haz", score: 74 },
  { month: "Tem", score: 78 },
];
