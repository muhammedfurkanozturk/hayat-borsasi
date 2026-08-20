"use client";

import { useEffect, useState } from "react";
import { daysAgoIso, deleteMealLog, fetchMealLogs, insertMealLog, todayIso, type DbMealLog } from "@hayat-borsasi/shared";
import { TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

const HISTORY_WINDOW_DAYS = 14;

function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [prefix, data] = result.split(",");
      const mediaType = prefix.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
      resolve({ data, mediaType });
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

export function MealLogPanel({ categoryId }: { categoryId: string }) {
  const [logs, setLogs] = useState<DbMealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const rows = await fetchMealLogs(supabase, categoryId, daysAgoIso(HISTORY_WINDOW_DAYS));
    setLogs(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      const { data, mediaType } = await fileToBase64(file);
      const res = await fetch("/api/meal-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: data, mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analiz başarısız oldu.");
      setDescription(json.description ?? "");
      setCalories(json.calories != null ? String(json.calories) : "");
      setProteinG(json.proteinG != null ? String(json.proteinG) : "");
      setCarbsG(json.carbsG != null ? String(json.carbsG) : "");
      setFatG(json.fatG != null ? String(json.fatG) : "");
      setAiSummary(json.summary ?? null);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analiz başarısız oldu.");
    }
    setAnalyzing(false);
  }

  async function handleSave() {
    if (!description.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertMealLog(supabase, user.id, categoryId, {
        date: todayIso(),
        description: description.trim(),
        calories: calories ? Number(calories) : null,
        proteinG: proteinG ? Number(proteinG) : null,
        carbsG: carbsG ? Number(carbsG) : null,
        fatG: fatG ? Number(fatG) : null,
        aiSummary: aiSummary,
      });
      setLogs((prev) => [created, ...prev]);
      setDescription("");
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
      setAiSummary(null);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await deleteMealLog(supabase, id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Öğün Kaydı</h2>
      <p className="text-xs text-muted">
        Fotoğraf analiz edilir, sonucu kaydedilir — fotoğrafın kendisi hiçbir yerde saklanmaz.
      </p>

      <div className="flex flex-col gap-3 rounded-xl border-2 border-muted/30 p-3">
        <label className="btn flex h-10 w-fit cursor-pointer items-center gap-2 rounded-lg bg-accent-soft px-4 text-sm font-medium text-accent hover:bg-accent/25">
          {analyzing ? "Analiz ediliyor..." : "Yemek Fotoğrafı Yükle ve Analiz Et"}
          <input type="file" accept="image/*" onChange={handlePhotoSelect} disabled={analyzing} className="hidden" />
        </label>

        {analyzeError && <p className="text-xs text-negative">{analyzeError}</p>}

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ne yedin? (fotoğraf olmadan da elle yazabilirsin)"
          className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />

        {aiSummary && <p className="text-xs italic text-muted">{aiSummary}</p>}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="Kalori"
            inputMode="decimal"
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <input
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
            placeholder="Protein (g)"
            inputMode="decimal"
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <input
            value={carbsG}
            onChange={(e) => setCarbsG(e.target.value)}
            placeholder="Karbonhidrat (g)"
            inputMode="decimal"
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <input
            value={fatG}
            onChange={(e) => setFatG(e.target.value)}
            placeholder="Yağ (g)"
            inputMode="decimal"
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !description.trim()}
          className="btn h-10 self-start rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Öğünü Kaydet"}
        </button>
      </div>

      {!loading && logs.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {logs.map((log) => (
            <li key={log.id} className="flex items-start gap-3 rounded-lg border-2 border-muted/20 px-3 py-2 text-sm">
              <div className="flex-1">
                <span className="text-foreground">{log.description}</span>
                {log.calories != null && (
                  <span className="ml-2 font-mono text-xs tabular-nums text-muted">{log.calories} kcal</span>
                )}
              </div>
              <span className="text-xs text-muted">{log.date}</span>
              <button
                type="button"
                onClick={() => handleDelete(log.id)}
                aria-label="Öğünü sil"
                className="btn text-muted hover:text-negative"
              >
                <TrashIcon width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
