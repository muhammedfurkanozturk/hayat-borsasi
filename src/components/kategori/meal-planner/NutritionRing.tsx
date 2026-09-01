"use client";

import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

// OpenNutriTracker'daki (piyasa araştırması) dairesel ilerleme göstergesi
// fikri — sabit bir kalori hedefi tanımlamadığımız için (böyle bir alan
// henüz yok) halka, günün toplam kalorisine karşı değil protein/karb/yağ'ın
// birbirine oranına göre çiziliyor; ortadaki sayı günün toplam kalorisi.
const RING_SIZE = 96;
const STROKE = 7;
const GAP = 3;

function ringRadius(index: number) {
  return RING_SIZE / 2 - STROKE / 2 - index * (STROKE + GAP);
}

function Ring({ index, fraction, color }: { index: number; fraction: number; color: string }) {
  const r = ringRadius(index);
  const circumference = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, fraction)) * circumference;
  return (
    <>
      <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r} stroke="var(--border-soft)" strokeWidth={STROKE} fill="none" />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={r}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${dash} ${circumference}`}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        className="transition-[stroke-dasharray] duration-500 ease-out"
      />
    </>
  );
}

export function NutritionRing({
  calories,
  proteinG,
  carbsG,
  fatG,
}: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}) {
  const totalG = proteinG + carbsG + fatG;
  const fractions =
    totalG > 0
      ? [proteinG / totalG, carbsG / totalG, fatG / totalG]
      : [0, 0, 0];

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE}>
          <Ring index={0} fraction={fractions[0]} color="var(--nutrition-accent)" />
          <Ring index={1} fraction={fractions[1]} color="var(--positive)" />
          <Ring index={2} fraction={fractions[2]} color="var(--pro)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            <AnimatedNumber value={calories} />
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted">kcal</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--nutrition-accent)" }} />
          <span className="text-muted">Protein</span>
          <span className="font-mono tabular-nums text-foreground">{proteinG.toFixed(0)}g</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--positive)" }} />
          <span className="text-muted">Karb</span>
          <span className="font-mono tabular-nums text-foreground">{carbsG.toFixed(0)}g</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--pro)" }} />
          <span className="text-muted">Yağ</span>
          <span className="font-mono tabular-nums text-foreground">{fatG.toFixed(0)}g</span>
        </span>
      </div>
    </div>
  );
}
