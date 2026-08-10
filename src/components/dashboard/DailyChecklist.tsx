import { todayChecklist } from "@/lib/mock/dashboard-data";

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        checked ? "border-positive bg-positive-soft text-positive" : "border-border-soft text-transparent"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function DailyChecklist() {
  const completedWeight = todayChecklist
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);
  const totalWeight = todayChecklist.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Bugünün Görevleri</h2>
          <p className="text-xs text-muted">29 Temmuz · örnek liste</p>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted">
          {completedWeight}/{totalWeight} ağırlık
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {todayChecklist.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-hover"
          >
            <CheckMark checked={item.completed} />
            <span
              className={`flex-1 text-sm ${
                item.completed ? "text-muted line-through decoration-muted-soft" : "text-foreground"
              }`}
            >
              {item.title}
            </span>
            <span className="rounded-full border border-border-soft px-2 py-0.5 text-[11px] text-muted">
              {item.category}
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-soft">×{item.weight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
