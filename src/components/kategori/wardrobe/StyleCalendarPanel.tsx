"use client";

import { useMemo, useState } from "react";
import { TrashIcon } from "@/components/icons";
import type { DbOutfit, DbOutfitWear } from "@hayat-borsasi/shared";
import { StyleCalendar } from "./StyleCalendar";

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Acloset'ten (piyasa araştırması) ilham alınan "Stil Takvimi" — mevcut
// outfit_wears verisini (madde 6'daki giyilme takibiyle AYNI tablo,
// sadece "bugün" değil HERHANGİ bir tarihe kayıt/görüntüleme) bir takvimde
// tarayan görünüm. Yeni bir tablo/insertOutfitWear değişikliği gerekmedi —
// fonksiyon zaten keyfi bir tarih alıyordu, sadece UI'sı yoktu.
export function StyleCalendarPanel({
  outfits,
  outfitWears,
  onLogWear,
  onDeleteWear,
}: {
  outfits: DbOutfit[];
  outfitWears: DbOutfitWear[];
  onLogWear: (outfitId: string, date: string) => Promise<void>;
  onDeleteWear: (wear: DbOutfitWear) => Promise<void>;
}) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [adding, setAdding] = useState(false);

  const daysWithWear = useMemo(() => new Set(outfitWears.map((w) => w.date)), [outfitWears]);
  const selectedIso = selected ? toIso(selected) : null;
  const selectedWears = selectedIso ? outfitWears.filter((w) => w.date === selectedIso) : [];
  const wornOutfitIds = new Set(selectedWears.map((w) => w.outfit_id));
  const availableOutfits = outfits.filter((o) => !wornOutfitIds.has(o.id));

  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5"
      style={{
          "--stil-accent": "#d4ff00",
          "--accent": "#d4ff00",
          "--accent-soft": "#d4ff0026",
          "--accent-foreground": "#141400",
        } as React.CSSProperties}
    >
      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-xs font-semibold" style={{ color: "var(--stil-accent)" }}>
          05
        </span>
        <h2 className="font-serif text-lg font-medium italic tracking-tight text-foreground">Stil Takvimi</h2>
      </div>

      {outfits.length === 0 ? (
        <p className="text-sm text-muted">Takvime kaydetmek için önce en az bir kombin oluştur.</p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <StyleCalendar month={month} onMonthChange={setMonth} selected={selected} onSelectDay={setSelected} daysWithWear={daysWithWear} />

          <div className="flex flex-1 flex-col gap-3">
            {!selected && <p className="text-xs text-muted">Bir gün seç, o gün ne giydiğini kaydet veya gör.</p>}

            {selected && (
              <>
                <p className="text-sm font-medium text-foreground">{selected.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>

                {selectedWears.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {selectedWears.map((wear) => {
                      const outfit = outfits.find((o) => o.id === wear.outfit_id);
                      if (!outfit) return null;
                      return (
                        <div key={wear.id} className="flex items-center justify-between gap-2 rounded-lg border-2 border-muted/20 bg-background-elevated px-3 py-2">
                          <span className="text-xs text-foreground">{outfit.name || "İsimsiz kombin"}</span>
                          <button type="button" onClick={() => onDeleteWear(wear)} aria-label="Kaydı sil" className="btn text-muted hover:text-negative">
                            <TrashIcon width={13} height={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {availableOutfits.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[11px] text-muted">Bir kombin ekle:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableOutfits.map((outfit) => (
                        <button
                          key={outfit.id}
                          type="button"
                          disabled={adding}
                          onClick={async () => {
                            setAdding(true);
                            await onLogWear(outfit.id, selectedIso!);
                            setAdding(false);
                          }}
                          className="btn rounded-full border-2 px-2.5 py-1 text-[11px] font-medium disabled:pointer-events-none disabled:opacity-50"
                          style={{ borderColor: "color-mix(in srgb, var(--stil-accent) 30%, transparent)", color: "var(--stil-accent)" }}
                        >
                          {outfit.name || "İsimsiz kombin"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
