"use client";

import { useMemo } from "react";
import { geoMercator } from "d3-geo";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { getCountryProvinces, provinceTurkishName, type ProvinceProperties } from "@/lib/travel/world-provinces";

interface GeoFeature {
  rsmKey: string;
  properties: ProvinceProperties;
}

// ComposableMap'in varsayılan viewBox'ı (bkz. TurkeyMapView.tsx'in de
// dayandığı @types/react-simple-maps varsayılanları) — burada da elle
// veriliyor çünkü fitExtent hesabı bu boyutlara göre yapılıyor.
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;
const VIEW_MARGIN = 24;

// Türkiye'nin elle kalibre edilmiş TurkeyMapView.tsx'inin GENEL (herhangi
// bir ülkeye uygulanabilen) karşılığı — bkz. world-provinces.ts'in
// başındaki not. Projeksiyon TurkeyMapView'daki gibi SABİT bir merkez/
// ölçek DEĞİL — seçilen ülkenin GERÇEK sınırlarına her seferinde otomatik
// uyuyor (190+ ülke için elle kalibrasyon yapmak mümkün değil).
//
// **Bulunan ve düzeltilen gerçek bir hata:** İlk versiyon ComposableMap'e
// `projection` prop'una DOĞRUDAN bir `geoMercator().fitExtent(...)`
// PROJEKSİYON NESNESİ döndüren fonksiyon veriyordu — bu, tarayıcıda
// "projectionStream is not a function" ile çöktü. Kök neden: proje kökünde
// `d3-geo@3` var ama `react-simple-maps` kendi `node_modules` içinde
// `d3-geo@2` bundluyor (react-simple-maps'in kendisi eski sürüme göre
// yazılmış) — bu iki farklı d3-geo'nun projeksiyon NESNELERİ (obje olarak)
// birbiriyle uyumsuz, react-simple-maps kendi (v2) `geoPath()`'ine v3'ten
// gelen bir nesne verilince patlıyor. Düzeltme: fitExtent'in matematiğini
// (doğru ölçek+merkez hesabı için) proje kökünün d3-geo'suyla hesaplayıp
// SONUCU SADECE SAYI olarak (`scale` + `.invert()` ile bulunan [lon,lat]
// merkezi) `projectionConfig`'e veriyoruz — TurkeyMapView'ın zaten
// kullandığı `projection="geoMercator"` (string) + `projectionConfig`
// deseniyle AYNI, bu sayede react-simple-maps projeksiyon nesnesini HER
// ZAMAN kendi (v2) d3-geo'suyla kuruyor, hiçbir obje sınırı geçmiyor.
function computeMercatorFit(geography: ReturnType<typeof getCountryProvinces>) {
  const proj = geoMercator().fitExtent(
    [
      [VIEW_MARGIN, VIEW_MARGIN],
      [VIEW_WIDTH - VIEW_MARGIN, VIEW_HEIGHT - VIEW_MARGIN],
    ],
    geography
  );
  const center = proj.invert?.([VIEW_WIDTH / 2, VIEW_HEIGHT / 2]) ?? [0, 0];
  return { center: center as [number, number], scale: proj.scale() };
}

export function CountryProvinceMapView({
  countryIso2,
  visitedRefCodes,
  onToggleProvince,
}: {
  countryIso2: string;
  visitedRefCodes: Set<string>;
  onToggleProvince: (refCode: string, name: string) => void;
}) {
  const geography = useMemo(() => getCountryProvinces(countryIso2), [countryIso2]);
  const fit = useMemo(() => (geography.features.length > 0 ? computeMercatorFit(geography) : null), [geography]);

  if (geography.features.length === 0 || !fit) {
    return <p className="text-xs text-muted">Bu ülke için bölge verisi bulunamadı.</p>;
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-background-elevated">
      <ComposableMap
        width={VIEW_WIDTH}
        height={VIEW_HEIGHT}
        projection="geoMercator"
        projectionConfig={{ center: fit.center, scale: fit.scale }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geography}>
          {({ geographies }: { geographies: GeoFeature[] }) =>
            geographies.map((geo) => {
              const refCode = geo.properties.iso_3166_2;
              const name = provinceTurkishName(geo.properties);
              const visited = visitedRefCodes.has(refCode);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onToggleProvince(refCode, name)}
                  style={{
                    default: {
                      fill: visited ? "var(--accent)" : "var(--muted)",
                      fillOpacity: visited ? 0.85 : 0.18,
                      stroke: "var(--border)",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: "pointer",
                    },
                    hover: {
                      fill: visited ? "var(--accent)" : "var(--muted)",
                      fillOpacity: visited ? 1 : 0.35,
                      stroke: "var(--border)",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: {
                      fill: "var(--accent)",
                      fillOpacity: 1,
                      stroke: "var(--border)",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
