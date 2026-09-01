"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckMark } from "@/components/CheckMark";
import { ClockIcon, LightbulbIcon, ShareIcon, PrinterIcon, UsersIcon, UtensilsIcon } from "@/components/icons";
import {
  parseDurationMinutes,
  RECIPE_COURSE_LABELS,
  RECIPE_DIET_LABELS,
  RECIPE_DIFFICULTY_LABELS,
  RECIPE_INSPIRATION_LABELS,
  type Recipe,
  type RecipeCourse,
  type RecipeIngredient,
} from "@hayat-borsasi/shared";

// KitchenAid'deki (piyasa araştırması) malzeme alt gruplarını (örn. "Hamur"
// + "Sos") destekliyor — grup etiketlenmemiş basit tariflerde tek liste
// olarak (eskisi gibi) kalıyor, geriye dönük uyumlu.
function groupIngredients(items: RecipeIngredient[]): { grup: string | null; items: RecipeIngredient[] }[] {
  if (!items.some((i) => i.grup)) return [{ grup: null, items }];
  const order: string[] = [];
  const byGroup = new Map<string, RecipeIngredient[]>();
  const ungrouped: RecipeIngredient[] = [];
  for (const item of items) {
    if (item.grup) {
      if (!byGroup.has(item.grup)) {
        byGroup.set(item.grup, []);
        order.push(item.grup);
      }
      byGroup.get(item.grup)!.push(item);
    } else {
      ungrouped.push(item);
    }
  }
  const groups = order.map((grup) => ({ grup, items: byGroup.get(grup)! }));
  return ungrouped.length > 0 ? [{ grup: null, items: ungrouped }, ...groups] : groups;
}

