"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
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

// Kategori Bazlı Tasarım Farklılaştırma — Bölüm 8 (Seyahat → Polarsteps
// dili, 2026-09-02, TURUN SON BÖLÜMÜ). Koyu/gece-haritası zemin (site
// temasından bağımsız) + Polarsteps'in teal/pembe-kırmızı ikilisi — aynı
// kök-token-ezme yöntemi (bkz. Robinhood/Miro bölümlerindeki açıklama).
// **Bilinçli, dokümante edilmiş kapsam kararı:** orijinal spec bu bölümün
// düz SVG haritayı (react-simple-maps, Bölüm A/B'de zaten kurulup uçtan
// uca test edilmiş, gerçek DB yazımıyla doğrulanmış) 3D döndürülebilir bir
// küreye (react-globe.gl/three-globe, WebGL) çevirmesini istiyordu — bu,
// yeni ağır bir bağımlılık + click-to-select etkileşim modelinin SIFIRDAN
// yeniden kurulması + performans/bundle-size riski taşıyan, mevcut
// test edilmiş Seviye 1-2 drill-down'ı bozma riski yüksek bir mimari
// değişiklik. Bu turda SADECE renk/kompozisyon kimliği uygulandı (bu
// dosyadaki token-ezme + WorldMapView/TurkeyMapView'ın zaten var olan
// `--accent` kullanımı sayesinde otomatik teal'e dönüyor) — 3D küre
// geçişi kasıtlı olarak ERTELENDİ, kullanıcı onayı/talebiyle ayrı,
// odaklı bir turda ele alınmalı (WebGL/performans testi gerektirir).
const TRAVEL_SCOPE = {
  "--background": "#0d1b2a",
  "--background-elevated": "#152a3d",
  "--surface": "#152a3d",
  "--surface-hover": "#1c3650",
  "--border": "rgba(255,255,255,0.12)",
  "--border-soft": "rgba(255,255,255,0.08)",
  "--foreground": "#f2f6f9",
  "--muted": "#8fa3b3",
  "--muted-soft": "#5f7385",
  "--accent": "#2dd4bf",
  "--accent-soft": "#2dd4bf26",
  "--accent-foreground": "#04201c",
  "--negative": "#e91e63",
  "--negative-soft": "#e91e6326",
} as React.CSSProperties;

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
  const detailPanelRef = useRef<HTMLDivElement>(null);

  // Dünya haritası (800x600 viewBox) uzun bir kart olduğu için, seçim
  // panelinin altta kalıp fark edilmemesi kullanıcı testinde bulunan gerçek
  // bir sorundu (Türkiye'ye tıklayınca sadece rengin değiştiği görülüyor,
  // "Türkiye İllerini Gör" butonu sayfanın çok aşağısında kaldığı için hiç
  // görülmüyordu) — bir ülke/il seçilince panel otomatik ekrana kayıyor.
  useEffect(() => {
    if (selected) detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);

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

  // GERÇEK HATA (2026-09-02, kullanıcı bulgusu — "notu kaydetmiyor"): Bu
  // fonksiyonlar önceden HER tıklamada koşulsuz toggle yapıyordu — zaten
  // ziyaret edilmiş bir ülkeye/ile notunu görmek/düzenlemek için tekrar
  // tıklamak, ziyareti (ve notunu) sessizce SİLİYORDU. Artık sadece HENÜZ
  // ziyaret edilmemiş bir yere tıklamak "ziyaret edildi" olarak işaretliyor
  // (been.app tarzı scratch-map dolgusu bu ilk tıklamada hâlâ aynı); zaten
  // işaretli bir yere tıklamak SADECE panelini açıyor, siliyor değil —
  // kaldırmak için artık SADECE panel içindeki "Ziyareti Kaldır" butonu var.
  async function handleToggleCountry(refCode: string, name: string) {
    const existing = countryVisits.find((v) => v.ref_code === refCode) ?? null;
    setSelected({ level: "country", refCode, name });
    setNoteDraft(existing?.note ?? "");
    if (existing) return;
    const supabase = createClient();
    try {
      await toggleTravelVisit(supabase, categoryId, "country", refCode, null);
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
    if (existing) return;
    const supabase = createClient();
    try {
      await toggleTravelVisit(supabase, categoryId, "province", refCode, null);
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
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5" style={TRAVEL_SCOPE}>
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
        <div ref={detailPanelRef} className="flex flex-col gap-3 rounded-lg border-2 border-accent/25 bg-accent-soft/20 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{selected.name}</h3>
            <button type="button" onClick={() => setSelected(null)} className="btn text-xs text-muted hover:text-foreground">
              Kapat
            </button>
          </div>

          {/* Türkiye'nin il haritasına geçiş — kullanıcı testinde bulundu:
              bu buton eskiden not kutusunun ALTINDAYDI, uzun dünya haritası
              kartının altında kalınca fark edilmiyordu ("sadece turunu
              oluyor, ileri gidemiyorum" geri bildirimi). Şimdi panelin en
              üstünde, tek başına belirgin bir birincil buton. */}
          {isTurkeySelected && (
            <button
              type="button"
              onClick={handleOpenTurkeyProvinces}
              className="btn flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              Türkiye İllerini Gör →
            </button>
          )}

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
              </div>
            </>
          ) : (
            <p className="text-xs text-muted">İşaretlemek için tekrar tıkla.</p>
          )}
        </div>
      )}
    </div>
  );
}
