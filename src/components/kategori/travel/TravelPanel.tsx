"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  fetchTravelVisits,
  toggleTravelVisit,
  updateTravelVisitDetails,
  turkeyProvinceRefCode,
  type DbTravelVisit,
} from "@hayat-borsasi/shared";
import { ArrowLeftIcon, GlobeIcon, TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { WorldMapView } from "./WorldMapView";

// TurkeyMapView'ın topojson'ı (~100KB) sadece kullanıcı gerçekten
// "Türkiye İllerini Gör"e tıklayınca indirilsin diye ayrı bir chunk'a
// bölündü — WorldMapView zaten (Bölüm A'dan kalma, dokunulmadı) statik
// import kullanıyor, ama /kategori/[slug] TÜM modül panellerini tek
// route'ta bundluyor (bkz. CLAUDE.md'deki bilinen mimari not), bu yüzden
// yeni eklenen ağır dosyalar için en azından tek tek dynamic import
// tercih edildi.
const TurkeyMapView = dynamic(
  () => import("./TurkeyMapView").then((m) => m.TurkeyMapView),
  { ssr: false, loading: () => <div className="flex h-64 items-center justify-center text-xs text-muted">Harita yükleniyor...</div> }
);

const TURKEY_REF_CODE = "TR";

type SelectedVisit = { level: "country" | "province"; refCode: string; name: string };

// been.app/Visited'tan ilham (piyasa araştırması, kod/tasarım kopyalanmadı)
// — "scratch map" dolgu efekti: bir ülkeye/ile tıklayınca ziyaret edildi/
// edilmedi olarak işaretleniyor (toggle), işaretli bölgeler bakır dolu
// render ediliyor. Bölüm A (Dünya haritası, Level 1) VE Bölüm B (Türkiye
// il drill-down, Level 2) tamamlandı — ilçe drill-down (Level 3), mekan
// oluşturma (Level 4), Seyahat Pasaportu kartı ve temalı bucket list'ler
// ayrı bölümler olarak eklenecek (bkz. CLAUDE.md, kullanıcı onaylı iş sırası).
export function TravelPanel({ categoryId }: { categoryId: string }) {
  const [visits, setVisits] = useState<DbTravelVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<"world" | "turkey">("world");
  const [selected, setSelected] = useState<SelectedVisit | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function load() {
    setLoadError(null);
    try {
      const supabase = createClient();
      const rows = await fetchTravelVisits(supabase, categoryId);
      setVisits(rows);
    } catch (err) {
      console.error("Seyahat verisi yüklenemedi:", err);
      setLoadError("Seyahat verisi yüklenemedi. (Migration uygulanmamış olabilir.)");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const countryVisits = useMemo(
    () => visits.filter((v) => v.level === "country"),
    [visits]
  );
  const provinceVisits = useMemo(
    () => visits.filter((v) => v.level === "province"),
    [visits]
  );
  const visitedRefCodes = useMemo(() => new Set(countryVisits.map((v) => v.ref_code)), [countryVisits]);
  const visitedPlateCodes = useMemo(
    () => new Set(provinceVisits.map((v) => Number(v.ref_code.replace("TR-", "")))),
    [provinceVisits]
  );
  const levelVisits = selected?.level === "province" ? provinceVisits : countryVisits;
  const selectedVisit = selected ? levelVisits.find((v) => v.ref_code === selected.refCode) ?? null : null;

  async function handleToggleCountry(refCode: string, name: string) {
    const existing = countryVisits.find((v) => v.ref_code === refCode) ?? null;
    setSelected({ level: "country", refCode, name });
    setNoteDraft(existing?.note ?? "");
    const supabase = createClient();
    try {
      await toggleTravelVisit(supabase, categoryId, "country", refCode, existing?.id ?? null);
      await load();
    } catch (err) {
      console.error("Ziyaret güncellenemedi:", err);
    }
  }

  async function handleToggleProvince(plateCode: number, name: string) {
    const refCode = turkeyProvinceRefCode(plateCode);
    const existing = provinceVisits.find((v) => v.ref_code === refCode) ?? null;
    setSelected({ level: "province", refCode, name });
    setNoteDraft(existing?.note ?? "");
    const supabase = createClient();
    try {
      await toggleTravelVisit(supabase, categoryId, "province", refCode, existing?.id ?? null);
      await load();
    } catch (err) {
      console.error("Ziyaret güncellenemedi:", err);
    }
  }

  async function handleRemoveVisit() {
    if (!selectedVisit || !selected) return;
    const supabase = createClient();
    try {
      await toggleTravelVisit(supabase, categoryId, selected.level, selectedVisit.ref_code, selectedVisit.id);
      setSelected(null);
      await load();
    } catch (err) {
      console.error("Ziyaret silinemedi:", err);
    }
  }

  function handleOpenTurkeyProvinces() {
    setSelected(null);
    setView("turkey");
  }

  function handleBackToWorld() {
    setSelected(null);
    setView("world");
  }

  async function handleSaveNote() {
    if (!selectedVisit) return;
    setSavingNote(true);
    const supabase = createClient();
    try {
      await updateTravelVisitDetails(supabase, selectedVisit.id, { note: noteDraft || null });
      await load();
    } catch (err) {
      console.error("Not kaydedilemedi:", err);
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
        <p className="text-sm text-muted">Yükleniyor...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
        <p className="text-sm text-muted">{loadError}</p>
      </div>
    );
  }

  const isTurkeySelected = selected?.level === "country" && selected.refCode === TURKEY_REF_CODE;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view === "turkey" && (
            <button
              type="button"
              onClick={handleBackToWorld}
              className="btn flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted hover:text-foreground"
            >
              <ArrowLeftIcon width={12} height={12} />
              Dünya
            </button>
          )}
          <GlobeIcon width={16} height={16} className="text-accent" />
          <div>
            <h2 className="text-sm font-medium text-foreground">{view === "world" ? "Dünya" : "Türkiye"}</h2>
            <p className="text-xs text-muted">
              {view === "world" ? "Bir ülkeye tıkla, gezdiysen işaretle." : "Bir ile tıkla, gezdiysen işaretle."}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
          {view === "world" ? `${countryVisits.length} ülke ziyaret edildi` : `${provinceVisits.length}/81 il ziyaret edildi`}
        </span>
      </div>

      {view === "world" ? (
        <WorldMapView visitedRefCodes={visitedRefCodes} onToggleCountry={handleToggleCountry} />
      ) : (
        <TurkeyMapView visitedPlateCodes={visitedPlateCodes} onToggleProvince={handleToggleProvince} />
      )}

      {selected && (
        <div className="flex flex-col gap-3 rounded-lg border-2 border-accent/25 bg-accent-soft/20 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{selected.name}</h3>
            <button type="button" onClick={() => setSelected(null)} className="btn text-xs text-muted hover:text-foreground">
              Kapat
            </button>
          </div>
          {selectedVisit ? (
            <>
              <p className="text-xs text-muted">
                Ziyaret tarihi: {selectedVisit.visited_at ?? "—"}
              </p>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={selected.level === "country" ? "Bu ülkeyle ilgili kısa bir not (opsiyonel)..." : "Bu ille ilgili kısa bir not (opsiyonel)..."}
                rows={2}
                className="w-full resize-none rounded-lg border-2 border-muted/25 bg-background-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="btn rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                >
                  Notu Kaydet
                </button>
                <button
                  type="button"
                  onClick={handleRemoveVisit}
                  className="btn flex items-center gap-1 rounded-md border border-negative/30 px-3 py-1.5 text-xs font-medium text-negative hover:bg-negative-soft"
                >
                  <TrashIcon width={12} height={12} />
                  Ziyareti Kaldır
                </button>
                {isTurkeySelected && (
                  <button
                    type="button"
                    onClick={handleOpenTurkeyProvinces}
                    className="btn ml-auto rounded-md border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft"
                  >
                    Türkiye İllerini Gör →
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted">İşaretlemek için tekrar tıkla.</p>
              {isTurkeySelected && (
                <button
                  type="button"
                  onClick={handleOpenTurkeyProvinces}
                  className="btn rounded-md border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft"
                >
                  Türkiye İllerini Gör →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
