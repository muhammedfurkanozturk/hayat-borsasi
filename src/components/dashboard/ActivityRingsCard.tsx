"use client";

interface RingMetric {
  label: string;
  description: string;
  percent: number;
  color: string;
}

function Ring({ metric, size = 84 }: { metric: RingMetric; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, metric.percent));

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-soft)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={metric.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            style={{ transition: "stroke-dashoffset 0.6s var(--ease-snap)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{Math.round(clamped)}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-foreground">{metric.label}</span>
        <span className="text-[11px] text-muted">{metric.description}</span>
      </div>
    </div>
  );
}

// Apple Health'in Move/Exercise/Stand halka grafiğinden ilham (21st.dev'in
// ActivityCard'ı, Bölüm 9, 2026-08-25) — ama sabit 3 metrik yerine
// UYDURULMAMIŞ, gerçekten hesaplanabilir 3 evrensel metrik kullanıyor
// (kategoriler kullanıcıya özel olduğu için "Move/Exercise/Stand" gibi
// sabit bir üçlü bizde anlamsız): Puan (ağırlıklı skor — CLAUDE.md bölüm
// 5'teki asıl formül), Görev (tamamlanan/toplam görev sayısı — ağırlıksız,
// farklı bir bilgi), Kategori (bugün en az bir puanı olan kategori oranı).
// 2026-08-26: her halkanın altına ne anlama geldiğini netleştiren bir alt
// yazı eklendi (ör. "8/12 görev tamamlandı") — sadece "%64" ve tek kelimelik
// etiket, kullanıcı için yeterince açık değildi. Kart artık DashboardClient
// tarafından DailyChecklist ile TEK bir görsel kart içinde, doğrudan üstünde
// render ediliyor (bkz. DashboardClient.tsx) — kendi border/shadow'unu
// taşımıyor, bu yüzden dış çerçeve kaldırıldı.
export function ActivityRingsCard({
  scorePercent,
  taskCompletionPercent,
  completedTaskCount,
  totalTaskCount,
  activeCategoryPercent,
  activeCategoryCount,
  totalCategoryCount,
}: {
  scorePercent: number;
  taskCompletionPercent: number;
  completedTaskCount: number;
  totalTaskCount: number;
  activeCategoryPercent: number;
  activeCategoryCount: number;
  totalCategoryCount: number;
}) {
  const metrics: RingMetric[] = [
    {
      label: "Puan",
      description: "Bugünkü ağırlıklı skor",
      percent: scorePercent,
      color: "var(--accent)",
    },
    {
      label: "Görev",
      description: `${completedTaskCount}/${totalTaskCount} görev tamamlandı`,
      percent: taskCompletionPercent,
      color: "var(--positive)",
    },
    {
      label: "Kategori",
      description: `${activeCategoryCount}/${totalCategoryCount} kategoride aktivite`,
      percent: activeCategoryPercent,
      color: "var(--pro)",
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-t-lg border border-b-0 border-border bg-surface p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium text-foreground">Bugünün Özeti</h2>
        <p className="text-xs text-muted">Aşağıdaki checklist&apos;in özeti — işaretledikçe canlı güncellenir.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <Ring key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}
