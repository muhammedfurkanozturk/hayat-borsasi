"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoBounds, geoCentroid } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { animate } from "motion/react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
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

// Ülke sınırlarını (bounds/centroid hesabı için) HARİTA RENDER'INDAN
// bağımsız, bir kere çözülmüş GeoJSON olarak tutuyoruz — `<Geographies>`
// kendi içinde topojson'ı çözüyor ama bize sadece render sırasında geo
// nesnesi veriyor, "şu an odaklanılan ülkenin sınır kutusu ne" sorusunu
// render dışında (zoom hedefini hesaplarken) cevaplamak için ayrı bir
// çözümlenmiş kopya gerekiyor.
const worldFeatures = (
  feature(worldTopology as unknown as Topology, (worldTopology as unknown as Topology).objects.countries) as unknown as {
    features: Feature<Geometry, { name: string }>[];
  }
).features;

function findFeatureByRefCode(refCode: string): Feature<Geometry, { name: string }> | null {
  return (
    worldFeatures.find((f) => worldCountryRefCode((f.id as string | undefined) ?? null, f.properties.name) === refCode) ??
    null
  );
}

const WORLD_CENTER: [number, number] = [0, 0];
const WORLD_ZOOM = 1;

// Bir ülkenin coğrafi sınır kutusundan (derece cinsinden) makul bir
// "içine uç" zoom seviyesi türetiyor — küçük bir ülke (ör. Lüksemburg)
// yüksek zoom, büyük bir ülke (ör. Rusya) düşük zoom alsın diye. Sabit
// bir katsayı yerine dünya haritasının açısal genişliğine (360°) oranla
// hesaplanıyor, WorldMapView'ın projectionConfig scale'iyle (148) tutarlı.
function computeFlyTo(f: Feature<Geometry, { name: string }>): { center: [number, number]; zoom: number } {
  const [[lonMin, latMin], [lonMax, latMax]] = geoBounds(f);
  const centroid = geoCentroid(f) as [number, number];
  const lonSpan = Math.max(lonMax - lonMin, 0.5);
  const latSpan = Math.max(latMax - latMin, 0.5);
  const angularSpan = Math.max(lonSpan, latSpan * 1.7);
  const zoom = Math.min(9, Math.max(1.6, 130 / angularSpan));
  return { center: centroid, zoom };
}

export function WorldMapView({
  visitedRefCodes,
  focusedRefCode,
  onToggleCountry,
}: {
  visitedRefCodes: Set<string>;
  focusedRefCode?: string | null;
  onToggleCountry: (refCode: string, name: string) => void;
}) {
  const geography = useMemo(() => worldTopology, []);
  const [center, setCenter] = useState<[number, number]>(WORLD_CENTER);
  const [zoom, setZoom] = useState(WORLD_ZOOM);
  const animationRef = useRef<{ stop: () => void } | null>(null);

  // "Uç" animasyonu — motion'ın imperative animate()'i, 0->1 ilerlemeyi
  // sürükleyip başlangıç/bitiş merkez+zoom'u arasında elle lerp yapıyor
  // (ZoomableGroup'un center/zoom prop'ları düz sayı, CSS transition'a
  // tepki vermiyor — bu yüzden JS tarafında tween gerekiyor).
  useEffect(() => {
    animationRef.current?.stop();
    const target = focusedRefCode ? findFeatureByRefCode(focusedRefCode) : null;
    const { center: toCenter, zoom: toZoom } = target ? computeFlyTo(target) : { center: WORLD_CENTER, zoom: WORLD_ZOOM };

    const fromCenter = center;
    const fromZoom = zoom;
    const controls = animate(0, 1, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (t) => {
        setCenter([fromCenter[0] + (toCenter[0] - fromCenter[0]) * t, fromCenter[1] + (toCenter[1] - fromCenter[1]) * t]);
        setZoom(fromZoom + (toZoom - fromZoom) * t);
      },
    });
    animationRef.current = controls;
    return () => controls.stop();
    // fromCenter/fromZoom bilerek dep listesinde değil — her yeni odak
    // değişiminde SADECE o anki gerçek konumdan başlaması yeterli, tekrar
    // tetiklenmesine gerek yok (aksi halde animasyon her frame'de resetlenir).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedRefCode]);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-background-elevated">
      <ComposableMap projectionConfig={{ scale: 148 }} style={{ width: "100%", height: "auto" }}>
        <ZoomableGroup center={center} zoom={zoom} minZoom={1} maxZoom={9} onMoveEnd={({ coordinates, zoom: z }) => {
          setCenter(coordinates as [number, number]);
          setZoom(z);
        }}>
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
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
