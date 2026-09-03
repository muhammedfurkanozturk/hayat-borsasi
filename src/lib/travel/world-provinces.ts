// Seyahat kategorisi — Türkiye dışındaki ülkeler için GENEL (herhangi bir
// ülkeye uygulanabilen) il/eyalet/bölge (admin-1) drill-down verisi.
// Kaynak: Natural Earth'ün 10m admin-1 GeoJSON'ı (nvkelso/natural-earth-vector,
// public domain) — ham hâli 40MB olduğu için `mapshaper -simplify 3%` ile
// (Türkiye'nin kendi topojson'ında kullanılan AYNI yöntem) 4501 bölgeye,
// ~1.4MB'a (gzip ~350KB) indirildi, gereksiz alanlar atılıp sadece
// iso_a2/iso_3166_2/name/name_tr/name_en/admin bırakıldı (bkz.
// world-provinces-topo.json). `name_tr` Natural Earth'ün kendi Türkçe
// çeviri alanı — 190+ ülkenin binlerce alt bölgesini elle çevirmek yerine
// bu kullanıldı, örnekleme ile kalitesi doğrulandı (örn. "Tibet" ->
// "Tibet Özerk Bölgesi").
//
// Türkiye BİLİNÇLİ OLARAK bu genel yoldan HARİÇ tutuluyor — Türkiye'nin
// kendi elle kalibre edilmiş, gerçek kullanıcı verisiyle test edilmiş
// TurkeyMapView.tsx + turkey-provinces-topo.json'ı var (bkz. CLAUDE.md
// Bölüm B), bu iki veri kaynağı arasında ref_code çakışması olmasın diye
// (ikisi de ISO 3166-2 formatını kullanıyor, örn. "TR-34") bu dosya TR'yi
// hiçbir zaman döndürmüyor.
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import worldProvincesTopology from "./world-provinces-topo.json";

export interface ProvinceProperties {
  iso_a2: string;
  iso_3166_2: string;
  name: string;
  name_tr: string | null;
  name_en: string;
  admin: string;
}

type ProvinceCollection = FeatureCollection<Geometry, ProvinceProperties>;

const topology = worldProvincesTopology as unknown as Topology;
const objectKey = Object.keys(topology.objects)[0];

let cachedCollection: ProvinceCollection | null = null;

function allProvinces(): ProvinceCollection {
  if (!cachedCollection) {
    cachedCollection = feature(topology, topology.objects[objectKey]) as unknown as ProvinceCollection;
  }
  return cachedCollection;
}

export function getCountryProvinces(iso2: string): ProvinceCollection {
  if (iso2 === "TR") return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: allProvinces().features.filter((f) => f.properties.iso_a2 === iso2),
  };
}

export function countryHasProvinces(iso2: string): boolean {
  if (iso2 === "TR") return false;
  return allProvinces().features.some((f) => f.properties.iso_a2 === iso2);
}

export function provinceTurkishName(props: ProvinceProperties): string {
  return props.name_tr || props.name_en || props.name;
}
