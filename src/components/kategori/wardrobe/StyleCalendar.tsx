"use client";

import { DayPicker } from "react-day-picker";
import { ChevronDownIcon } from "@/components/icons";

// GunlukCalendar.tsx'in (Günlükler modülü) BİREBİR aynı deseni — Stil
// Takvimi (Acloset'ten ilham, piyasa araştırması) için. Ayrı bir CSS/desen
// icat etmek yerine zaten test edilmiş bu bileşen kopyalandı, sadece
// `hasWear` modifier'ı (yeşil nokta yerine --stil-accent tonunda) ve o
// modülün rengi kullanılıyor.
export function StyleCalendar({
  month,
  onMonthChange,
  selected,
  onSelectDay,
  daysWithWear,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  selected?: Date;
  onSelectDay: (date: Date) => void;
  daysWithWear: Set<string>;
}) {
  return (
    <DayPicker
      mode="single"
      month={month}
      onMonthChange={onMonthChange}
      selected={selected}
      onSelect={(date) => date && onSelectDay(date)}
      disabled={{ after: new Date() }}
      showOutsideDays
      modifiers={{
        hasWear: (date) => daysWithWear.has(toIso(date)),
      }}
      formatters={{
        formatWeekdayName: (date) => date.toLocaleDateString("tr-TR", { weekday: "short" }),
        formatCaption: (date) => date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
      }}
      components={{
        Chevron: ({ orientation }) => (
          <ChevronDownIcon width={16} height={16} className={orientation === "left" ? "rotate-90" : "-rotate-90"} />
        ),
      }}
      classNames={{
        months: "relative flex flex-col gap-4",
        month: "w-full",
        month_caption: "relative mx-10 mb-2 flex h-9 items-center justify-center",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "absolute top-0 flex w-full justify-between",
        button_previous:
          "btn flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
        button_next:
          "btn flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
        weekdays: "flex",
        weekday: "w-10 pb-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted",
        week: "flex w-full",
        day: "relative flex h-10 w-10 items-center justify-center p-0 text-sm",
        day_button:
          "btn flex h-9 w-9 items-center justify-center rounded-lg font-mono tabular-nums text-foreground hover:border-2 hover:border-[color:var(--stil-accent)]/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-muted-soft disabled:opacity-40",
        selected: "[&>button]:border-2 [&>button]:border-[color:var(--stil-accent)] [&>button]:bg-[color:var(--stil-accent)]/15 [&>button]:text-[color:var(--stil-accent)]",
        today: "[&>button]:border-2 [&>button]:border-border",
        outside: "[&>button]:text-muted-soft [&>button]:opacity-40",
        disabled: "",
        hidden: "invisible",
      }}
      modifiersClassNames={{
        hasWear:
          "after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-[color:var(--stil-accent)]",
      }}
    />
  );
}

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
