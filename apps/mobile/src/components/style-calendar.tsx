import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { WHERING_LIME, WHERING_LIME_TEXT } from "@/components/wardrobe-panel";
import { useThemeMode } from "@/lib/theme-context";

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// Kritik düzeltme (2026-09-03, madde 3) — metin renkleri sabit/tek moda
// kilitliydi (bkz. CLAUDE.md "Kategori Temaları" kritik düzeltme notu).
// Lime vurgu (WHERING_LIME) HER İKİ modda da aynı.
function getCalendarColors(isDark: boolean) {
  return isDark
    ? { text: "#f5f5f5", muted: "#a1a1aa", outsideText: "#52525b", todayBorder: "#3f3f46" }
    : { text: "#141414", muted: "#71717a", outsideText: "#a1a1aa", todayBorder: "#d4d4d8" };
}

function getCalendarStyles(c: ReturnType<typeof getCalendarColors>) {
  return StyleSheet.create({
    captionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    navButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
    captionText: { fontSize: 14, fontWeight: "700", color: c.text },
    weekRow: { flexDirection: "row" },
    weekdayLabel: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "600", color: c.muted, textTransform: "uppercase" },
    dayCell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
    dayButton: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    dayText: { fontSize: 13, fontVariant: ["tabular-nums"] },
    wearDot: { position: "absolute", bottom: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: WHERING_LIME },
  });
}

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type Cell = { date: Date; outside: boolean };

function buildMonthGrid(month: Date): Cell[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Pazartesi=0 başlangıçlı ofset (JS'in Pazar=0 varsayılanından Türkçe
  // takvim haftası başlangıcına çevirmek için).
  const startOffset = (firstOfMonth.getDay() + 6) % 7;

  const cells: Cell[] = [];
  for (let i = startOffset; i > 0; i--) {
    cells.push({ date: new Date(year, monthIndex, 1 - i), outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, monthIndex, d), outside: false });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: true });
  }
  return cells;
}

// Web'in react-day-picker tabanlı StyleCalendar.tsx'inin RN portu — RN'de
// react-day-picker (DOM/web-only) çalışmadığı için sıfırdan, sade bir ay
// grid'i inşa edildi (yeni bağımlılık eklenmeden, saf tarih matematiği).
// Aynı sözleşme: `daysWithWear` (ISO string seti) günün altında nokta
// gösteriyor, bugünden SONRAKİ günler devre dışı, Pazartesi başlangıçlı
// Türkçe hafta.
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
  const calendarColors = getCalendarColors(useThemeMode().theme === "dark");
  const styles = getCalendarStyles(calendarColors);
  const today = new Date();
  const cells = buildMonthGrid(month);
  const caption = month.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  function goPrevMonth() {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }
  function goNextMonth() {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.captionRow}>
        <Pressable onPress={goPrevMonth} hitSlop={8} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={calendarColors.muted} />
        </Pressable>
        <ThemedText style={styles.captionText}>{caption}</ThemedText>
        <Pressable onPress={goNextMonth} hitSlop={8} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={calendarColors.muted} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <ThemedText key={label} style={styles.weekdayLabel}>
            {label}
          </ThemedText>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.weekRow}>
          {cells.slice(row * 7, row * 7 + 7).map(({ date, outside }) => {
            const disabled = date.getTime() > today.getTime() && !sameDay(date, today);
            const isSelected = selected ? sameDay(date, selected) : false;
            const isToday = sameDay(date, today);
            const hasWear = daysWithWear.has(toIso(date));
            return (
              <Pressable
                key={date.toISOString()}
                disabled={disabled}
                onPress={() => onSelectDay(date)}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayButton,
                    isSelected && { borderWidth: 2, borderColor: WHERING_LIME, backgroundColor: WHERING_LIME + "26" },
                    !isSelected && isToday && { borderWidth: 2, borderColor: calendarColors.todayBorder },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dayText,
                      { color: isSelected ? WHERING_LIME_TEXT : outside ? calendarColors.outsideText : calendarColors.text },
                      disabled && { opacity: 0.4 },
                    ]}
                  >
                    {date.getDate()}
                  </ThemedText>
                  {hasWear && <View style={styles.wearDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
