import type { MuscleGroup } from "@hayat-borsasi/shared";

// EK GÖREV 1 (2026-09-01) — el-çizimi SVG kaldırılıp `body-muscles`
// kütüphanesine geçildi. Bu dosya, bizim basit 13'lü `MuscleGroup`
// taksonomimiz ile kütüphanenin 70+ granüler (sol/sağ ayrı) kas
// kimlikleri arasındaki köprü. Kütüphanenin kendi paketinden (npm pack ile
// indirilip incelendi) doğrulanan gerçek id listesine göre elle kuruldu —
// kütüphane bunun için hazır bir eşleme sağlamıyor.
//
// Not: kütüphanenin ÖN görünümünde baldır (calves) hiç yok (sadece ayak/
// tibialis/diz var) — bu kütüphanenin kendi anatomik modelleme kararı,
// bizim eksikliğimiz değil. "calves" grubu bu yüzden sadece ARKA görünümde
// görsel karşılık buluyor, ön görünümde o kas grubunu seçmenin haritada
// vurgulanacak bir bölgesi yok (uygulama çökmez, sadece o an boyanacak bir
// şey olmaz).
export const MUSCLE_GROUP_TO_BODY_MUSCLE_IDS: Record<MuscleGroup, string[]> = {
  chest: ["chest-upper-left", "chest-upper-right", "chest-lower-left", "chest-lower-right"],
  back: [
    "lats-upper-left",
    "lats-mid-left",
    "lats-lower-left",
    "lats-upper-right",
    "lats-mid-right",
    "lats-lower-right",
    "lower-back-erectors-left",
    "lower-back-erectors-right",
    "lower-back-ql-left",
    "lower-back-ql-right",
    "spine",
  ],
  shoulders: [
    "shoulder-front-left",
    "shoulder-front-right",
    "shoulder-side-left",
    "shoulder-side-right",
    "deltoid-rear-left",
    "deltoid-rear-right",
  ],
  biceps: ["biceps-left", "biceps-right"],
  triceps: ["triceps-long-left", "triceps-lateral-left", "triceps-long-right", "triceps-lateral-right"],
  forearms: [
    "forearm-left",
    "forearm-right",
    "forearm-flexors-left",
    "forearm-extensors-left",
    "forearm-flexors-right",
    "forearm-extensors-right",
  ],
  abs: ["abs-upper-left", "abs-upper-right", "abs-lower-left", "abs-lower-right", "serratus-anterior-left", "serratus-anterior-right"],
  obliques: ["obliques-left", "obliques-right"],
  quads: ["quads-left", "quads-right"],
  hamstrings: ["hamstrings-medial-left", "hamstrings-lateral-left", "hamstrings-medial-right", "hamstrings-lateral-right"],
  glutes: ["gluteus-medius-left", "gluteus-maximus-left", "gluteus-medius-right", "gluteus-maximus-right"],
  calves: [
    "calves-gastroc-medial-left",
    "calves-gastroc-lateral-left",
    "calves-soleus-left",
    "calves-gastroc-medial-right",
    "calves-gastroc-lateral-right",
    "calves-soleus-right",
  ],
  traps: ["traps-upper-left", "traps-mid-left", "traps-lower-left", "traps-upper-right", "traps-mid-right", "traps-lower-right"],
};

// Ters yön: kütüphane id'sinden bizim MuscleGroup'umuza.
export const BODY_MUSCLE_ID_TO_GROUP: Record<string, MuscleGroup> = Object.entries(
  MUSCLE_GROUP_TO_BODY_MUSCLE_IDS
).reduce(
  (acc, [group, ids]) => {
    for (const id of ids) acc[id] = group as MuscleGroup;
    return acc;
  },
  {} as Record<string, MuscleGroup>
);
