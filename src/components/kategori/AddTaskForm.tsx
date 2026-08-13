"use client";

import { useState } from "react";
import { FrequencyDropdown } from "@/components/FrequencyDropdown";
import { WeightStepper } from "@/components/WeightStepper";
import { useAppData, type TaskFrequency } from "@/lib/supabase/app-data-context";

export function AddTaskForm({ categoryId }: { categoryId: string }) {
  const { addTask } = useAppData();
  const [title, setTitle] = useState("");
  const [weight, setWeight] = useState(5);
  const [frequency, setFrequency] = useState<TaskFrequency>("daily");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await addTask(categoryId, title, weight, frequency);
    setTitle("");
    setWeight(5);
    setFrequency("daily");
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border-2 border-muted/30 p-3 sm:flex-row sm:items-center"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Yeni görev ekle..."
        className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
      />
      <FrequencyDropdown value={frequency} onChange={setFrequency} />
      <div className="flex h-10 items-center gap-2 overflow-hidden rounded-lg border-2 border-muted/30 bg-background-elevated pl-3 pr-1 text-sm text-muted">
        <span>Ağırlık</span>
        <span className="h-5 w-px bg-muted/30" aria-hidden />
        <WeightStepper value={weight} onChange={setWeight} />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="h-10 rounded-lg bg-accent-soft px-5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
      >
        {saving ? "Ekleniyor..." : "Görev Ekle"}
      </button>
    </form>
  );
}
