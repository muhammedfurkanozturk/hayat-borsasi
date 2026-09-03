"use client";

import { useState } from "react";
import {
  currentMonthStartIso,
  currentWeekStartIso,
  reviewScoreMultiplier,
  upsertMonthlyReview,
  upsertWeeklyReview,
  type CategoryRating,
  type ReviewAnswers,
} from "@hayat-borsasi/shared";
import { StarIcon, XIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import type { Category } from "@/lib/supabase/app-data-context";

// "eksikler" envanteri madde 6 — CLAUDE.md bölüm 5'in öngördüğü "haftalık/
// aylık skor, review cevaplarıyla ayarlanır" formülünün ilk gerçek
// uygulaması. Kullanıcı onaylı karar: kategori bazlı 1-5 memnuniyet puanı +
// serbest not, ortalama puana göre ±%10 aralığında bir çarpan (bkz.
// reviewScoreMultiplier, packages/shared/src/supabase/reviews.ts).
export function PeriodReviewModal({
  open,
  onClose,
  period,
  categories,
  baseScore,
  existingRatings,
  existingNote,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  period: "weekly" | "monthly";
  categories: Category[];
  baseScore: number;
  existingRatings: CategoryRating[];
  existingNote: string | null;
  onSaved: (adjustedScore: number, answers: ReviewAnswers) => void;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(existingRatings.map((r) => [r.categoryId, r.rating]))
  );
  const [note, setNote] = useState(existingNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryRatings: CategoryRating[] = categories
    .filter((c) => ratings[c.id])
    .map((c) => ({ categoryId: c.id, categoryName: c.name, rating: ratings[c.id] }));
  const multiplier = reviewScoreMultiplier(categoryRatings);
  const adjustedScore = Math.max(0, Math.min(100, baseScore * multiplier));

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const answers: ReviewAnswers = { categoryRatings, note: note.trim() || null };
    try {
      if (period === "weekly") {
        await upsertWeeklyReview(supabase, user.id, currentWeekStartIso(), answers, adjustedScore);
      } else {
        await upsertMonthlyReview(supabase, user.id, currentMonthStartIso(), answers, adjustedScore);
      }
      onSaved(adjustedScore, answers);
      onClose();
    } catch (err) {
      console.error("Değerlendirme kaydedilemedi:", err);
      setError("Kaydedilemedi, tekrar dener misin?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} panelClassName="w-full max-w-md rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">
            {period === "weekly" ? "Bu Haftayı Değerlendir" : "Bu Ayı Değerlendir"}
          </h2>
          <button type="button" onClick={onClose} className="btn text-muted hover:text-foreground">
            <XIcon width={16} height={16} />
          </button>
        </div>
        <p className="text-xs text-muted">
          Her kategoriden ne kadar memnun kaldığını puanla (opsiyonel) — {period === "weekly" ? "haftalık" : "aylık"}{" "}
          endeksin gerçek görev ortalamasına göre hafifçe (±%10) ayarlanır.
        </p>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-xs text-muted">Henüz hiç kategorin yok.</p>
          ) : (
            categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3 py-2">
                <span className="text-sm text-foreground">{c.name}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRatings((prev) => ({ ...prev, [c.id]: prev[c.id] === n ? 0 : n }))}
                      aria-label={`${c.name} için ${n} yıldız`}
                      className="btn text-muted hover:text-pro"
                    >
                      <StarIcon
                        width={16}
                        height={16}
                        strokeWidth={ratings[c.id] >= n ? 0 : 1.5}
                        fill={ratings[c.id] >= n ? "currentColor" : "none"}
                        className={ratings[c.id] >= n ? "text-pro" : ""}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Kısa bir not (opsiyonel)..."
          rows={3}
          className="w-full resize-none rounded-lg border-2 border-muted/25 bg-background-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />

        {categoryRatings.length > 0 && (
          <p className="text-xs text-muted">
            Önizleme: {baseScore.toFixed(1)} → <span className="font-medium text-foreground">{adjustedScore.toFixed(1)}</span> (
            {multiplier >= 1 ? "+" : ""}
            {((multiplier - 1) * 100).toFixed(0)}%)
          </p>
        )}

        {error && <p className="text-xs text-negative">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </Modal>
  );
}
