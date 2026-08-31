"use client";

import { useState } from "react";
import type { DbHabitReward } from "@hayat-borsasi/shared";
import { CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";

// Quitzilla'daki (piyasa araştırması) tasarrufa bağlı özel ödül fikri —
// "ulaşıldı mı" durumu burada saklanmıyor, canlı hesaplanan tasarrufla
// (currentSavings) karşılaştırılarak türetiliyor.
export function HabitRewards({
  rewards,
  currentSavings,
  onAdd,
  onDelete,
}: {
  rewards: DbHabitReward[];
  currentSavings: number;
  onAdd: (title: string, targetAmount: number) => void;
  onDelete: (rewardId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetNum = Number(target);
    if (!title.trim() || !(targetNum > 0)) return;
    onAdd(title.trim(), targetNum);
    setTitle("");
    setTarget("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">Ödül Hedeflerin</span>

      {rewards.map((reward) => {
        const achieved = currentSavings >= reward.target_amount;
        const progressPct = Math.min(100, (currentSavings / reward.target_amount) * 100);
        return (
          <div key={reward.id} className="group flex flex-col gap-1 rounded-lg border-2 border-muted/20 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className={`flex items-center gap-1.5 ${achieved ? "text-positive" : "text-foreground"}`}>
                {achieved && <CheckIcon width={13} height={13} />}
                {reward.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs tabular-nums text-muted">{reward.target_amount.toFixed(0)} ₺</span>
                <button
                  type="button"
                  onClick={() => onDelete(reward.id)}
                  aria-label="Ödülü sil"
                  className="btn text-muted opacity-0 hover:text-negative group-hover:opacity-100"
                >
                  <TrashIcon width={13} height={13} />
                </button>
              </div>
            </div>
            {!achieved && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-border-soft">
                <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progressPct}%` }} />
              </div>
            )}
          </div>
        );
      })}

      {open ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ödül, örn. Yeni kulaklık"
            className="h-9 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Hedef ₺"
            inputMode="decimal"
            className="h-9 w-24 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <button
            type="submit"
            className="btn h-9 shrink-0 rounded-lg bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25"
          >
            Ekle
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn flex w-fit items-center gap-1.5 rounded-lg border-2 border-dashed border-muted/30 px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          <PlusIcon width={12} height={12} />
          Ödül Hedefi Ekle
        </button>
      )}
    </div>
  );
}
