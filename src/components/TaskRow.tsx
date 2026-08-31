"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckMark } from "@/components/CheckMark";
import { FrequencyDropdown } from "@/components/FrequencyDropdown";
import { WeightStepper } from "@/components/WeightStepper";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useAppData, type Task } from "@/lib/supabase/app-data-context";

function AddSubtaskInline({ taskId }: { taskId: string }) {
  const { addSubtask } = useAppData();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!value.trim()) return;
    setSaving(true);
    await addSubtask(taskId, value);
    setValue("");
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 px-1 pt-1"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Alt görev ekle..."
        className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/50"
      />
      <button
        type="submit"
        disabled={saving}
        className="btn flex h-10 w-24 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent-soft text-sm font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
      >
        <PlusIcon width={16} height={16} />
        Ekle
      </button>
    </form>
  );
}

// Görev listelendiği her yerde (Dashboard, Kategori sayfası) aynı davranış:
// satıra tıklayınca alt görevler paneli açılır/kapanır, sadece checkbox'a
// tıklamak görevi tamamlar. onDelete verilirse satırda bir silme butonu da
// gösterilir (Kategori sayfasında kullanılıyor, Dashboard'da yok).
// allowManageSubtasks true olmadıkça alt görev ekleme/silme kısmı
// gösterilmez — Dashboard'da sadece işaretlenebilir, yönetimi (ekleme/
// silme) yalnızca Kategori sayfasında yapılır.
export function TaskRow({
  task,
  categoryName,
  onDelete,
  allowManageSubtasks = false,
  canMoveUp,
  canMoveDown,
}: {
  task: Task;
  categoryName?: string;
  onDelete?: () => void;
  allowManageSubtasks?: boolean;
  // Kategori sayfasındaki "Görevler" listesinde yukarı/aşağı taşıma
  // butonları — sadece ikisinden biri geçilirse gösterilir (Dashboard'daki
  // kullanımda hiç geçilmiyor, orada bu kontroller yok). true/false, o
  // yöndeki komşu görev olup olmadığını (kenarda mı) belirtir.
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  const {
    subtasks,
    toggleTask,
    toggleSubtask,
    removeSubtask,
    changeTaskFrequency,
    changeTaskWeight,
    moveTaskUp,
    moveTaskDown,
  } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const taskSubtasks = subtasks.filter((s) => s.taskId === task.id);
  const showReorder = allowManageSubtasks && (canMoveUp !== undefined || canMoveDown !== undefined);

  return (
    <div
      className="rounded-lg hover:bg-surface-hover"
      style={{ transition: "background-color var(--dur-base) var(--ease-snap)" }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-4 px-3 py-4 text-left"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTask(task.id);
          }}
          aria-pressed={task.completed}
          aria-label={`${task.title} görevini tamamla`}
          className="btn group rounded-md"
        >
          <CheckMark checked={task.completed} size={30} />
        </button>
        <span
          className={`flex-1 text-base ${
            task.completed ? "text-muted line-through decoration-muted-soft" : "text-foreground"
          }`}
        >
          {task.title}
        </span>
        {categoryName && (
          <span className="hidden rounded-full border border-border-soft px-2.5 py-1 text-xs text-muted sm:inline">
            {categoryName}
          </span>
        )}
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
          {task.subtaskTotal > 0 && (
            <span className="flex h-10 items-center rounded-lg border-2 border-muted/30 bg-background-elevated px-3 font-mono text-xs tabular-nums text-muted">
              {task.subtaskCompleted}/{task.subtaskTotal} alt görev
            </span>
          )}
          {allowManageSubtasks && (
            <FrequencyDropdown
              value={task.frequency}
              onChange={(frequency) => changeTaskFrequency(task.id, frequency)}
            />
          )}
          {allowManageSubtasks ? (
            <div className="flex h-10 items-center overflow-hidden rounded-lg border-2 border-muted/30 bg-background-elevated">
              <WeightStepper value={task.weight} onChange={(weight) => changeTaskWeight(task.id, weight)} />
            </div>
          ) : (
            <span className="flex h-10 items-center rounded-lg border-2 border-muted/30 bg-background-elevated px-3 font-mono text-sm tabular-nums text-muted">
              ×{task.weight}
            </span>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`${task.title} görevini sil`}
              className="btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-muted/30 bg-background-elevated text-muted hover:border-negative/40 hover:text-negative"
            >
              <TrashIcon width={20} height={20} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Alt görevleri kapat" : "Alt görevleri aç"}
            className="btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-muted/30 bg-background-elevated text-muted hover:border-accent/40 hover:text-foreground"
          >
            <ChevronDownIcon
              width={20}
              height={20}
              className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
              style={{ transitionDuration: "var(--dur-base)", transitionTimingFunction: "var(--ease-snap)" }}
            />
          </button>
          {showReorder && (
            <div className="flex h-10 w-8 shrink-0 flex-col overflow-hidden rounded-lg border-2 border-muted/30 bg-background-elevated">
              <button
                type="button"
                onClick={() => moveTaskUp(task.id)}
                disabled={!canMoveUp}
                aria-label={`${task.title} görevini yukarı taşı`}
                className="btn flex flex-1 items-center justify-center text-muted hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronDownIcon width={12} height={12} className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => moveTaskDown(task.id)}
                disabled={!canMoveDown}
                aria-label={`${task.title} görevini aşağı taşı`}
                className="btn flex flex-1 items-center justify-center border-t border-border-soft text-muted hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronDownIcon width={12} height={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="subtasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="overflow-hidden"
          >
            <div className="ml-9 mb-2 flex flex-col gap-2 rounded-lg border-2 border-muted/30 bg-background-elevated p-3.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Alt Görevler</span>

              {taskSubtasks.length === 0 && (
                <p className="px-1 text-sm text-muted">Henüz alt görev yok.</p>
              )}

              {taskSubtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3 rounded-md px-1 py-2">
                  <button type="button" onClick={() => toggleSubtask(sub.id)} aria-pressed={sub.completed} className="btn group rounded-md">
                    <CheckMark checked={sub.completed} size={24} />
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      sub.completed ? "text-muted line-through decoration-muted" : "text-foreground"
                    }`}
                  >
                    {sub.title}
                  </span>
                  {allowManageSubtasks && (
                    <button
                      type="button"
                      onClick={() => removeSubtask(sub.id)}
                      aria-label={`${sub.title} alt görevini sil`}
                      className="btn flex h-10 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-muted/30 bg-surface text-muted hover:border-negative/40 hover:text-negative"
                    >
                      <TrashIcon width={18} height={18} />
                    </button>
                  )}
                </div>
              ))}

              {allowManageSubtasks && <AddSubtaskInline taskId={task.id} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
