export interface PersonalRecord {
  exerciseName: string;
  weightKg: number;
  date: string;
}

// Kişisel rekor (PR) takibi — genel pazar standardı (Strong/Hevy): bir
// hareket için en yüksek ağırlıkla yapılmış set PR sayılır. Yeni bir tablo
// gerekmiyor, workout_sets'ten türetiliyor.
export function calculatePersonalRecords(
  sets: { exercise_name: string; weight_kg: number | null; date: string }[]
): Map<string, PersonalRecord> {
  const records = new Map<string, PersonalRecord>();
  for (const s of sets) {
    if (s.weight_kg == null) continue;
    const existing = records.get(s.exercise_name);
    if (!existing || s.weight_kg > existing.weightKg) {
      records.set(s.exercise_name, { exerciseName: s.exercise_name, weightKg: s.weight_kg, date: s.date });
    }
  }
  return records;
}

// "Son yapıldı: 3 gün önce" chip'i için her hareketin en güncel tarihi.
export function calculateLastDoneDates(sets: { exercise_name: string; date: string }[]): Map<string, string> {
  const lastDone = new Map<string, string>();
  for (const s of sets) {
    const existing = lastDone.get(s.exercise_name);
    if (!existing || s.date > existing) lastDone.set(s.exercise_name, s.date);
  }
  return lastDone;
}

// Haftalık antrenman hacmi trend grafiği için — set başına kaldırılan kg
// (ağırlıksız hareketlerde 0, vücut ağırlığı henüz ayrı bir alan değil).
export function setVolume(set: { reps: number; weight_kg: number | null }): number {
  return set.reps * (set.weight_kg ?? 0);
}

// Kullanıcının kendi `exercises` kayıtlarındaki (opsiyonel) primary_muscle
// etiketine göre set sayısını kas gruplarına dağıtan ortak yardımcı — hem
// ısı haritası (normalize edilmiş) hem Takip sekmesindeki bar listesi (ham
// sayı) bunu kullanıyor. Etiketlenmemiş hareketler sessizce atlanır.
export function calculateMuscleSetCounts(
  sets: { exercise_name: string }[],
  exercises: { name: string; primary_muscle?: string | null }[]
): Map<string, number> {
  const muscleByName = new Map<string, string>();
  for (const ex of exercises) {
    if (ex.primary_muscle) muscleByName.set(ex.name.toLowerCase(), ex.primary_muscle);
  }
  const counts = new Map<string, number>();
  for (const s of sets) {
    const muscle = muscleByName.get(s.exercise_name.toLowerCase());
    if (!muscle) continue;
    counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
  }
  return counts;
}

// Kas Haritası ısı-haritası için — en yoğun kas grubuna göre 0-1 normalize
// edilmiş versiyon.
export function calculateMuscleVolume(
  sets: { exercise_name: string }[],
  exercises: { name: string; primary_muscle?: string | null }[]
): Record<string, number> {
  const counts = calculateMuscleSetCounts(sets, exercises);
  const max = Math.max(1, ...counts.values());
  const normalized: Record<string, number> = {};
  for (const [muscle, count] of counts) {
    normalized[muscle] = count / max;
  }
  return normalized;
}

export interface LastPerformance {
  reps: number;
  weightKg: number | null;
  date: string;
}

// Progressive overload autofill — MuscleWiki kullanıcılarının en çok
// şikayet ettiği eksiklik: bir önceki seansın set/tekrar/ağırlık bilgisi
// otomatik gelmiyordu. `sets` `fetchWorkoutSets`'ten geldiği haliyle
// tarihe göre AZALAN sıralı olduğu için, bir hareket için karşılaşılan
// İLK satır zaten en güncel tarih — o tarihteki en ağır seti (kullanıcının
// o günkü "çalışma ağırlığı") referans alıyoruz.
export function calculateLastPerformance(
  sets: { exercise_name: string; reps: number; weight_kg: number | null; date: string }[]
): Map<string, LastPerformance> {
  const result = new Map<string, LastPerformance>();
  for (const s of sets) {
    const existing = result.get(s.exercise_name);
    if (!existing) {
      result.set(s.exercise_name, { reps: s.reps, weightKg: s.weight_kg, date: s.date });
    } else if (s.date === existing.date && (s.weight_kg ?? 0) > (existing.weightKg ?? 0)) {
      result.set(s.exercise_name, { reps: s.reps, weightKg: s.weight_kg, date: s.date });
    }
  }
  return result;
}

export interface ExerciseProgressPoint {
  label: string;
  date: string;
  weightKg: number;
}

// Belirli bir hareketin, seçilen gün penceresindeki en ağır setini gün
// gün çizen "ilerleme" grafiği için — sadece gerçekten veri olan günler
// döner (skor trendlerindeki gibi boş günleri 0 ile doldurmuyor, çünkü
// "0 kg kaldırdın" göstermek yanıltıcı olurdu, sadece o gün antrenman
// yapılmadı demek).
export function buildExerciseProgressSeries(
  sets: { exercise_name: string; weight_kg: number | null; date: string }[],
  exerciseName: string,
  days: number
): ExerciseProgressPoint[] {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString().slice(0, 10);

  const maxByDate = new Map<string, number>();
  for (const s of sets) {
    if (s.exercise_name !== exerciseName || s.weight_kg == null || s.date < sinceIso) continue;
    const existing = maxByDate.get(s.date) ?? 0;
    if (s.weight_kg > existing) maxByDate.set(s.date, s.weight_kg);
  }

  return Array.from(maxByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weightKg]) => {
      const d = new Date(date);
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, date, weightKg };
    });
}
