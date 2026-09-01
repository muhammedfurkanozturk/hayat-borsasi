"use client";

import { useDraggable } from "@dnd-kit/core";
import { formatDaysAgo, todayIso } from "@hayat-borsasi/shared";
import { DumbbellIcon, TrashIcon, TrophyIcon } from "@/components/icons";
import type { DbExercise } from "@hayat-borsasi/shared";

// B-fit'teki (piyasa araştırması) "yeni PR" vurgusu + FoodLens/
// OpenNutriTracker'daki kart üstü "son yapıldı" chip fikri — kişisel rekor
// ve son tarih workout_sets'ten türetilip WorkoutLogPanel'den prop olarak
// geliyor, ek bir tablo yok.
export function ExerciseCard({
  exercise,
  onDelete,
  personalRecordKg,
  isNewRecord,
  lastDoneDate,
}: {
  exercise: DbExercise;
  onDelete: (exercise: DbExercise) => void;
  personalRecordKg?: number;
  isNewRecord?: boolean;
  lastDoneDate?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: exercise.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 30 }
          : undefined
      }
      className={`group relative flex h-20 w-28 shrink-0 cursor-grab flex-col items-center justify-center gap-1 rounded-lg border-2 border-[color:var(--sport-muted)]/25 bg-[color:var(--sport-elevated)] px-1.5 text-center active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      } ${isNewRecord ? "animate-pulse border-pro/60" : ""}`}
    >
      <DumbbellIcon width={16} height={16} className="text-[color:var(--sport-accent)]" />
      <span className="line-clamp-2 text-[11px] font-black italic uppercase leading-tight tracking-tight text-[color:var(--sport-text)]">
        {exercise.name}
      </span>
      {personalRecordKg != null && (
        <span className="flex items-center gap-0.5 font-mono text-[10px] tabular-nums text-pro">
          <TrophyIcon width={10} height={10} />
          {personalRecordKg}kg
        </span>
      )}
      {lastDoneDate && <span className="text-[9px] text-[color:var(--sport-muted)]">{formatDaysAgo(lastDoneDate, todayIso())}</span>}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(exercise);
        }}
        aria-label="Hareketi sil"
        className="btn absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md bg-[color:var(--sport-surface)]/80 text-[color:var(--sport-muted)] opacity-0 backdrop-blur-sm hover:text-negative group-hover:opacity-100"
      >
        <TrashIcon width={11} height={11} />
      </button>
    </div>
  );
}
