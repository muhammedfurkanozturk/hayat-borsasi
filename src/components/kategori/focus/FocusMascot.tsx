// "eksikler" envanteri madde 5 — Ders & Odaklanma'nın Duolingo'dan ilham
// aldığı dostane/maskotlu his (bkz. CLAUDE.md Bölüm 5, "özgün maskot
// karakteri" önceden ertelenmişti). Duolingo'nun baykuşu birebir
// KOPYALANMADI — kendi özgün, basit bir "açık kitap + göz" karakteri:
// projenin temasına (ders/odaklanma) uygun, tek renkli, SVG olarak
// sıfırdan çizildi. Sabit, animasyonsuz (dikkat dağıtmasın diye).
export function FocusMascot({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Gövde — yuvarlak, dostane blob */}
      <path
        d="M24 4C33.9 4 42 11.4 42 22.5C42 31.9 35.6 39.4 26.8 41.4C26.3 43.3 25.3 44.5 24 44.5C22.7 44.5 21.7 43.3 21.2 41.4C12.4 39.4 6 31.9 6 22.5C6 11.4 14.1 4 24 4Z"
        fill="var(--accent)"
      />
      {/* Açık kitap — ders/odaklanma temasını taşıyor */}
      <path d="M24 20V33" stroke="var(--accent-foreground)" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M24 21C22 19.2 18.6 18.4 15.5 18.7C15 18.75 14.6 19.15 14.6 19.65V30.4C14.6 30.95 15.05 31.35 15.6 31.3C18.5 31.05 21.7 31.85 24 33.6"
        stroke="var(--accent-foreground)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 21C26 19.2 29.4 18.4 32.5 18.7C33 18.75 33.4 19.15 33.4 19.65V30.4C33.4 30.95 32.95 31.35 32.4 31.3C29.5 31.05 26.3 31.85 24 33.6"
        stroke="var(--accent-foreground)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gözler */}
      <circle cx="16" cy="14" r="2.4" fill="var(--accent-foreground)" />
      <circle cx="32" cy="14" r="2.4" fill="var(--accent-foreground)" />
      {/* Gülümseme */}
      <path d="M19.5 18.5C21 20 27 20 28.5 18.5" stroke="var(--accent-foreground)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
