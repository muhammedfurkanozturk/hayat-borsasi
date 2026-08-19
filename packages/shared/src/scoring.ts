export interface WeightedTask {
  weight: number;
  completed: boolean;
  // Alt görevi olan bir görevde, o görevin ne kadar tamamlandığını daha
  // hassas ölçmek için kullanılır. subtaskTotal > 0 olduğunda devreye girer.
  subtaskTotal?: number;
  subtaskCompleted?: number;
}

// Alt görevi olan bir görev için tamamlanma oranı: ana checkbox tek başına
// ağırlığın %20'sini verir (görevi "yaptım" demek), kalan %80 ise
// tamamlanan alt görev oranına göre paylaştırılır. Alt görevi olmayan
// görevlerde eskisi gibi ikili (tam/hiç) davranış geçerli.
function completionRatio(task: WeightedTask): number {
  if (task.subtaskTotal && task.subtaskTotal > 0) {
    const base = task.completed ? 0.2 : 0;
    const subtaskShare = 0.8 * ((task.subtaskCompleted ?? 0) / task.subtaskTotal);
    return base + subtaskShare;
  }
  return task.completed ? 1 : 0;
}

export function calculateScore(tasks: WeightedTask[]): number {
  const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);
  if (totalWeight === 0) return 0;

  const completedWeight = tasks.reduce((sum, task) => sum + task.weight * completionRatio(task), 0);

  return (completedWeight / totalWeight) * 100;
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export interface TimedTask {
  weight: number;
  completed: boolean;
  completedAt: string | null;
}

export interface HourlyPoint {
  label: string;
  score: number | null;
}

// Bugün 00:00'dan şu ana kadar, görevler tamamlandıkça skorun saat saat
// nasıl yükseldiğini gösteren kümülatif seri. Henüz gelmemiş saatler için
// (şu andan sonrası) veri üretmiyoruz — grafik "şimdi"de duruyor.
export function buildHourlySeries(tasks: TimedTask[]): HourlyPoint[] {
  const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);
  const currentHour = new Date().getHours();

  const completions = tasks
    .filter((task) => task.completed)
    .map((task) => ({
      hour: task.completedAt ? new Date(task.completedAt).getHours() : 0,
      weight: task.weight,
    }));

  const points: HourlyPoint[] = [];
  for (let hour = 0; hour <= 24; hour++) {
    const label = `${String(hour % 24).padStart(2, "0")}:00`;

    if (hour > currentHour) {
      points.push({ label, score: null });
      continue;
    }

    const completedWeight = completions
      .filter((completion) => completion.hour <= hour)
      .reduce((sum, completion) => sum + completion.weight, 0);

    points.push({ label, score: totalWeight === 0 ? 0 : (completedWeight / totalWeight) * 100 });
  }

  return points;
}
