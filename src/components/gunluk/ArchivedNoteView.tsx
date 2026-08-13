"use client";

import { useEffect, useState } from "react";
import { PencilIcon } from "@/components/icons";
import type { EditTarget } from "@/components/gunluk/types";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateEntryForDate } from "@/lib/supabase/daily";

// Arşivdeki bir günün notunu sadece GÖRÜNTÜLER — yazma burada olmuyor.
// "Düzenle"ye basınca notu (entryId'siyle birlikte) üst kutuya gönderiyoruz,
// asıl düzenleme orada yapılıyor.
export function ArchivedNoteView({
  date,
  dateLabel,
  onEdit,
}: {
  date: string;
  dateLabel: string;
  onEdit: (target: EditTarget) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const entry = await getOrCreateEntryForDate(supabase, user.id, date);
      if (!cancelled) {
        setEntryId(entry.id);
        setNoteText(entry.note_text);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">{dateLabel}</h2>
        <button
          type="button"
          onClick={() => onEdit({ date, dateLabel, entryId, noteText })}
          className="flex items-center gap-1.5 rounded-lg border-2 border-muted/30 bg-background-elevated px-3 py-2 text-sm font-medium text-foreground hover:border-accent/50"
        >
          <PencilIcon width={14} height={14} />
          Düzenle
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {noteText.trim() ? noteText : <span className="text-muted">Henüz not yok.</span>}
      </p>
    </div>
  );
}
