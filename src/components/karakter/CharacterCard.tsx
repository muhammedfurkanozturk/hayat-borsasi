export interface Tier {
  label: string;
  color: string;
  // FUT (piyasa araştırması — kompozisyon/hiyerarşi ilhamı, kod/marka
  // kopyalanmadı) kartlarındaki gibi tier yükseldikçe kart daha "değerli"
  // görünsün diye: mat/sade (Bronz) → parlak/gradyanlı (Elmas).
  glow: boolean;
  shine: boolean;
}

// Altın/Elmas, sitenin kendi "Pro" gold rozeti (--pro) ve imza cyan
// vurgusuyla (--accent) aynı renkleri kullanıyor — FUT'un kendi paleti
// değil, bizim borsa temamızın bir uzantısı. LeaderboardCard.tsx da (Bölüm
// 7) aynı tier mantığını kullanıyor diye export edildi.
export function getTier(score: number): Tier {
  if (score >= 80) return { label: "ELMAS", color: "var(--accent)", glow: true, shine: true };
  if (score >= 60) return { label: "ALTIN", color: "var(--pro)", glow: true, shine: false };
  if (score >= 40) return { label: "GÜMÜŞ", color: "#9ca3af", glow: false, shine: false };
  return { label: "BRONZ", color: "#b26a3a", glow: false, shine: false };
}

export interface CharacterCardStat {
  label: string;
  value: string;
}

export function CharacterCard({
  name,
  initial,
  overallScore,
  stats,
}: {
  name: string;
  initial: string;
  overallScore: number;
  stats: CharacterCardStat[];
}) {
  const tier = getTier(overallScore);
  // Son madde (Sıralama) kart altında ayrı, vurgulu bir şerit olarak
  // gösteriliyor — geri kalanı 2 sütunlu bir ızgarada (FUT'taki PAC/SHO/
  // PAS/DRI gibi kompakt istatistik bloğu hissi).
  const gridStats = stats.slice(0, -1);
  const highlightStat = stats[stats.length - 1];

  return (
    <div
      className="card-lift relative mx-auto flex w-full max-w-[340px] flex-col overflow-hidden rounded-lg border-2 bg-surface"
      style={{
        borderColor: tier.color,
        boxShadow: tier.glow ? `var(--shadow-card), 0 0 28px -8px ${tier.color}` : "var(--shadow-card)",
      }}
    >
      <div
        className="relative flex flex-col items-center gap-1 overflow-hidden px-6 pb-6 pt-8"
        style={{ background: `linear-gradient(180deg, ${tier.color}33, transparent 70%)` }}
      >
        {tier.shine && (
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-y-10 left-0 w-1/3"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              animation: "card-shine 6s ease-in-out infinite",
            }}
          />
        )}

        <span
          className="rounded-full border px-3 py-0.5 text-[10px] font-bold tracking-[0.3em]"
          style={{ color: tier.color, borderColor: `${tier.color}66` }}
        >
          {tier.label}
        </span>
        <span className="font-mono text-6xl font-black tabular-nums" style={{ color: tier.color }}>
          {Math.round(overallScore)}
        </span>

        <div
          className="mt-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white"
          style={{ boxShadow: `0 0 0 4px var(--surface), 0 0 0 6px ${tier.color}` }}
        >
          {initial}
        </div>
        <span className="mt-3 text-lg font-bold text-foreground">{name}</span>
      </div>

      <div className="border-t-2 px-5 pb-5 pt-4" style={{ borderColor: tier.color }}>
        <div className="grid grid-cols-2 gap-2.5">
          {gridStats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col gap-0.5 rounded-lg border border-border-soft bg-background-elevated px-3 py-2.5"
              style={{ opacity: 0, animation: "card-reveal 0.45s var(--ease-snap) forwards", animationDelay: `${i * 0.08}s` }}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted">{stat.label}</span>
              <span className="truncate text-sm font-semibold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>

        {highlightStat && (
          <div
            className="mt-2.5 flex items-center justify-between rounded-lg px-4 py-2.5"
            style={{
              background: `${tier.color}1a`,
              opacity: 0,
              animation: "card-reveal 0.45s var(--ease-snap) forwards",
              animationDelay: `${gridStats.length * 0.08}s`,
            }}
          >
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: tier.color }}>
              {highlightStat.label}
            </span>
            <span className="font-mono text-base font-bold tabular-nums" style={{ color: tier.color }}>
              {highlightStat.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
