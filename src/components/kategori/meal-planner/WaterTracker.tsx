"use client";

import { useState } from "react";
import { CheckIcon, CupIcon, TrashIcon } from "@/components/icons";
import type { DbWaterLog } from "@hayat-borsasi/shared";
import { WaterBottleGauge } from "./WaterBottleGauge";
import { WaterTrendChart } from "./WaterTrendChart";

const DEFAULT_GOAL_ML = 2000;
// 2026-08-28 (kullanıcı isteği): düz "+200/330/500 ml" butonları yerine
// isimli bardak boyutları — her biri kendi ikon boyutuyla da (14/18/22px)
// küçük/orta/büyük hissini görsel olarak destekliyor.
const CUP_SIZES = [
  { label: "Küçük Bardak", ml: 200, iconSize: 14 },
  { label: "Orta Bardak", ml: 330, iconSize: 18 },
  { label: "Büyük Bardak", ml: 500, iconSize: 22 },
] as const;

// OpenNutriTracker'daki (piyasa araştırması) su içme takibi fikri —
// kullanıcı bulgusu: sabit "+1 bardak" yerine esnek miktar (hazır butonlar +
// özel miktar) ve damla ikonları yerine dolan bir şişe görseli istendi.
export function WaterTracker({
  logs,
  history,
  goalMl,
  onAdd,
  onRemoveLast,
  onSetGoal,
  adding,
  error,
}: {
  logs: DbWaterLog[];
  history: DbWaterLog[];
  goalMl: number | null;
  onAdd: (amountMl: number) => void;
  onRemoveLast: () => void;
  onSetGoal: (goalMl: number) => void;
  adding: boolean;
  error?: string | null;
}) {
  const [goalInput, setGoalInput] = useState(String(DEFAULT_GOAL_ML));
  const [customOpen, setCustomOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);

  const totalMl = logs.reduce((sum, l) => sum + l.amount_ml, 0);
  const goalReached = goalMl != null && totalMl >= goalMl;

  // İlk kullanım (veya kullanıcı "Hedefi Düzenle" dediğinde) — hedef sorusu.
  if (goalMl === null || editingGoal) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface shadow-card p-5">
        <div>
          <h2 className="text-sm font-medium text-foreground">Su Takibi</h2>
          <p className="text-xs text-muted">Günlük kaç ml su içmeyi hedefliyorsun?</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={250}
            step={50}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            className="h-10 w-32 rounded-lg border-2 border-muted/30 bg-background-elevated px-3 text-sm text-foreground outline-none focus:border-accent/50"
          />
          <span className="text-sm text-muted">ml</span>
          <button
            type="button"
            onClick={() => {
              const parsed = Math.round(Number(goalInput));
              if (parsed > 0) {
                onSetGoal(parsed);
                setEditingGoal(false);
              }
            }}
            className="btn h-10 rounded-lg bg-accent-soft px-4 text-xs font-medium text-accent hover:bg-accent/25"
          >
            Kaydet
          </button>
          {editingGoal && (
            <button
              type="button"
              onClick={() => setEditingGoal(false)}
              className="btn h-10 rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground"
            >
              Vazgeç
            </button>
          )}
        </div>
        {error && <p className="text-xs text-negative">{error}</p>}
      </div>
    );
  }

  const percent = (totalMl / goalMl) * 100;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface shadow-card p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-medium text-foreground">Su Takibi</h2>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                type="button"
                onClick={onRemoveLast}
                aria-label="Son eklemeyi geri al"
                className="btn flex h-9 w-9 items-center justify-center rounded-lg border-2 border-muted/30 text-muted hover:text-negative"
              >
                <TrashIcon width={14} height={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setGoalInput(String(goalMl));
                setEditingGoal(true);
              }}
              className="btn h-9 rounded-lg border-2 border-muted/30 px-3 text-xs text-muted hover:text-foreground"
            >
              Hedefi Düzenle
            </button>
          </div>
        </div>

        {/* 2026-08-29 (kullanıcı isteği): gösterge + seçenekler artık tek,
            görsel olarak ayrışan bir "alan" içinde — önceden ikisi de
            kartın düz zemininde ayrı ayrı duruyordu. */}
        <div className="flex flex-col items-center gap-5 rounded-lg border-2 border-muted/15 bg-background-elevated/50 p-5">
          <div className="flex flex-col items-center gap-3">
            <WaterBottleGauge percent={percent} size={128} />
            <p className="text-sm text-muted">
              <span className="font-mono text-base font-semibold tabular-nums text-foreground">{totalMl}</span> / {goalMl} ml
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CUP_SIZES.map((cup) => (
                <button
                  key={cup.ml}
                  type="button"
                  onClick={() => onAdd(cup.ml)}
                  disabled={adding}
                  className="btn flex flex-col items-center gap-1.5 rounded-lg bg-accent-soft px-4 py-3 text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  <CupIcon width={cup.iconSize} height={cup.iconSize} />
                  <span className="text-xs font-medium">{cup.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-accent/80">{cup.ml} ml</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomOpen((v) => !v)}
                className="btn h-9 rounded-lg border-2 border-muted/30 px-3 text-xs text-muted hover:text-foreground"
              >
                Özel miktar
              </button>
            </div>

            {customOpen && (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="number"
                  min={1}
                  placeholder="örn. 700"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="h-9 w-28 rounded-lg border-2 border-muted/30 bg-background-elevated px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
                />
                <span className="text-xs text-muted">ml</span>
                <button
                  type="button"
                  onClick={() => {
                    const parsed = Math.round(Number(customAmount));
                    if (parsed > 0) {
                      onAdd(parsed);
                      setCustomAmount("");
                      setCustomOpen(false);
                    }
                  }}
                  disabled={adding}
                  className="btn h-9 rounded-lg bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Ekle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2026-08-29 (kullanıcı isteği): başlığın yanındaki küçük rozetten
            ayrı, daha büyük ve kendi satırında — hedefe YENİ ulaşıldığında
            koşullu render sayesinde mount olup `.check-pop` (globals.css,
            CheckMark.tsx'teki aynı zıplama animasyonu) ile bir kez "pop"
            ediyor, tekrar render'larda tekrar oynamıyor çünkü DOM'dan hiç
            kalkmıyor. */}
        {goalReached && (
          <div className="flex items-center justify-center gap-3 rounded-lg bg-positive-soft px-4 py-3.5">
            <span className="check-pop flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-positive text-background">
              <CheckIcon width={17} height={17} strokeWidth={3} />
            </span>
            <span className="text-sm font-semibold text-positive">Bugün hedefe ulaşıldı</span>
          </div>
        )}
      </div>

      <WaterTrendChart history={history} goalMl={goalMl} />
    </div>
  );
}
