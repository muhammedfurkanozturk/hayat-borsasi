"use client";

import { useEffect, useState } from "react";
import { deleteOutfitLog, fetchOutfitLogs, insertOutfitLog, todayIso, type DbOutfitLog } from "@hayat-borsasi/shared";
import { TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "outfit-photos";
const SIGNED_URL_TTL_SECONDS = 3600;

export function OutfitGallery({ categoryId }: { categoryId: string }) {
  const [logs, setLogs] = useState<DbOutfitLog[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const rows = await fetchOutfitLogs(supabase, categoryId);
    setLogs(rows);

    const withPhoto = rows.filter((r) => r.photo_path);
    if (withPhoto.length > 0) {
      const entries = await Promise.all(
        withPhoto.map(async (r) => {
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(r.photo_path!, SIGNED_URL_TTL_SECONDS);
          return [r.id, data?.signedUrl ?? ""] as const;
        })
      );
      setPhotoUrls(Object.fromEntries(entries));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() && !file) return;

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

    let photoPath: string | null = null;
    if (file) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const upload = await supabase.storage.from(BUCKET).upload(path, file);
      if (upload.error) {
        setError("Fotoğraf yüklenemedi: " + upload.error.message);
        setSaving(false);
        return;
      }
      photoPath = path;
    }

    const created = await insertOutfitLog(supabase, user.id, categoryId, todayIso(), note.trim(), photoPath);
    setLogs((prev) => [created, ...prev]);
    if (photoPath) {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photoPath, SIGNED_URL_TTL_SECONDS);
      if (data?.signedUrl) setPhotoUrls((prev) => ({ ...prev, [created.id]: data.signedUrl }));
    }
    setNote("");
    setFile(null);
    setSaving(false);
  }

  async function handleDelete(logEntry: DbOutfitLog) {
    const supabase = createClient();
    if (logEntry.photo_path) {
      await supabase.storage.from(BUCKET).remove([logEntry.photo_path]);
    }
    await deleteOutfitLog(supabase, logEntry.id);
    setLogs((prev) => prev.filter((l) => l.id !== logEntry.id));
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Stil Galerisi</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border-2 border-muted/30 p-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Bugünkü kombin hakkında bir not (opsiyonel)"
          className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent"
          />
          <button
            type="submit"
            disabled={saving || (!note.trim() && !file)}
            className="btn h-10 shrink-0 rounded-lg bg-accent-soft px-5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Ekle"}
          </button>
        </div>
        {error && <p className="text-xs text-negative">{error}</p>}
      </form>

      {!loading && logs.length === 0 && <p className="text-sm text-muted">Henüz kombin eklenmedi.</p>}

      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {logs.map((entry) => (
            <div key={entry.id} className="group relative flex flex-col gap-1.5 overflow-hidden rounded-xl border-2 border-muted/20">
              {photoUrls[entry.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrls[entry.id]} alt={entry.note_text || "Kombin"} className="aspect-[3/4] w-full object-cover" />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-background-elevated text-xs text-muted">
                  Foto yok
                </div>
              )}
              <div className="flex flex-col gap-0.5 px-2 pb-2">
                {entry.note_text && <span className="line-clamp-2 text-xs text-foreground">{entry.note_text}</span>}
                <span className="text-[10px] text-muted">{entry.date}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(entry)}
                aria-label="Kombini sil"
                className="btn absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 text-muted opacity-0 backdrop-blur-sm hover:text-negative group-hover:opacity-100"
              >
                <TrashIcon width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
