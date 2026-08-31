"use client";

import { useState } from "react";
import type { DbFocusSession, DbFocusSubject } from "@hayat-borsasi/shared";
import { PulseIcon } from "@/components/icons";

// Chronoid'deki (piyasa araştırması) "verimin hakkında doğal dilde soru
// sor" fikri — mevcut elle tutulan Pomodoro seans geçmişi üzerine kurulu.
export function FocusQA({ sessions, subjects }: { sessions: DbFocusSession[]; subjects: DbFocusSubject[] }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const subjectById = new Map(subjects.map((s) => [s.id, s.name]));
      const res = await fetch("/api/focus-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          sessions: sessions.map((s) => ({
            subject: s.subject_id ? (subjectById.get(s.subject_id) ?? null) : null,
            durationMinutes: s.duration_minutes,
            completedAt: s.completed_at,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Cevap alınamadı.");
      setAnswer(json.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cevap alınamadı.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border-2 border-muted/20 bg-background-elevated p-3">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
        <PulseIcon width={12} height={12} />
        Verimine Soru Sor
      </span>
      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="örn. Bu hafta en çok neye çalıştım?"
          className="h-9 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="btn h-9 shrink-0 rounded-lg bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Düşünüyor..." : "Sor"}
        </button>
      </form>
      {error && <p className="text-xs text-negative">{error}</p>}
      {answer && <p className="text-sm text-foreground">{answer}</p>}
    </div>
  );
}
