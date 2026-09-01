"use client";

import { useMemo, useState } from "react";
import type { PersonalRecord } from "@hayat-borsasi/shared";

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60];

// Epley (ağırlık × (1 + tekrar/30)) — yüksek tekrar aralıklarında da makul
// kalan, en yaygın kullanılan formül, ana tahmin olarak gösteriliyor.
// Brzycki (ağırlık × 36/(37-tekrar)) — 10 tekrarın altında Epley'e çok
// yakın, üstünde belirginleşen bir ikinci referans olarak yanında duruyor.
// İkisi birden göstermek, tek bir "kesin" sayı yerine kabaca bir aralık
// hissi veriyor (gerçek 1RM testi olmadan asla kesin değil).
function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}
function brzycki(weight: number, reps: number): number {
  if (reps >= 37) return NaN;
  return (weight * 36) / (37 - reps);
}

// MuscleWiki'nin (piyasa araştırması) hesap makineleri sayfasından ilham —
// kalori/makro hesaplayıcı zaten Sağlıklı Beslenme kategorimizde var,
// burada tekrarlanmıyor, sadece 1RM (bir tekrar maksimum) hesaplayıcı var.
export function OneRepMaxCalculator({ personalRecords }: { personalRecords: Map<string, PersonalRecord> }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  const prExercises = useMemo(() => Array.from(personalRecords.entries()), [personalRecords]);

  const weightNum = Number(weight);
  const repsNum = Number(reps);
  const valid = weightNum > 0 && repsNum > 0 && repsNum <= 20;

  const epleyResult = valid ? epley(weightNum, repsNum) : null;
  const brzyckiResult = valid ? brzycki(weightNum, repsNum) : null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
      <div>
        <h2 className="text-sm font-medium text-[color:var(--sport-text)]">1RM Hesaplayıcı</h2>
        <p className="text-xs text-[color:var(--sport-muted)]">
          Kaldırdığın ağırlık ve tekrar sayısına göre tahmini bir tekrar maksimumunu (1RM) hesaplar. Kalori/makro hesaplayıcı
          için Sağlıklı Beslenme kategorine bakabilirsin.
        </p>
      </div>

      {prExercises.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prExercises.map(([name, pr]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setWeight(String(pr.weightKg));
                setReps("5");
              }}
              className="btn rounded-full border-2 border-[color:var(--sport-muted)]/25 px-3 py-1 text-[11px] text-[color:var(--sport-muted)] hover:border-[color:var(--sport-accent)]/30 hover:text-[color:var(--sport-text)]"
            >
              {name} · {pr.weightKg}kg PR
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-[color:var(--sport-muted)]">Ağırlık (kg)</span>
          <input
            type="number"
            min={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="örn. 80"
            className="h-10 rounded-lg border-2 border-[color:var(--sport-muted)]/30 bg-[color:var(--sport-elevated)] px-3 text-sm text-[color:var(--sport-text)] outline-none focus:border-[color:var(--sport-accent)]/50"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-[color:var(--sport-muted)]">Tekrar</span>
          <input
            type="number"
            min={1}
            max={20}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="örn. 5"
            className="h-10 rounded-lg border-2 border-[color:var(--sport-muted)]/30 bg-[color:var(--sport-elevated)] px-3 text-sm text-[color:var(--sport-text)] outline-none focus:border-[color:var(--sport-accent)]/50"
          />
        </label>
      </div>

      {reps !== "" && repsNum > 20 && <p className="text-xs text-negative">20 tekrardan fazlası için tahmin güvenilir değil.</p>}

      {valid && epleyResult != null && (
        <div className="flex flex-col gap-3 rounded-lg border-2 border-[color:var(--sport-accent)]/25 bg-[color:var(--sport-accent)]/15 p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-[color:var(--sport-accent)]">{Math.round(epleyResult)}</span>
            <span className="text-sm text-[color:var(--sport-muted)]">kg tahmini 1RM (Epley)</span>
          </div>
          {brzyckiResult != null && !Number.isNaN(brzyckiResult) && (
            <p className="text-xs text-[color:var(--sport-muted)]">Brzycki formülüne göre: ~{Math.round(brzyckiResult)} kg</p>
          )}

          <div className="flex flex-col gap-1 border-t border-[color:var(--sport-accent)]/20 pt-3">
            <p className="text-xs font-medium text-[color:var(--sport-muted)]">Antrenman yüzdeleri</p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {PERCENTAGES.map((pct) => (
                <div key={pct} className="flex flex-col items-center rounded-lg bg-[color:var(--sport-elevated)] px-2 py-1.5">
                  <span className="text-[10px] text-[color:var(--sport-muted)]">%{pct}</span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[color:var(--sport-text)]">
                    {Math.round((epleyResult * pct) / 100)} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
