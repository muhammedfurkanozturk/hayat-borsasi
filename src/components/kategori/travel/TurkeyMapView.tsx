"use client";

import { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import turkeyTopology from "@/lib/travel/turkey-provinces-topo.json";
import { turkeyGeoNamePlateCode } from "@/lib/travel/turkey-geo-match";
import { TURKEY_PROVINCES } from "@hayat-borsasi/shared";

interface GeoFeature {
  rsmKey: string;
  properties: { Name: string };
}

// borders-of-turkey (CC0) lvl1-TR.geojson, mapshaper ile %4'e sadeleştirilip
// topojson'a çevrildi (bkz. src/lib/travel/turkey-provinces-topo.json'ın
// üstündeki not ve CLAUDE.md). Türkiye'nin coğrafi merkezine göre
// kalibre edilmiş sabit bir Mercator projeksiyonu — WorldMapView'daki
// gibi tüm dünyayı değil sadece Türkiye'yi kapsıyor.
export function TurkeyMapView({
  visitedPlateCodes,
  onToggleProvince,
}: {
  visitedPlateCodes: Set<number>;
  onToggleProvince: (plateCode: number, name: string) => void;
}) {
  const geography = useMemo(() => turkeyTopology, []);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-background-elevated">
      <ComposableMap
        projection="geoMercator"
        // Merkez + ölçek, Türkiye il topolojisinin gerçek koordinat
        // aralığından (25.67°–44.83°E, 35.82°–42.11°N) hesaplandı —
        // varsayılan 800x600 viewBox'ta doğu-batı ucundaki iller (Iğdır,
        // Edirne) kenardan taşmadan sığacak şekilde.
        projectionConfig={{ center: [35.25, 38.96], scale: 2000 }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geography}>
          {({ geographies }: { geographies: GeoFeature[] }) =>
            geographies.map((geo) => {
              const plateCode = turkeyGeoNamePlateCode(geo.properties.Name);
              if (plateCode === null) return null;
              const name = TURKEY_PROVINCES.find((p) => p.plateCode === plateCode)?.name ?? geo.properties.Name;
              const visited = visitedPlateCodes.has(plateCode);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onToggleProvince(plateCode, name)}
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
