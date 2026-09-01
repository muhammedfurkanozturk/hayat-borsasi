"use client";

import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, type EquipmentType, type MuscleGroup } from "@hayat-borsasi/shared";

export const MUSCLE_ENTRIES = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][];
export const EQUIPMENT_ENTRIES = Object.entries(EQUIPMENT_LABELS) as [EquipmentType, string][];

// WorkoutBuilderPanel (Bölüm 2) ve ExerciseLibraryPanel (Bölüm 3) arasında
// paylaşılan basit çoklu-seçim pill grubu — kas grubu/ekipman filtreleri
// için tekilleştirildi.
export function MultiSelect<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: [T, string][];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([value, label]) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`btn rounded-full border-2 px-3 py-1 text-xs font-medium ${
              active ? "border-[color:var(--sport-accent)]/50 bg-[color:var(--sport-accent)]/15 text-[color:var(--sport-accent)]" : "border-[color:var(--sport-muted)]/25 text-[color:var(--sport-muted)] hover:border-[color:var(--sport-accent)]/30"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