// 2026-08-27: Tarif önerisi düz yazı yerine yapılandırılmış (JSON) geliyor
// artık — bkz. packages/shared/src/recipe.ts + src/lib/ai/recipe-suggestion.ts
// (AI Rapor'daki StructuredReportView deseninin tarif sürümü). Malzemeler
// ve adımlar işaretlenebilir (elindekini/yaptığını takip etmek için) — bu
// işaretler hiçbir yere kaydedilmiyor, sadece bu görünümün ömrü boyunca
// yerel state'te tutuluyor.
//
// 2026-08-29 (KitchenAid'den ilham, piyasa araştırması): zenginleştirilmiş
// bilgi bandı (toplam süre, zorluk/öğün türü/ilham/diyet rozetleri),
// malzeme grupları, kalın miktar vurgusu, varyasyon önerisi kutusu,
// print/share butonları ve uzun tariflerde hızlı-git menüsü eklendi.
// `onCourseClick` verilirse (SavedRecipesList'ten) öğün türü rozeti
// tıklanabilir hale gelip o türe filtreliyor — RecipeSuggestion'daki
// (ephemeral) kullanımda bu prop verilmiyor, rozet düz kalıyor.
export function RecipeCard({ recipe, onCourseClick }: { recipe: Recipe; onCourseClick?: (course: RecipeCourse) => void }) {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [copyConfirmed, setCopyConfirmed] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const ingredientsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  function toggle(set: Set<number>, setSet: (s: Set<number>) => void, index: number) {
    const next = new Set(set);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSet(next);
  }

  const totalMinutes = (() => {
    const prep = parseDurationMinutes(recipe.hazirlik_suresi);
    const cook = parseDurationMinutes(recipe.pisirme_suresi);
    if (prep == null && cook == null) return null;
    return (prep ?? 0) + (cook ?? 0);
  })();

  const isLong = recipe.malzemeler.length + recipe.adimlar.length > 8;
  const ingredientGroups = groupIngredients(recipe.malzemeler);

  async function handleShare() {
    const text = [
      recipe.tarif_adi,
      "",
      "Malzemeler:",
      ...recipe.malzemeler.map((m) => `- ${m.miktar ? `${m.miktar} ` : ""}${m.ad}`),
      "",
      "Yapılış:",
      ...recipe.adimlar.map((s, i) => `${i + 1}. ${s}`),
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.tarif_adi, text });
      } catch {
        // Kullanıcı paylaşım panelini kapattıysa (AbortError) sessizce geç.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyConfirmed(true);
      setTimeout(() => setCopyConfirmed(false), 2000);
    } catch {
      // Panoya erişim izni yoksa sessizce geç — kritik bir akış değil.
    }
  }

  return (
    <div className="printable-recipe flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold text-foreground">{recipe.tarif_adi}</p>
          <div className="flex shrink-0 gap-1 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              aria-label="Yazdır"
              className="btn flex h-8 w-8 items-center justify-center rounded-lg border-2 border-muted/25 text-muted hover:text-foreground"
            >
              <PrinterIcon width={14} height={14} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Paylaş"
              className="btn flex h-8 w-8 items-center justify-center rounded-lg border-2 border-muted/25 text-muted hover:text-foreground"
            >
              <ShareIcon width={14} height={14} />
            </button>
          </div>
        </div>

        {copyConfirmed && <p className="text-xs text-positive">Panoya kopyalandı.</p>}

        <div className="flex flex-wrap gap-2">
          {recipe.hazirlik_suresi && (
            <span className="flex items-center gap-1.5 rounded-full border border-border-soft bg-background-elevated px-2.5 py-1 text-xs text-muted">
              <ClockIcon width={12} height={12} />
              Hazırlık: {recipe.hazirlik_suresi}
            </span>
          )}
          {recipe.pisirme_suresi && (
            <span className="flex items-center gap-1.5 rounded-full border border-border-soft bg-background-elevated px-2.5 py-1 text-xs text-muted">
              <UtensilsIcon width={12} height={12} />
              Pişirme: {recipe.pisirme_suresi}
            </span>
          )}
          {totalMinutes != null && (
            <span className="flex items-center gap-1.5 rounded-full border border-[color:var(--nutrition-accent)]/30 bg-[color:var(--nutrition-accent)]/15 px-2.5 py-1 text-xs font-medium text-[color:var(--nutrition-accent)]">
              Toplam: ~{totalMinutes} dk
            </span>
          )}
          {recipe.porsiyon && (
            <span className="flex items-center gap-1.5 rounded-full border border-border-soft bg-background-elevated px-2.5 py-1 text-xs text-muted">
              <UsersIcon width={12} height={12} />
              {recipe.porsiyon}
            </span>
          )}
        </div>

        {(recipe.zorluk || recipe.ogun_turu || recipe.ilham || (recipe.diyetler && recipe.diyetler.length > 0)) && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.zorluk && (
              <span className="rounded-full bg-muted/10 px-2 py-0.5 text-[11px] text-muted">{RECIPE_DIFFICULTY_LABELS[recipe.zorluk]}</span>
            )}
            {recipe.ogun_turu &&
              (onCourseClick ? (
                <button
                  type="button"
                  onClick={() => onCourseClick(recipe.ogun_turu!)}
                  className="btn rounded-full bg-[color:var(--nutrition-accent)]/15 px-2 py-0.5 text-[11px] font-medium text-[color:var(--nutrition-accent)] hover:bg-[color:var(--nutrition-accent)]/25"
                >
                  {RECIPE_COURSE_LABELS[recipe.ogun_turu]}
                </button>
              ) : (
                <span className="rounded-full bg-[color:var(--nutrition-accent)]/15 px-2 py-0.5 text-[11px] font-medium text-[color:var(--nutrition-accent)]">
                  {RECIPE_COURSE_LABELS[recipe.ogun_turu]}
                </span>
              ))}
            {recipe.ilham && <span className="rounded-full bg-muted/10 px-2 py-0.5 text-[11px] text-muted">{RECIPE_INSPIRATION_LABELS[recipe.ilham]}</span>}
            {recipe.diyetler?.map((d) => (
              <span key={d} className="rounded-full bg-positive-soft px-2 py-0.5 text-[11px] text-positive">
                {RECIPE_DIET_LABELS[d]}
              </span>
            ))}
          </div>
        )}
      </div>

      {isLong && (
        <div className="flex gap-3 text-xs text-[color:var(--nutrition-accent)] print:hidden">
          <button type="button" onClick={() => ingredientsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="btn hover:underline">
            ↓ Malzemeler
          </button>
          <button type="button" onClick={() => stepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="btn hover:underline">
            ↓ Yapılış Adımları
          </button>
        </div>
      )}

      {recipe.malzemeler.length > 0 && (
        <div ref={ingredientsRef} className="flex flex-col gap-3 rounded-lg border-2 border-muted/20 bg-background-elevated p-3.5">
          {ingredientGroups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-1.5">
              {group.grup && <span className="text-xs font-semibold text-[color:var(--nutrition-accent)]">{group.grup}</span>}
              {!group.grup && ingredientGroups.length === 1 && (
                <span className="text-xs font-medium uppercase tracking-wider text-muted">Malzemeler</span>
              )}
              <ul className="flex flex-col gap-1.5">
                {group.items.map((m) => {
                  const globalIndex = recipe.malzemeler.indexOf(m);
                  return (
                    <li key={globalIndex}>
                      <button
                        type="button"
                        onClick={() => toggle(checkedIngredients, setCheckedIngredients, globalIndex)}
                        className="btn group flex w-full items-center gap-2.5 rounded-md py-1 text-left"
                      >
                        <CheckMark checked={checkedIngredients.has(globalIndex)} size={20} />
                        <span
                          className={`flex-1 text-sm ${checkedIngredients.has(globalIndex) ? "text-muted line-through decoration-muted" : "text-foreground"}`}
                        >
                          {m.ad}
                        </span>
                        {m.miktar && <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{m.miktar}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {recipe.adimlar.length > 0 && (
        <div ref={stepsRef} className="flex flex-col gap-2 rounded-lg border-2 border-muted/20 bg-background-elevated p-3.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Yapılış Adımları</span>
          <ol className="flex flex-col gap-2">
            {recipe.adimlar.map((step, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggle(checkedSteps, setCheckedSteps, i)}
                  className="btn group flex w-full items-start gap-2.5 rounded-md py-1 text-left"
                >
                  <span className="mt-0.5 shrink-0">
                    <CheckMark checked={checkedSteps.has(i)} size={20} />
                  </span>
                  <span
                    className={`flex-1 text-sm ${checkedSteps.has(i) ? "text-muted line-through decoration-muted" : "text-foreground"}`}
                  >
                    <span className="font-mono text-xs text-muted">{i + 1}.</span> {step}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {recipe.sunum_onerisi && (
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start gap-2.5 rounded-lg border-2 border-pro/40 bg-pro-soft p-3"
        >
          <LightbulbIcon width={15} height={15} className="mt-0.5 shrink-0 text-pro" />
          <p className="flex-1 text-sm text-foreground">
            <span className="font-medium text-pro">İpucu: </span>
            {recipe.sunum_onerisi}
          </p>
        </motion.div>
      )}

      {/* KitchenAid'deki "Recipe Note" fikri — Sunum Önerisi'nden (amber/pro
          ton) BİLİNÇLİ olarak farklı, nötr bir kutu. Site genelinde tek
          vurgu rengi kuralı gereği ikinci bir renk (mavi vb.) eklemek yerine
          rengin YOKLUĞUYla ayrışıyor. */}
      {recipe.varyasyon_onerisi && (
        <div className="flex items-start gap-2.5 rounded-lg border-2 border-muted/25 bg-background-elevated p-3">
          <UtensilsIcon width={15} height={15} className="mt-0.5 shrink-0 text-muted" />
          <p className="flex-1 text-sm text-foreground">
            <span className="font-medium text-muted">Varyasyon: </span>
            {recipe.varyasyon_onerisi}
          </p>
        </div>
      )}
    </div>
  );
}
