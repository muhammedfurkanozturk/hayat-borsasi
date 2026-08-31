"use client";

import { useState } from "react";
import { FrequencyDropdown } from "@/components/FrequencyDropdown";
import { WeightStepper } from "@/components/WeightStepper";
import { PlusIcon, XIcon } from "@/components/icons";
import { useAppData, type TaskFrequency } from "@/lib/supabase/app-data-context";

// Habitify'nin "Build New Habit" paneline referansla (Bölüm 4, 2026-08-25):
// Repeat→Tekrar ve Goal'un "kaç kez/gün" kısmı yerine bizim mevcut
// weight'imiz zaten var, Area zaten kategori sayfasının kendisi (ayrı bir
// alan gerekmiyor). Reminders (bildirim altyapımız yok) ve Magic Fill (AI
// otomatik doldurma) bilinçli olarak ALINMADI — işlevsiz bir kontrol
// eklemek yanıltıcı olurdu. Checklist → mevcut subtasks sistemine bağlandı.
//
// 2026-08-27 (kullanıcı onayıyla kaldırıldı): Zaman Dilimi/Başlangıç/Bitiş
// alanları — denetlendi (bkz. CLAUDE.md madde 5 analizi), hiçbir yerde
// (calculateScore, TaskRow, DailyChecklist) gerçekten okunmuyorlardı,
// sadece kaydedilip duran dekoratif alanlardı. Kullanıcı kaldırılmasını
// istedi. `tasks.time_of_day`/`start_date`/`end_date` sütunları DB'de
// duruyor (silinmedi, sadece kullanılmıyor) — kod tarafı tamamen temizlendi.
export function AddTaskForm({ categoryId }: { categoryId: string }) {
  const { addTask, addSubtask } = useAppData();
  const [expanded, setExpanded] = useState(false);

  const [title, setTitle] = useState("");
  const [weight, setWeight] = useState(5);
  const [frequency, setFrequency] = useState<TaskFrequency>("daily");
  // 2026-08-26 (kullanıcı bulgusu — "kafa karıştırıcı"): Kontrol Listesi
  // her zaman açık bir alan olarak duruyordu, ekleme akışı canlı testte
  // aslında çalışıyordu (bkz. TaskRow.tsx'teki eşdeğeri) ama burada önce
  // net bir Evet/Hayır sorusu yok, kullanıcı bunun ne işe yaradığını
  // anlamadan bir input'la karşılaşıyordu. wantsChecklist eklenip alan
  // Evet denene kadar gizlendi.
  const [wantsChecklist, setWantsChecklist] = useState(false);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [saving, setSaving] = useState(false);

  function addChecklistItem() {
    const trimmed = newChecklistItem.trim();
    if (!trimmed) return;
    setChecklist((prev) => [...prev, trimmed]);
    setNewChecklistItem("");
  }

  function reset() {
    setTitle("");
    setWeight(5);
    setFrequency("daily");
    setWantsChecklist(false);
    setChecklist([]);
    setNewChecklistItem("");
    setExpanded(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const taskId = await addTask(categoryId, title, weight, frequency);
    if (taskId) {
      for (const item of checklist) {
        await addSubtask(taskId, item);
      }
    }
    setSaving(false);
    reset();
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="btn flex h-10 items-center gap-2 self-start rounded-lg border-2 border-dashed border-muted/30 px-4 text-sm font-medium text-muted hover:border-accent/50 hover:text-accent"
      >
        <PlusIcon width={14} height={14} />
        Görev Ekle
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border-2 border-muted/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Yeni Görev</span>
        <button
          type="button"
          onClick={reset}
          aria-label="İptal"
          className="btn flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground"
        >
          <XIcon width={16} height={16} />
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Görev adı..."
        autoFocus
        className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/50"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Tekrar</span>
          <FrequencyDropdown value={frequency} onChange={setFrequency} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Ağırlık</span>
          <div className="flex h-10 items-center overflow-hidden rounded-lg border-2 border-muted/30 bg-background-elevated">
            <WeightStepper value={weight} onChange={setWeight} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Kontrol Listesi</span>
        {!wantsChecklist ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">Alt görev eklemek ister misiniz?</span>
            <button
              type="button"
              onClick={() => setWantsChecklist(true)}
              className="btn h-8 rounded-lg border-2 border-muted/30 px-3 text-xs font-medium text-muted hover:border-accent/50 hover:text-accent"
            >
              Alt Görev Ekle
            </button>
          </div>
        ) : (
          <>
            {checklist.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {checklist.map((item, i) => (
                  <li
                    key={`${item}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-border-soft bg-surface px-3 py-1.5 text-sm text-foreground"
                  >
                    <span className="flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => setChecklist((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Kaldır"
                      className="btn flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-negative/10 hover:text-negative"
                    >
                      <XIcon width={14} height={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
                placeholder="Alt görev adı..."
                className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addChecklistItem}
                  disabled={!newChecklistItem.trim()}
                  className="btn h-9 rounded-lg bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Alt Görevi Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setNewChecklistItem("")}
                  disabled={!newChecklistItem.trim()}
                  className="btn h-9 rounded-lg border-2 border-muted/30 px-3 text-xs text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  İptal Et
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border-soft pt-3">
        <button
          type="button"
          onClick={reset}
          className="btn h-10 rounded-lg border-2 border-muted/30 px-5 text-sm text-muted hover:text-foreground"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="btn h-10 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
