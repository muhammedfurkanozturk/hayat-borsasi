import Svg, { Circle, Ellipse, Polygon, Rect } from "react-native-svg";
import type { MuscleGroup } from "@hayat-borsasi/shared";

// Madde 4 (mobil ertelenen alt-özellikler) — Kas Haritası (2026-09-04).
// Web'in `body-muscles` (npm) kütüphanesi DOM-only (imperatif
// `document`/SVG element manipülasyonu yapıyor, `new BodyChart(container,
// ...)`) — React Native'de `document` yok, kütüphane hiç çalışmıyor
// (bkz. CLAUDE.md, bu turdan önceki not: "RN'de karşılığı yok").
// **Bilinçli basitleştirme:** web'in body-muscles'a geçmeden ÖNCEKİ
// kendi ilk implementasyonuyla AYNI felsefe — 13 kas grubunu temsil eden
// basit geometrik bölgelerden (dikdörtgen/elips/çokgen) oluşan, elle
// çizilmiş bir vücut silüeti. `react-native-svg` zaten proje bağımlılığı
// (travel-panel.tsx/intro-animation.tsx'te kullanılıyor) — yeni paket
// eklenmedi. Anatomik olarak piksel-mükemmel değil ama net, dokunulabilir,
// her kas grubunu ayrı ayrı tanımlanabilir bölgelere ayırıyor.
export interface MuscleZone {
  group: MuscleGroup;
  shape: "rect" | "ellipse" | "polygon";
  rect?: { x: number; y: number; width: number; height: number; rx?: number };
  ellipse?: { cx: number; cy: number; rx: number; ry: number };
  polygon?: { points: string };
}

// viewBox: 0 0 200 340
export const FRONT_ZONES: MuscleZone[] = [
  { group: "shoulders", shape: "ellipse", ellipse: { cx: 54, cy: 78, rx: 16, ry: 14 } },
  { group: "shoulders", shape: "ellipse", ellipse: { cx: 146, cy: 78, rx: 16, ry: 14 } },
  { group: "chest", shape: "rect", rect: { x: 66, y: 78, width: 68, height: 34, rx: 10 } },
  { group: "biceps", shape: "rect", rect: { x: 34, y: 90, width: 20, height: 46, rx: 8 } },
  { group: "biceps", shape: "rect", rect: { x: 146, y: 90, width: 20, height: 46, rx: 8 } },
  { group: "forearms", shape: "rect", rect: { x: 30, y: 140, width: 20, height: 48, rx: 8 } },
  { group: "forearms", shape: "rect", rect: { x: 150, y: 140, width: 20, height: 48, rx: 8 } },
  { group: "abs", shape: "rect", rect: { x: 78, y: 114, width: 44, height: 54, rx: 8 } },
  { group: "obliques", shape: "rect", rect: { x: 63, y: 118, width: 13, height: 46, rx: 6 } },
  { group: "obliques", shape: "rect", rect: { x: 124, y: 118, width: 13, height: 46, rx: 6 } },
  { group: "quads", shape: "rect", rect: { x: 68, y: 172, width: 28, height: 82, rx: 10 } },
  { group: "quads", shape: "rect", rect: { x: 104, y: 172, width: 28, height: 82, rx: 10 } },
  { group: "calves", shape: "rect", rect: { x: 70, y: 258, width: 24, height: 64, rx: 9 } },
  { group: "calves", shape: "rect", rect: { x: 106, y: 258, width: 24, height: 64, rx: 9 } },
];

export const BACK_ZONES: MuscleZone[] = [
  { group: "traps", shape: "polygon", polygon: { points: "78,54 122,54 138,80 100,92 62,80" } },
  { group: "shoulders", shape: "ellipse", ellipse: { cx: 54, cy: 78, rx: 16, ry: 14 } },
  { group: "shoulders", shape: "ellipse", ellipse: { cx: 146, cy: 78, rx: 16, ry: 14 } },
  { group: "back", shape: "rect", rect: { x: 66, y: 88, width: 68, height: 78, rx: 12 } },
  { group: "triceps", shape: "rect", rect: { x: 34, y: 90, width: 20, height: 46, rx: 8 } },
  { group: "triceps", shape: "rect", rect: { x: 146, y: 90, width: 20, height: 46, rx: 8 } },
  { group: "forearms", shape: "rect", rect: { x: 30, y: 140, width: 20, height: 48, rx: 8 } },
  { group: "forearms", shape: "rect", rect: { x: 150, y: 140, width: 20, height: 48, rx: 8 } },
  { group: "glutes", shape: "rect", rect: { x: 68, y: 170, width: 28, height: 40, rx: 12 } },
  { group: "glutes", shape: "rect", rect: { x: 104, y: 170, width: 28, height: 40, rx: 12 } },
  { group: "hamstrings", shape: "rect", rect: { x: 68, y: 214, width: 28, height: 44, rx: 10 } },
  { group: "hamstrings", shape: "rect", rect: { x: 104, y: 214, width: 28, height: 44, rx: 10 } },
  { group: "calves", shape: "rect", rect: { x: 70, y: 262, width: 24, height: 60, rx: 9 } },
  { group: "calves", shape: "rect", rect: { x: 106, y: 262, width: 24, height: 60, rx: 9 } },
];

export function MuscleMap({
  view,
  volumeByGroup,
  selectedGroup,
  onSelectGroup,
  accent,
  muted,
}: {
  view: "front" | "back";
  volumeByGroup: Partial<Record<MuscleGroup, number>>;
  selectedGroup: MuscleGroup | null;
  onSelectGroup: (group: MuscleGroup) => void;
  accent: string;
  muted: string;
}) {
  const zones = view === "front" ? FRONT_ZONES : BACK_ZONES;

  function colorFor(group: MuscleGroup) {
    const isSelected = selectedGroup === group;
    const intensity = volumeByGroup[group] ?? 0;
    const active = isSelected || intensity > 0;
    return {
      fill: active ? accent : muted,
      fillOpacity: active ? 0.28 + intensity * 0.5 : 0.22,
      stroke: isSelected ? accent : "transparent",
      strokeWidth: isSelected ? 2 : 0,
    };
  }

  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 340">
      {/* Baş — dekoratif, dokunulamaz, kas grubu değil. */}
      <Circle cx={100} cy={30} r={18} fill={muted} fillOpacity={0.15} />
      {zones.map((zone, i) => {
        const c = colorFor(zone.group);
        const key = `${zone.group}-${i}`;
        const handlePress = () => onSelectGroup(zone.group);
        if (zone.shape === "rect" && zone.rect) {
          return (
            <Rect
              key={key}
              x={zone.rect.x}
              y={zone.rect.y}
              width={zone.rect.width}
              height={zone.rect.height}
              rx={zone.rect.rx ?? 0}
              onPress={handlePress}
              {...c}
            />
          );
        }
        if (zone.shape === "ellipse" && zone.ellipse) {
          return (
            <Ellipse
              key={key}
              cx={zone.ellipse.cx}
              cy={zone.ellipse.cy}
              rx={zone.ellipse.rx}
              ry={zone.ellipse.ry}
              onPress={handlePress}
              {...c}
            />
          );
        }
        if (zone.shape === "polygon" && zone.polygon) {
          return <Polygon key={key} points={zone.polygon.points} onPress={handlePress} {...c} />;
        }
        return null;
      })}
    </Svg>
  );
}
