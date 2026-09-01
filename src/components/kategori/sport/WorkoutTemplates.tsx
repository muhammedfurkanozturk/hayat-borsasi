"use client";

import { useState } from "react";
import type { DbWorkoutTemplate, DbWorkoutTemplateItem } from "@hayat-borsasi/shared";
import { ListCheckIcon, PlusIcon, TrashIcon } from "@/components/icons";

// OpenNutriTracker + genel pazardaki (piyasa araştırması, push/pull/legs
// gibi) antrenman şablonu/rutin fikri — bir şablon birden fazla hareket
// adı tutar, "Bugüne Uygula" o hareketlerin her biri için bugüne 3 set×10
// tekrar ile hızlı bir başlangıç oluşturur (kullanıcı sonra düzenler).
export function WorkoutTemplates({
  templates,
  items,
  onCreate,
  onApply,
  onDelete,
  applyingId,
}: {
  templates: DbWorkoutTemplate[];
  items: DbWorkoutTemplateItem[];
  onCreate: (name: string, exerciseNames: string[]) => void;
  onApply: (template: DbWorkoutTemplate) => void;
  onDelete: (templateId: string) => void;
  applyingId: string | null;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [exerciseNames, setExerciseNames] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const names = exerciseNames
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (!name.trim() || names.length === 0) return;
    onCreate(name.trim(), names);
    setName("");
    setExerciseNames("");
    setFormOpen(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
      <h2 className="text-sm font-medium text-[color:var(--sport-text)]">Antrenman Şablonları</h2>

      {templates.length === 0 && !formOpen && <p className="text-xs text-[color:var(--sport-muted)]">Henüz şablon yok.</p>}

      <div className="flex flex-col gap-2">
        {templates.map((template) => {
          const templateItems = items.filter((i) => i.template_id === template.id);
          return (
            <div
              key={template.id}
              className="flex items-center justify-between gap-2 rounded-lg border-2 border-[color:var(--sport-muted)]/25 bg-[color:var(--sport-elevated)] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[color:var(--sport-text)]">{template.name}</p>
                <p className="truncate text-xs text-[color:var(--sport-muted)]">{templateItems.map((i) => i.exercise_name).join(", ")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onApply(template)}
                  disabled={applyingId === template.id}
                  className="btn flex h-8 items-center gap-1 rounded-lg bg-[color:var(--sport-accent)]/15 px-2.5 text-xs font-medium text-[color:var(--sport-accent)] hover:bg-[color:var(--sport-accent)]/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  <ListCheckIcon width={12} height={12} />
                  {applyingId === template.id ? "Uygulanıyor..." : "Bugüne Uygula"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(template.id)}
                  aria-label="Şablonu sil"
                  className="btn flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--sport-muted)] hover:text-negative"
                >
                  <TrashIcon width={13} height={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {formOpen ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border-2 border-[color:var(--sport-accent)]/40 bg-[color:var(--sport-accent)]/15 p-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Şablon adı, örn. İtiş Günü"
            className="h-9 rounded-lg border-2 border-[color:var(--sport-muted)]/30 bg-[color:var(--sport-surface)] px-3 text-sm text-[color:var(--sport-text)] outline-none placeholder:text-[color:var(--sport-muted)] focus:border-[color:var(--sport-accent)]/50"
          />
          <input
            value={exerciseNames}
            onChange={(e) => setExerciseNames(e.target.value)}
            placeholder="Hareketler, virgülle ayır: Bench Press, Omuz Press"
            className="h-9 rounded-lg border-2 border-[color:var(--sport-muted)]/30 bg-[color:var(--sport-surface)] px-3 text-sm text-[color:var(--sport-text)] outline-none placeholder:text-[color:var(--sport-muted)] focus:border-[color:var(--sport-accent)]/50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn h-8 flex-1 rounded-lg bg-[color:var(--sport-accent)] px-3 text-xs font-semibold text-white hover:opacity-90"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="btn h-8 rounded-lg border-2 border-[color:var(--sport-muted)]/30 px-3 text-xs text-[color:var(--sport-muted)] hover:text-[color:var(--sport-text)]"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="btn flex w-fit items-center gap-1.5 rounded-lg border-2 border-dashed border-[color:var(--sport-muted)]/30 px-3 py-1.5 text-xs text-[color:var(--sport-muted)] hover:text-[color:var(--sport-text)]"
        >
          <PlusIcon width={12} height={12} />
          Şablon Ekle
        </button>
      )}
    </div>
  );
}
