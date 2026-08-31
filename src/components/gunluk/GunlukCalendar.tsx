"use client";

import { DayPicker } from "react-day-picker";
import { ChevronDownIcon } from "@/components/icons";

// react-day-picker'ın (originui/calendar referansından ilham, Bölüm 9d/8,
// 2026-08-25) saat seçici kısmı olmadan, SADECE takvim kısmı — NoteArchive.tsx
// bunu "ay listesi → gün ızgarası → not" 3 katmanlı akışın yerine tek bir
// sürekli takvim+ay gezinme kontrolü olarak kullanıyor. Görsel token'lar
// (border/accent/rounded-lg) shadcn'in soyut renkleri yerine bizim
// sistemimize çevrildi, harici CSS import edilmedi — tamamen Tailwind.
export function GunlukCalendar({
  month,
  onMonthChange,
  selected,
  onSelectDay,
  daysWithNotes,
  disabledAfter,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  selected?: Date;
  onSelectDay: (date: Date) => void;
  daysWithNotes: Set<string>;
  disabledAfter: Date;
}) {
  return (
    <DayPicker
      mode="single"
      month={month}
      onMonthChange={onMonthChange}
      selected={selected}
      onSelect={(date) => date && onSelectDay(date)}
      disabled={{ after: disabledAfter }}
      showOutsideDays
      modifiers={{
        hasNote: (date) => daysWithNotes.has(toIso(date)),
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
          "btn flex h-9 w-9 items-center justify-center rounded-lg font-mono tabular-nums text-foreground hover:border-2 hover:border-accent/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-muted-soft disabled:opacity-40",
        selected: "[&>button]:border-2 [&>button]:border-accent [&>button]:bg-accent-soft [&>button]:text-accent",
        today: "[&>button]:border-2 [&>button]:border-border",
        outside: "[&>button]:text-muted-soft [&>button]:opacity-40",
        disabled: "",
        hidden: "invisible",
      }}
      modifiersClassNames={{
        hasNote: "after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-positive",
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
