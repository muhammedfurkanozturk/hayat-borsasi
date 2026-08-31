"use client";

import { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
// world-atlas (MIT, Natural Earth) — react-simple-maps'in resmi önerdiği
// veri kaynağı. 110m çözünürlük (177 ülke/bölge geometrisi) — bu ölçekte
// mikro-ada devletlerinin bir kısmı basitleştirme sırasında düşüyor,
// kabul edilebilir (kullanıcı onaylı).
import worldTopology from "world-atlas/countries-110m.json";
import { worldCountryRefCode, worldCountryTurkishName } from "@/lib/travel/world-country-codes";

interface GeoFeature {
  rsmKey: string;
  id: string | null;
  properties: { name: string };
}

export function WorldMapView({
  visitedRefCodes,
  onToggleCountry,
}: {
  visitedRefCodes: Set<string>;
  onToggleCountry: (refCode: string, name: string) => void;
}) {
  const geography = useMemo(() => worldTopology, []);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-background-elevated">
      <ComposableMap projectionConfig={{ scale: 148 }} style={{ width: "100%", height: "auto" }}>
        <Geographies geography={geography}>
          {({ geographies }: { geographies: GeoFeature[] }) =>
            geographies.map((geo) => {
              const refCode = worldCountryRefCode(geo.id, geo.properties.name);
              const name = worldCountryTurkishName(geo.id, geo.properties.name);
              const visited = visitedRefCodes.has(refCode);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onToggleCountry(refCode, name)}
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
