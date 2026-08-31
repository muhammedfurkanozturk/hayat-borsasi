"use client";

import { useState } from "react";
import type { DbRoadmapNode } from "@hayat-borsasi/shared";
import { BookmarkIcon, CheckIcon, SparkleIcon, TrashIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";

// Onepin ilhamı (Madde 8, piyasa araştırması — onepin.io: "One Thing →
// aylık Milestone → haftalık/günlük Task" 3 katmanlı zaman bazlı hiyerarşi).
// Bizim ağacımız konu bazlı (roadmap.sh esintili), Onepin'in katı aylık
// yapısını dayatmak mevcut şablonları kırardı — bunun yerine ÖZÜ (kilometre
// taşı işaretleme + kişisel hedef tarih + kısa aksiyon notu) herhangi bir
// düğüme (hangi derinlikte olursa olsun) eklenebilir hâle getirildi.
// Madde 9 (roadmap.sh keşif eki) — yer işareti (bkz. anlık toggle, Kaydet'e
// bağlı değil) ve "AI ile Öğren" (roadmap.sh'in aynı adlı özelliğinden
// ilham, kendi AI/UI'ımızla — konu başlığını Claude'a gönderip kısa bir
// açıklama alıyor, ephemeral, kaydedilmiyor).
export function RoadmapNodeDetailModal({
  node,
  roadmapName,
  parentTitle,
  onClose,
  onSave,
  onDelete,
  onToggleBookmark,
}: {
  node: DbRoadmapNode | null;
  roadmapName: string;
  parentTitle: string | null;
  onClose: () => void;
  onSave: (input: { title: string; isMilestone: boolean; targetDate: string | null; actionNote: string | null }) => Promise<void>;
  onDelete: () => void;
  onToggleBookmark: () => Promise<void>;
}) {
  const [title, setTitle] = useState(node?.title ?? "");
  const [isMilestone, setIsMilestone] = useState(node?.is_milestone ?? false);
  const [targetDate, setTargetDate] = useState(node?.target_date ?? "");
  const [actionNote, setActionNote] = useState(node?.action_note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookmarked, setBookmarked] = useState(node?.bookmarked ?? false);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleToggleBookmark() {
    setBookmarkPending(true);
    setBookmarked((v) => !v);
    try {
      await onToggleBookmark();
    } catch {
      setBookmarked((v) => !v); // migration uygulanmamışsa geri al
    }
    setBookmarkPending(false);
  }

  async function handleAskAi() {
    if (!node) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/roadmap-learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicTitle: node.title, roadmapName, parentTitle }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Açıklama alınamadı.");
      setAiExplanation(json.explanation);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Açıklama alınamadı.");
    }
    setAiLoading(false);
  }

  // `node` değişince alanları yeniden başlat — Modal her açılışta farklı bir
  // düğüm taşıyabilir, `key={node?.id}` kullanan çağıran taraf (RoadmapPanel)
  // zaten bu bileşeni yeniden mount ediyor, bu yüzden useEffect gerekmiyor.

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ title: title.trim(), isMilestone, targetDate: targetDate || null, actionNote: actionNote.trim() || null });
      onClose();
    } catch (err) {
      // Kilometre taşı/hedef tarih/aksiyon notu migration'ı (20260901130000)
      // henüz uygulanmamış olabilir — Sağlıklı Beslenme'deki "Hedef
      // kaydedilemedi." desenindeki gibi kartın İÇİNDE göstererek modal açık
      // kalıyor, buton kilitli kalmıyor.
      console.error("Düğüm kaydedilemedi (migration uygulanmamış olabilir):", err);
      setError("Kaydedilemedi. (Migration uygulanmamış olabilir.)");
    }
    setSaving(false);
  }

  return (
    <Modal
      open={node !== null}
      onClose={onClose}
      panelClassName="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-background-elevated p-5"
    >
      {node && (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm font-medium text-foreground outline-none focus:border-accent/50"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsMilestone((v) => !v)}
              className={`btn flex h-10 flex-1 items-center gap-2 rounded-lg border-2 px-3 text-sm ${
                isMilestone ? "border-pro bg-pro-soft text-pro" : "border-muted/30 text-muted hover:text-foreground"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  isMilestone ? "border-pro bg-pro text-white" : "border-dashed border-muted/40"
                }`}
              >
                {isMilestone && <CheckIcon width={9} height={9} strokeWidth={3} />}
              </span>
              Kilometre Taşı
            </button>
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={bookmarkPending}
              aria-label="Yer işareti"
              className={`btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 disabled:opacity-50 ${
                bookmarked ? "border-accent bg-accent-soft text-accent" : "border-muted/30 text-muted hover:text-foreground"
              }`}
            >
              <BookmarkIcon width={15} height={15} strokeWidth={bookmarked ? 0 : 1.75} fill={bookmarked ? "currentColor" : "none"} />
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Hedef Tarih (opsiyonel)</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Aksiyon Notu (opsiyonel)</span>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Bu konu için sıradaki somut adım nedir?"
              rows={3}
              className="rounded-lg border-2 border-muted/30 bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
          </label>

          <div className="flex flex-col gap-2 border-t border-border-soft pt-3">
            <button
              type="button"
              onClick={handleAskAi}
              disabled={aiLoading}
              className="btn flex h-9 items-center justify-center gap-1.5 rounded-lg border-2 border-accent/30 text-sm font-medium text-accent hover:bg-accent-soft disabled:pointer-events-none disabled:opacity-50"
            >
              <SparkleIcon width={14} height={14} />
              {aiLoading ? "Hazırlanıyor..." : aiExplanation ? "Tekrar Sor" : "AI ile Öğren"}
            </button>
            {aiError && <p className="text-xs text-negative">{aiError}</p>}
            {aiExplanation && (
              <div className="max-h-48 overflow-y-auto rounded-lg border-2 border-accent/20 bg-accent-soft/30 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                {aiExplanation}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-negative">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="btn h-10 flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Düğümü sil"
              className="btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-negative/30 text-negative hover:bg-negative-soft"
            >
              <TrashIcon width={14} height={14} />
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
