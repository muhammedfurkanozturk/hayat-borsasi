"use client";

import { useMemo, useState } from "react";
import { GearIcon, TrashIcon, UtensilsIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import {
  parseDurationMinutes,
  RECIPE_COURSE_LABELS,
  RECIPE_DIET_LABELS,
  RECIPE_DIFFICULTY_LABELS,
  RECIPE_INSPIRATION_LABELS,
  type DbSavedRecipe,
  type RecipeCourse,
  type RecipeDiet,
  type RecipeDifficulty,
  type RecipeInspiration,
} from "@hayat-borsasi/shared";
import { RecipeCard } from "./RecipeCard";

type DurationBucket = "kisa" | "orta" | "uzun";
const DURATION_LABELS: Record<DurationBucket, string> = {
  kisa: "30 dk veya altı",
  orta: "1 saate kadar",
  uzun: "1 saatten fazla",
};

function durationBucket(recipe: DbSavedRecipe): DurationBucket | null {
  const prep = parseDurationMinutes(recipe.hazirlik_suresi);
  const cook = parseDurationMinutes(recipe.pisirme_suresi);
  if (prep == null && cook == null) return null;
  const total = (prep ?? 0) + (cook ?? 0);
  if (total <= 30) return "kisa";
  if (total <= 60) return "orta";
  return "uzun";
}

function FilterGroup<T extends string>({
  label,
  options,
  labels,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((value) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={`btn rounded-full border-2 px-2.5 py-1 text-[11px] font-medium ${
                active ? "border-[color:var(--nutrition-accent)]/50 bg-[color:var(--nutrition-accent)]/15 text-[color:var(--nutrition-accent)]" : "border-muted/25 text-muted hover:border-[color:var(--nutrition-accent)]/30"
              }`}
            >
              {labels[value]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 2026-08-27: "Bu tarifi kaydetmek ister misin?" onayından sonra biriken
// tarifler burada listeleniyor — Kaydedilen Yemekler galerisinin yanına,
// kendi ayrı bölümü olarak (yemekler ile tarifler farklı kavramlar,
// karıştırılmasın diye tek listeye eklenmedi).
//
// 2026-08-29 (KitchenAid'den ilham, piyasa araştırması): çok katmanlı
// filtreleme sistemi eklendi — zorluk/süre/öğün türü/ilham/diyet, hepsi
// çoklu seçim, üstte açılır bir filtre çubuğunda. Bu metadata henüz
// uygulanmamış bir migration'a bağlı olduğu için (bkz. supabase/recipes.ts)
// eski/etiketlenmemiş tarifler filtre gruplarında hiç görünmez ama listeden
// de düşmez (aktif filtre yoksa herkes görünür).
export function SavedRecipesList({
  recipes,
  onDelete,
}: {
  recipes: DbSavedRecipe[];
  onDelete: (recipe: DbSavedRecipe) => void;
}) {
  const [selected, setSelected] = useState<DbSavedRecipe | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [zorlukFilter, setZorlukFilter] = useState<RecipeDifficulty[]>([]);
  const [sureFilter, setSureFilter] = useState<DurationBucket[]>([]);
  const [ogunFilter, setOgunFilter] = useState<RecipeCourse[]>([]);
  const [ilhamFilter, setIlhamFilter] = useState<RecipeInspiration[]>([]);
  const [diyetFilter, setDiyetFilter] = useState<RecipeDiet[]>([]);

  function toggle<T>(list: T[], setList: (v: T[]) => void, value: T) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const activeFilterCount =
    zorlukFilter.length + sureFilter.length + ogunFilter.length + ilhamFilter.length + diyetFilter.length;

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (zorlukFilter.length > 0 && (!r.zorluk || !zorlukFilter.includes(r.zorluk))) return false;
      if (sureFilter.length > 0) {
        const bucket = durationBucket(r);
        if (!bucket || !sureFilter.includes(bucket)) return false;
      }
      if (ogunFilter.length > 0 && (!r.ogun_turu || !ogunFilter.includes(r.ogun_turu))) return false;
      if (ilhamFilter.length > 0 && (!r.ilham || !ilhamFilter.includes(r.ilham))) return false;
      if (diyetFilter.length > 0 && !(r.diyetler ?? []).some((d) => diyetFilter.includes(d))) return false;
      return true;
    });
  }, [recipes, zorlukFilter, sureFilter, ogunFilter, ilhamFilter, diyetFilter]);

  if (recipes.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">Tarif Listem</h2>
          <p className="text-xs text-muted">Kaydettiğin tarifler.</p>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`btn flex h-8 items-center gap-1.5 rounded-lg border-2 px-3 text-xs font-medium ${
            activeFilterCount > 0 ? "border-[color:var(--nutrition-accent)]/50 bg-[color:var(--nutrition-accent)]/15 text-[color:var(--nutrition-accent)]" : "border-muted/25 text-muted hover:text-foreground"
          }`}
        >
          <GearIcon width={13} height={13} />
          Filtrele{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      {filtersOpen && (
        <div className="flex flex-col gap-3 rounded-lg border-2 border-muted/15 bg-background-elevated/50 p-4">
          <FilterGroup
            label="Zorluk"
            options={["kolay", "orta", "zor"] as const}
            labels={RECIPE_DIFFICULTY_LABELS}
            selected={zorlukFilter}
            onToggle={(v) => toggle(zorlukFilter, setZorlukFilter, v)}
          />
          <FilterGroup
            label="Pişirme Süresi"
            options={["kisa", "orta", "uzun"] as const}
            labels={DURATION_LABELS}
            selected={sureFilter}
            onToggle={(v) => toggle(sureFilter, setSureFilter, v)}
          />
          <FilterGroup
            label="Öğün Türü"
            options={["kahvalti", "ana-yemek", "tatli", "corba", "ara-ogun", "icecek"] as const}
            labels={RECIPE_COURSE_LABELS}
            selected={ogunFilter}
            onToggle={(v) => toggle(ogunFilter, setOgunFilter, v)}
          />
          <FilterGroup
            label="Mutfak / İlham"
            options={["hizli-kolay", "ev-yemegi", "saglikli-hafif", "uluslararasi"] as const}
            labels={RECIPE_INSPIRATION_LABELS}
            selected={ilhamFilter}
            onToggle={(v) => toggle(ilhamFilter, setIlhamFilter, v)}
          />
          <FilterGroup
            label="Özel Diyet"
            options={["vegan", "vejetaryen", "laktozsuz", "glutensiz"] as const}
            labels={RECIPE_DIET_LABELS}
            selected={diyetFilter}
            onToggle={(v) => toggle(diyetFilter, setDiyetFilter, v)}
          />
        </div>
      )}

      {activeFilterCount > 0 && filtered.length === 0 && (
        <p className="text-xs text-muted">Bu filtrelere uyan kaydedilmiş tarif yok.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {filtered.map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            onClick={() => setSelected(recipe)}
            className="btn flex w-40 shrink-0 flex-col gap-1 rounded-lg border-2 border-muted/25 bg-background-elevated p-3 text-left hover:border-[color:var(--nutrition-accent)]/40"
          >
            <UtensilsIcon width={16} height={16} className="text-[color:var(--nutrition-accent)]" />
            <span className="line-clamp-2 text-sm font-medium text-foreground">{recipe.tarif_adi}</span>
            {recipe.hazirlik_suresi && <span className="text-xs text-muted">{recipe.hazirlik_suresi}</span>}
          </button>
        ))}
      </div>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        panelClassName="flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-lg border border-border bg-background-elevated p-5"
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Kaydedilen Tarif</span>
              <button
                type="button"
                onClick={() => {
                  onDelete(selected);
                  setSelected(null);
                }}
                aria-label="Tarifi sil"
                className="btn shrink-0 text-muted hover:text-negative"
              >
                <TrashIcon width={16} height={16} />
              </button>
            </div>
            <RecipeCard
              recipe={selected}
              onCourseClick={(course) => {
                setOgunFilter((prev) => (prev.includes(course) ? prev : [...prev, course]));
                setFiltersOpen(true);
                setSelected(null);
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
