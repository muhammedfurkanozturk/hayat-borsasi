"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { useAppData } from "@/lib/supabase/app-data-context";
import { HabitBreakCard } from "./HabitBreakCard";

// "Kötü Alışkanlıklar" kategorisinin tüm içeriği — bu kategoride "Görev
// Ekle" yerine bu panel var, kategoriye eklenen her şey otomatik olarak
// bir kötü alışkanlık (is_habit_break=true, günlük) sayılır.
export function HabitTrackerPanel({ categoryId }: { categoryId: string }) {
  const { tasks, addTask } = useAppData();
  const habitTasks = tasks.filter((t) => t.categoryId === categoryId);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addTask(categoryId, name.trim(), 5, "daily", true);
    setName("");
    setSaving(false);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">Kötü Alışkanlıklar</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/25"
        >
          <PlusIcon width={14} height={14} />
          Kötü Alışkanlık Ekle
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border-2 border-muted/30 p-3 sm:flex-row sm:items-center">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="örn. Sigara"
            className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={saving}
            className="btn h-10 shrink-0 rounded-lg bg-accent-soft px-5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? "Ekleniyor..." : "Ekle"}
          </button>
        </form>
      )}

      {habitTasks.length === 0 ? (
        <p className="px-2 py-3 text-sm text-muted">Henüz bir kötü alışkanlık eklemedin.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {habitTasks.map((task) => (
            <HabitBreakCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
