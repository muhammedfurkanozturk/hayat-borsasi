"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon, PencilIcon } from "@/components/icons";
import type { EditTarget } from "@/components/gunluk/types";
import { formatTodayLong } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { todayIso, updateDailyNote } from "@/lib/supabase/daily";
import { useAppData } from "@/lib/supabase/app-data-context";

// Tek "yazma" alanı — hem bugünün notunu hem de arşivden "Düzenle" ile
// seçilen geçmiş bir günün notunu buradan düzenliyoruz. Boşta iken (editing
// olmadığında) tek bir büyük buton var; bugüne ait not varsa "güncelle",
// yoksa "başla" yazıyor. Düzenlemeye başlarken taslak her zaman o günün
// GÜNCEL kayıtlı metniyle dolu geliyor — bu yüzden kaydedince önceki
// yazılanlar asla üzerine yazılıp kaybolmuyor.
export function TopNoteEditor({
  editTarget,
  onEditConsumed,
}: {
  editTarget: EditTarget | null;
  onEditConsumed: () => void;
}) {
  const { dailyNote, setDailyNote, loading } = useAppData();
  const containerRef = useRef<HTMLDivElement>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState<{ date: string; label: string; entryId: string | null } | null>(null);
  const [handledTarget, setHandledTarget] = useState<EditTarget | null>(null);

  const isToday = !target || target.date === todayIso();

  // Arşivden "Düzenle" tetiklenince (editTarget prop'u değişince) o günün
  // notunu üste yükleyip düzenleme moduna geçiyoruz — render sırasında state
  // güncelleme deseni, effect gerektirmiyor.
  if (editTarget && editTarget !== handledTarget) {
    setHandledTarget(editTarget);
    setTarget({ date: editTarget.date, label: editTarget.dateLabel, entryId: editTarget.entryId });
    setDraft(editTarget.noteText);
    setEditing(true);
  }

  // Yukarıdaki senkronizasyon gerçekleştiğinde, DOM'a kaydırma ve üst
  // bileşene "işlendi" bildirimi — bunlar gerçek yan etkiler, effect'te kalır.
  useEffect(() => {
    if (editTarget && editTarget === handledTarget) {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      onEditConsumed();
    }
  }, [editTarget, handledTarget, onEditConsumed]);

  const [listening, setListening] = useState(false);
  const [unsupportedNotice, setUnsupportedNotice] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = draft;
  });

  useEffect(() => {
    const SpeechRecognitionImpl = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "tr-TR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        const current = draftRef.current;
        setDraft(current ? `${current} ${finalTranscript.trim()}` : finalTranscript.trim());
      }
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setUnsupportedNotice(true);
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      setUnsupportedNotice(false);
      recognition.start();
      setListening(true);
    }
  }

  function startEditingToday() {
    setTarget(null);
    setDraft(dailyNote);
    setEditing(true);
  }

  async function handleSave() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }

    if (isToday) {
      setDailyNote(draft);
    } else if (target?.entryId) {
      const supabase = createClient();
      await updateDailyNote(supabase, target.entryId, draft);
    }

    setEditing(false);
    setTarget(null);
  }

  if (!editing) {
    if (loading) {
      return (
        <div
          ref={containerRef}
          className="flex min-h-[140px] w-full animate-pulse items-center justify-center rounded-2xl border border-dashed border-border-soft bg-surface shadow-card px-6 py-10"
        >
          <span className="text-sm text-muted">Yükleniyor...</span>
        </div>
      );
    }

    const hasNote = dailyNote.trim().length > 0;
    return (
      <div ref={containerRef}>
        <button
          type="button"
          onClick={startEditingToday}
          className="btn flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/40 bg-accent-soft px-6 py-10 text-accent hover:border-accent/60 hover:bg-accent/25"
        >
          <PencilIcon width={22} height={22} />
          <span className="text-base font-semibold">
            {hasNote ? "Bugünün Notlarını Güncelle" : "Bugün Not Tutmaya Başla"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="modal-in flex flex-col gap-3 rounded-2xl border border-border bg-surface shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            {isToday ? "Bugün nasıl geçti?" : target?.label}
          </h2>
          {isToday && (
            <p className="text-xs text-muted" suppressHydrationWarning>
              {formatTodayLong()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={toggleListening}
          aria-pressed={listening}
          aria-label={listening ? "Sesli notu durdur" : "Sesli not al"}
          className={`btn flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 ${
            listening
              ? "border-negative/50 bg-negative-soft text-negative scale-105"
              : "border-muted/40 text-muted hover:border-accent/50 hover:text-accent"
          }`}
        >
          <MicIcon width={28} height={28} />
        </button>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Neler yaşadın, neler hissettin?"
        rows={7}
        autoFocus
        className="resize-none rounded-lg border border-border-soft bg-background-elevated px-3 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/50"
      />

      <button
        type="button"
        onClick={handleSave}
        className="btn self-end rounded-lg bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent hover:-translate-y-px hover:bg-accent/25"
      >
        Kaydet
      </button>

      {listening && (
        <p className="flex items-center gap-1.5 text-xs text-negative">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-negative" />
          Dinleniyor...
        </p>
      )}

      {unsupportedNotice && (
        <p className="text-xs text-muted">
          Tarayıcın sesli not özelliğini desteklemiyor. Chrome veya Edge&apos;de dene.
        </p>
      )}
    </div>
  );
}
