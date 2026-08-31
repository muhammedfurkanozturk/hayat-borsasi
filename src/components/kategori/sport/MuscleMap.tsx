"use client";

import { useEffect, useRef } from "react";
import { BodyChart, ViewSide, filterMuscles, type BodyState } from "body-muscles";
import type { MuscleGroup } from "@hayat-borsasi/shared";
import { BODY_MUSCLE_ID_TO_GROUP, MUSCLE_GROUP_TO_BODY_MUSCLE_IDS } from "./muscle-map-bridge";

// EK GÖREV 1 (2026-09-01) — el-çizimi/stilize SVG figürü kaldırılıp
// `body-muscles` (npm, sıfır bağımlılık, 70+ granüler kas bölgesi,
// Apache-2.0) kütüphanesine geçildi. Kütüphane React bileşeni DEĞİL,
// framework-agnostik imperatif bir sınıf (`new BodyChart(container,
// options)`) — bu yüzden standart useRef+useEffect sarmalayıcı deseni
// kullanılıyor (kütüphanenin kendi README'sindeki React örneğiyle birebir
// aynı desen).
//
// Renk teması hakkında ÖNEMLİ bir not: kütüphane, ilk bakışta sanılanın
// aksine bir CSS/tema özelleştirme API'si SUNMUYOR — kas rengi kütüphanenin
// içinde SABİT bir sarı→turuncu→kırmızı yoğunluk paletiyle (`fill`
// attribute'una doğrudan `setAttribute` ile) çiziliyor, dışarıdan
// erişilebilir bir CSS custom property yok (paket indirilip kaynak kodu
// incelenerek doğrulandı). Bunun yerine her `chart.update()` sonrası,
// public/stabil bir bağlantı noktası olan `filterMuscles(view)` (isim→id
// eşlemesi) + her `<path>` içindeki erişilebilirlik `<title>` elemanının
// metni üzerinden kendi renklerimizi (`--accent`/`--muted`, sitenin "tek
// vurgu rengi" kuralına uygun) path'lere DOĞRUDAN inline style ile
// uyguluyoruz — kütüphanenin private iç yapısına (DOM sırası, private alan
// adları) değil, iki PUBLIC sözleşmeye (dışa aktarılan filterMuscles +
// herkese açık erişilebilirlik metni) dayanıyor.
export function MuscleMap({
  view,
  volumeByMuscle,
  selectedMuscle,
  onSelectMuscle,
}: {
  view: "front" | "back";
  volumeByMuscle: Partial<Record<MuscleGroup, number>>;
  selectedMuscle: MuscleGroup | null;
  onSelectMuscle: (muscle: MuscleGroup) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);
  const onSelectRef = useRef(onSelectMuscle);

  useEffect(() => {
    onSelectRef.current = onSelectMuscle;
  }, [onSelectMuscle]);

  function buildBodyState(): BodyState {
    const state: BodyState = {};
    for (const [group, ids] of Object.entries(MUSCLE_GROUP_TO_BODY_MUSCLE_IDS)) {
      const intensity = volumeByMuscle[group as MuscleGroup] ?? 0;
      const selected = selectedMuscle === group;
      if (intensity <= 0 && !selected) continue;
      for (const id of ids) {
        state[id] = { intensity: Math.round(intensity * 10), selected };
      }
    }
    return state;
  }

  function applyThemeColors(sideView: ViewSide) {
    const container = containerRef.current;
    if (!container) return;
    const muscleDefs = filterMuscles(sideView);
    const nameToId = new Map(muscleDefs.map((m) => [m.name, m.id]));
    const bodyState = buildBodyState();

    container.querySelectorAll<SVGPathElement>("path.body-chart-muscle").forEach((path) => {
      const name = path.querySelector("title")?.textContent ?? "";
      const id = nameToId.get(name);
      if (!id) return;
      const group = BODY_MUSCLE_ID_TO_GROUP[id];
      const partState = bodyState[id];
      const active = !!partState && (partState.intensity > 0 || partState.selected);
      const isSelected = group != null && selectedMuscle === group;
      path.style.fill = active ? "var(--accent)" : "var(--muted)";
      path.style.fillOpacity = active ? String(0.25 + (partState?.intensity ?? 0) * 0.065) : "0.18";
      path.style.stroke = isSelected ? "var(--accent)" : "transparent";
      path.style.strokeWidth = isSelected ? "0.6" : "0";
      path.style.filter = "none";
    });
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const sideView = view === "front" ? ViewSide.FRONT : ViewSide.BACK;
    chartRef.current = new BodyChart(containerRef.current, {
      view: sideView,
      bodyState: buildBodyState(),
      ariaLabel: `Kas haritası, ${view === "front" ? "ön" : "arka"} görünüm`,
      enableTransitions: true,
      onMuscleClick: (id) => {
        const group = BODY_MUSCLE_ID_TO_GROUP[id];
        if (group) onSelectRef.current(group);
      },
    });
    requestAnimationFrame(() => applyThemeColors(sideView));
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    if (!chartRef.current) return;
    const sideView = view === "front" ? ViewSide.FRONT : ViewSide.BACK;
    chartRef.current.update({ bodyState: buildBodyState() });
    requestAnimationFrame(() => applyThemeColors(sideView));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeByMuscle, selectedMuscle]);

  return <div ref={containerRef} className="h-full w-full" />;
}
