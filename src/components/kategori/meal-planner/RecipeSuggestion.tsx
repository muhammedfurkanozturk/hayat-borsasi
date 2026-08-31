"use client";

import { useState } from "react";
import { insertSavedRecipe, type Recipe } from "@hayat-borsasi/shared";
import { ClockIcon, CompassIcon, LeafIcon, LightbulbIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { RecipeCard } from "./RecipeCard";

type RecipeMode = "saved" | "surprise" | "ingredients";

// 2026-08-28 (kullanıcı isteği): "Sürpriz Beni" → "Keşfet" olarak
// yeniden adlandırıldı, 3 mod artık küçük bir sekme yerine büyük, ayrı
// seçilebilir "kutu" kartları olarak sunuluyor (bkz. render).
const MODE_TILES: { value: RecipeMode; label: string; description: string; icon: typeof ClockIcon }[] = [
  { value: "saved", label: "Kaydettiklerimden Öner", description: "Son yediklerine göre", icon: ClockIcon },
  { value: "surprise", label: "Keşfet", description: "Dünya mutfaklarından sürpriz", icon: CompassIcon },
  { value: "ingredients", label: "Malzemelerimden Öner", description: "Elindeki malzemelerden", icon: LeafIcon },
];

// FoodLens + OpenNutriTracker'daki (piyasa araştırması) tarif önerisi fikri.
// 2026-08-27: sonuç artık yapılandırılmış (bkz. RecipeCard.tsx) + kaydetme
// akışı eklendi (Evet/Hayır → onaylanırsa saved_recipes'e yazılıyor).
// 2026-08-28 (Bölüm 5): tek moddan ("Kaydettiklerimden Öner") üç moda
// çıkarıldı — "Sürpriz Beni" (geçmişten bağımsız) ve "Malzemelerimden Öner"
// (elle girilen malzeme listesi) eklendi, sonuç formatı/kaydetme akışı aynı.
// 2026-08-28: kullanıcı isteğiyle, küçük sekme+buton yerine 3 büyük seçilebilir
// kart + ortada tek "Tarif Öner" butonu olacak şekilde yeniden tasarlandı —
// diğer büyütülmüş/ortalanmış kartlarla (Su Takibi, Kalori Takibi) aynı ölçek.
export function RecipeSuggestion({
  categoryId,
  recentDescriptions,
  onSaved,
}: {
  categoryId: string;
  recentDescriptions: string[];
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<RecipeMode>("saved");
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Recipe | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");

  async function handleSuggest() {
    if (mode === "ingredients" && !ingredients.trim()) return;
    setLoading(true);
    setError(null);
    setSaveState("idle");
    try {
      const res = await fetch("/api/recipe-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, recentMealDescriptions: recentDescriptions, ingredients }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Tarif önerisi alınamadı.");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tarif önerisi alınamadı.");
    }
    setLoading(false);
  }

  async function handleSaveYes() {
    if (!result) return;
    setSaveState("saving");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await insertSavedRecipe(supabase, user.id, categoryId, result);
        onSaved();
      }
      // Kaydedilen tarif zaten aşağıdaki Tarif Listem'de görünecek — kartı
      // burada açık bırakmak yerine kapatıp başlangıç durumuna dönüyoruz.
      setResult(null);
      setSaveState("idle");
    } catch (err) {
      // saved_recipes migration henüz uygulanmamış olabilir.
      console.error("Tarif kaydedilemedi (migration uygulanmamış olabilir):", err);
      setError("Tarif kaydedilemedi.");
      setSaveState("idle");
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border-2 border-accent/25 bg-surface shadow-card p-6">
      <div className="text-center">
        <h2 className="text-sm font-medium text-foreground">Tarif Önerisi</h2>
        <p className="text-xs text-muted">Nasıl bir tarif istersin?</p>
      </div>

      {!result && (
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {MODE_TILES.map((tile) => {
              const Icon = tile.icon;
              const active = mode === tile.value;
              return (
                <button
                  key={tile.value}
                  type="button"
                  onClick={() => setMode(tile.value)}
                  className={`btn flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center ${
                    active
                      ? "border-accent/60 bg-accent-soft text-accent"
                      : "border-muted/25 text-muted hover:border-accent/30 hover:text-foreground"
                  }`}
                >
                  <Icon width={22} height={22} />
                  <span className="text-xs font-semibold">{tile.label}</span>
                  <span className="text-[11px] text-muted">{tile.description}</span>
                </button>
              );
            })}
          </div>

          {mode === "ingredients" ? (
            <div className="flex w-full max-w-sm flex-col items-center gap-2">
              <p className="text-xs text-muted">Hangi malzemelerden bir tarif istersin?</p>
              {/* Kullanıcının referans aldığı "chat input" tarzı — pill
                  şeklinde, gönder butonu input'un içine gömülü. Sitenin
                  kendi token/köşe sistemine çevrildi (rounded-full burada
                  bilinçli bir istisna — genel rounded-lg tavanı yerine bu
                  spesifik "sohbet kutusu" hissi için). */}
              <div className="flex w-full items-center gap-1.5 rounded-full border-2 border-accent/30 bg-background-elevated py-1.5 pl-5 pr-1.5 shadow-md focus-within:border-accent/60">
                <input
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && ingredients.trim() && !loading) {
                      e.preventDefault();
                      handleSuggest();
                    }
                  }}
                  placeholder="örn. yumurta, ıspanak, peynir"
                  className="h-9 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={loading || !ingredients.trim()}
                  aria-label="Tarif Öner"
                  className="btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                >
                  <LightbulbIcon width={15} height={15} />
                </button>
              </div>
              {loading && <p className="text-xs text-muted">Düşünüyor...</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loading}
              className="btn flex h-11 w-fit shrink-0 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              <LightbulbIcon width={15} height={15} />
              {loading ? "Düşünüyor..." : "Tarif Öner"}
            </button>
          )}
        </div>
      )}

      {error && <p className="text-center text-xs text-negative">{error}</p>}

      {result && (
        <div className="flex flex-col gap-4 rounded-lg border-2 border-accent/40 bg-accent-soft/30 p-4">
          <RecipeCard recipe={result} />

          <div className="flex flex-wrap items-center gap-2 border-t border-accent/20 pt-3">
            <p className="w-full text-sm text-foreground">Bu tarifi kaydetmek ister misin?</p>
            <button
              type="button"
              onClick={handleSaveYes}
              disabled={saveState === "saving"}
              className="btn h-9 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {saveState === "saving" ? "Kaydediliyor..." : "Evet, kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              disabled={saveState === "saving"}
              className="btn h-9 rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Hayır, kaydetme
            </button>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={saveState === "saving" || loading}
              className="btn h-9 rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Düşünüyor..." : "Başka tarif öner"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
