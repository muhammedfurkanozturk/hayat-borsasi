export type ReportPeriod = "Günlük" | "Haftalık" | "Aylık" | "Yıllık";

export interface CategorySummary {
  name: string;
  score: number;
}

export type ReportTone = "pozitif" | "notr" | "uyari" | "negatif";

export interface ReportSection {
  baslik: string;
  icerik: string;
  ton: ReportTone;
}

export interface StructuredReport {
  durum_ozeti: string;
  bolumler: ReportSection[];
}

const VALID_TONES: ReportTone[] = ["pozitif", "notr", "uyari", "negatif"];

function isValidSection(value: unknown): value is ReportSection {
  const section = value as ReportSection;
  return (
    typeof section?.baslik === "string" &&
    typeof section?.icerik === "string" &&
    VALID_TONES.includes(section?.ton)
  );
}

// AI Rapor artık yapılandırılmış JSON döndürüyor (Bölüm — 2026-08-25,
// kullanıcı onaylı) — ama `ai_reports.content_text` hâlâ düz bir TEXT
// kolonu, yeni migration eklenmedi. Bu fonksiyon hem web hem mobil
// tarafından kullanılıyor (tek doğruluk kaynağı): geçerli JSON'sa
// yapılandırılmış objeyi, DEĞİLSE (eski düz-metin kayıtlar VEYA Claude'un
// beklenmedik bir cevabı) null döner — çağıran taraf null durumunda ham
// metni olduğu gibi göstermeye devam eder, uygulama hiç çökmez.
export function parseStructuredReport(text: string): StructuredReport | null {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.durum_ozeti === "string" && Array.isArray(parsed?.bolumler) && parsed.bolumler.every(isValidSection)) {
      return parsed as StructuredReport;
    }
    return null;
  } catch {
    return null;
  }
}
