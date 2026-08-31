import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  EXERCISE_LIBRARY,
  MUSCLE_GROUP_LABELS,
  parseQuickWorkoutPlan,
  parseWeeklyWorkoutPlan,
  type EquipmentType,
  type MuscleGroup,
  type QuickWorkoutPlan,
  type WeeklyWorkoutPlan,
} from "@hayat-borsasi/shared";

const client = new Anthropic();

export type WorkoutGoal = "hypertrophy" | "strength" | "endurance";

const GOAL_LABELS: Record<WorkoutGoal, string> = {
  hypertrophy: "kas kütlesi (hipertrofi) — 8-12 tekrar aralığı",
  strength: "kuvvet — 3-6 tekrar aralığı, daha az egzersiz daha ağır yük",
  endurance: "dayanıklılık — 15-20 tekrar aralığı, daha kısa dinlenme",
};

// MuscleWiki'nin AI antrenman modları (piyasa araştırması) — kritik kural:
// AI egzersiz UYDURMASIN, sadece exerciseLibrary.ts'teki gerçek isimlerden
// seçsin. Bunu iki katmanda garanti ediyoruz: (1) sisteme sadece filtrelenmiş
// kütüphane alt kümesi veriliyor, isim UYDURAMAYACAK kadar dar bir liste,
// (2) parseQuickWorkoutPlan/parseWeeklyWorkoutPlan çalışma zamanında
// kütüphanede karşılığı olmayan isimleri zaten sessizce eliyor.
function filterLibrary(muscleGroups: MuscleGroup[], equipment: EquipmentType[]) {
  return EXERCISE_LIBRARY.filter(
    (e) => muscleGroups.includes(e.muscleGroup) && (equipment.length === 0 || equipment.includes(e.equipment))
  );
}

function libraryPromptList(exercises: { name: string; muscleGroup: MuscleGroup; equipment: string }[]): string {
  return exercises.map((e) => `${e.name} (${MUSCLE_GROUP_LABELS[e.muscleGroup]}, ${e.equipment})`).join("; ");
}

async function requestJson(system: string, userMessage: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1800,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: userMessage }],
  });
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }
  return textBlock.text;
}

const JSON_RULES =
  "Yanıtın SADECE JSON objesi olsun, ```json gibi kod bloğu işaretleyicisi KULLANMA, öncesinde/sonrasında hiçbir açıklama olmasın. " +
  "Egzersiz isimlerini SANA VERİLEN LİSTEDEN BİREBİR (harf harf aynı) kullan, kendi egzersiz ismini UYDURMA.";

export async function generateQuickWorkout(input: {
  muscleGroups: MuscleGroup[];
  equipment: EquipmentType[];
  goal: WorkoutGoal;
}): Promise<QuickWorkoutPlan> {
  const pool = filterLibrary(input.muscleGroups, input.equipment);
  if (pool.length === 0) {
    throw new Error("Seçtiğin kas grubu/ekipman kombinasyonu için kütüphanede yeterli egzersiz yok.");
  }
  const system =
    `Sen bir antrenman koçusun. Kullanıcı için TEK bir antrenman seansı oluştur. ` +
    `Hedef: ${GOAL_LABELS[input.goal]}. Kullanılabilir egzersizler (SADECE bunlardan seç): ${libraryPromptList(pool)}. ` +
    `5-8 egzersiz seç, büyük kas gruplarından küçüklere doğru mantıklı bir sırayla diz. ` +
    `SADECE şu JSON formatında döndür: {"exercises":[{"name":"kütüphaneden birebir isim","sets":3,"reps":10}]}. ${JSON_RULES}`;

  const attempt = async () => parseQuickWorkoutPlan(await requestJson(system, "Bugün için bir antrenman seansı oluştur."));
  const first = await attempt();
  if (first) return first;
  const second = await attempt();
  if (second) return second;
  throw new Error("Antrenman üretilirken bir sorun oluştu, tekrar dener misin?");
}

export async function generateWeeklyWorkout(input: {
  muscleGroups: MuscleGroup[];
  equipment: EquipmentType[];
  goal: WorkoutGoal;
  daysPerWeek: number;
}): Promise<WeeklyWorkoutPlan> {
  const pool = filterLibrary(input.muscleGroups, input.equipment);
  if (pool.length === 0) {
    throw new Error("Seçtiğin kas grubu/ekipman kombinasyonu için kütüphanede yeterli egzersiz yok.");
  }
  const validKeys = Object.keys(MUSCLE_GROUP_LABELS).join(", ");
  const system =
    `Sen bir antrenman koçusun. Kullanıcı için haftada ${input.daysPerWeek} günlük bir antrenman programı oluştur — ` +
    `gün sayısına uygun mantıklı bir bölünme seç (örn. 3 gün: Push/Pull/Legs, 4 gün: Üst/Alt tekrarlı, 5-6 gün: Push/Pull/Legs iki kez). ` +
    `Hedef: ${GOAL_LABELS[input.goal]}. Kullanılabilir egzersizler (SADECE bunlardan seç): ${libraryPromptList(pool)}. ` +
    `Her gün için 4-6 egzersiz seç. Ayrıca bir "progressionNote" yaz — bu TEK SEFERLİK, statik bir plan OLMASIN: ` +
    `kullanıcıya haftalar ilerledikçe (örn. 4 haftalık bir döngüde) ağırlığı/hacmi nasıl kademeli arttıracağını ve ` +
    `4. haftada neden bir "deload" (hafif toparlanma) haftası yapması gerektiğini 2-3 cümlede Türkçe açıkla. ` +
    `Her günün "muscleGroups" alanında SADECE şu İngilizce anahtar kelimeleri kullan (başka hiçbir kelime/Türkçe çeviri kullanma): ${validKeys}. ` +
    `SADECE şu JSON formatında döndür: {"days":[{"label":"Gün 1 - Push","muscleGroups":["chest","shoulders","triceps"],"exercises":[{"name":"...","sets":3,"reps":10}]}],"progressionNote":"..."}. ${JSON_RULES}`;

  const attempt = async () => parseWeeklyWorkoutPlan(await requestJson(system, "Haftalık bir antrenman programı oluştur."));
  const first = await attempt();
  if (first) return first;
  const second = await attempt();
  if (second) return second;
  throw new Error("Program üretilirken bir sorun oluştu, tekrar dener misin?");
}
