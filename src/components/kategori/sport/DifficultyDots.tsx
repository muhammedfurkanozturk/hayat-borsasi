import type { ExerciseDifficulty } from "@hayat-borsasi/shared";

const DIFFICULTY_LEVEL: Record<ExerciseDifficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

// Freeletics'in "●●○" nokta göstergesi — süre/zorluk gibi bilgileri
// metin yerine minimal bir nokta dizisiyle sunuyor.
export function DifficultyDots({ difficulty }: { difficulty: ExerciseDifficulty }) {
  const level = DIFFICULTY_LEVEL[difficulty];
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Zorluk: ${level}/3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= level ? "bg-[color:var(--sport-accent)]" : "bg-[color:var(--sport-muted)]/30"}`}
        />
      ))}
    </span>
  );
}
