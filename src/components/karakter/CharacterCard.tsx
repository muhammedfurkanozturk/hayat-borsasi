interface Tier {
  label: string;
  color: string;
}

function getTier(score: number): Tier {
  if (score >= 80) return { label: "ELMAS", color: "#5ac8fa" };
  if (score >= 60) return { label: "ALTIN", color: "#f5b400" };
  if (score >= 40) return { label: "GÜMÜŞ", color: "#9ca3af" };
  return { label: "BRONZ", color: "#b26a3a" };
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

  return (
    <div
      className="card-lift mx-auto flex w-full max-w-[340px] flex-col overflow-hidden rounded-3xl border-2 bg-surface shadow-card"
      style={{ borderColor: tier.color }}
    >
      <div
        className="flex flex-col items-center gap-1 px-6 pb-6 pt-8"
        style={{ background: `linear-gradient(180deg, ${tier.color}2e, transparent)` }}
      >
        <span className="font-mono text-6xl font-black tabular-nums" style={{ color: tier.color }}>
          {Math.round(overallScore)}
        </span>
        <span className="text-xs font-bold tracking-[0.3em]" style={{ color: tier.color }}>
          {tier.label}
        </span>

        <div
          className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white"
          style={{ boxShadow: `0 0 0 4px var(--surface), 0 0 0 6px ${tier.color}` }}
        >
          {initial}
        </div>
        <span className="mt-3 text-lg font-bold text-foreground">{name}</span>
      </div>

      <div className="flex flex-col divide-y divide-border-soft border-t-2" style={{ borderColor: tier.color }}>
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex items-center justify-between px-6 py-3"
            style={{
              opacity: 0,
              animation: "card-reveal 0.45s var(--ease-snap) forwards",
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <span className="text-sm text-muted">{stat.label}</span>
            <span className="text-sm font-semibold text-foreground">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
