import { useEffect, useState } from "react";
import {
  deleteOutfitWear,
  fetchOutfitWears,
  fetchOutfits,
  insertOutfitWear,
  type DbOutfit,
  type DbOutfitWear,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";
import { StyleCalendar } from "@/components/style-calendar";
import { ThemedText } from "@/components/themed-text";
import { getWheringTheme, WHERING_LIME } from "@/components/wardrobe-panel";
import { supabase } from "@/lib/supabase/client";
import { useThemeMode } from "@/lib/theme-context";

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Stil & Giyim'in Seviye 2 "Takvim" route'u (bkz. CLAUDE.md bölüm 9) —
// web'in Acloset'ten ilham "Stil Takvimi"nin (StyleCalendarPanel.tsx) RN
// portu. AI'a bağımlı DEĞİL (sadece outfit_wears verisini bir takvimde
// tarıyor) — bu yüzden diğer deploy-bloklu AI özelliklerinin (Kombin
// Oluştur'un AI puanlaması, AI Stilist) aksine tamamen çalışır durumda.
// `insertOutfitWear`/`deleteOutfitWear` zaten keyfi bir tarih alıyordu
// (Kombinlerim'in "Bugün Giydim"iyle AYNI fonksiyonlar) — yeni bir
// migration/sütun gerekmedi, sadece UI eklendi.
export function StyleCalendarPanel({ categoryId }: { categoryId: string }) {
  const whering = getWheringTheme(useThemeMode().theme === "dark");
  const [loading, setLoading] = useState(true);
  const [outfits, setOutfits] = useState<DbOutfit[]>([]);
  const [outfitWears, setOutfitWears] = useState<DbOutfitWear[]>([]);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      const outfitRows = await fetchOutfits(supabase, categoryId);
      setOutfits(outfitRows);
      const wears = await fetchOutfitWears(
        supabase,
        outfitRows.map((o) => o.id)
      );
      setOutfitWears(wears);
    } catch (err) {
      console.error("Stil takvimi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleLogWear(outfitId: string, date: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setAdding(true);
    const created = await insertOutfitWear(supabase, user.id, outfitId, date);
    setOutfitWears((prev) => [created, ...prev]);
    setAdding(false);
  }

  async function handleDeleteWear(wear: DbOutfitWear) {
    setOutfitWears((prev) => prev.filter((w) => w.id !== wear.id));
    await deleteOutfitWear(supabase, wear.id);
  }

  if (loading) {
    return (
      <View style={{ padding: 14, alignItems: "center" }}>
        <ActivityIndicator color={WHERING_LIME} />
      </View>
    );
  }

  const daysWithWear = new Set(outfitWears.map((w) => w.date));
  const selectedIso = selected ? toIso(selected) : null;
  const selectedWears = selectedIso ? outfitWears.filter((w) => w.date === selectedIso) : [];
  const wornOutfitIds = new Set(selectedWears.map((w) => w.outfit_id));
  const availableOutfits = outfits.filter((o) => !wornOutfitIds.has(o.id));

  return (
    <View style={{ gap: 16, padding: 14 }}>
      <ThemedText style={{ fontSize: 15, fontWeight: "700", color: whering.text, fontStyle: "italic" }}>
        05 Stil Takvimi
      </ThemedText>

      {outfits.length === 0 ? (
        <ThemedText style={{ color: whering.muted, fontSize: 12 }}>
          {"Takvime kaydetmek için önce en az bir kombin oluştur (web'de “Kombin Oluştur” ile)."}
        </ThemedText>
      ) : (
        <>
          <StyleCalendar month={month} onMonthChange={setMonth} selected={selected} onSelectDay={setSelected} daysWithWear={daysWithWear} />

          {!selected ? (
            <ThemedText style={{ color: whering.muted, fontSize: 12 }}>Bir gün seç, o gün ne giydiğini kaydet veya gör.</ThemedText>
          ) : (
            <View style={{ gap: 10 }}>
              <ThemedText style={{ color: whering.text, fontSize: 13, fontWeight: "600" }}>
                {selected.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </ThemedText>

              {selectedWears.length > 0 && (
                <View style={{ gap: 6 }}>
                  {selectedWears.map((wear) => {
                    const outfit = outfits.find((o) => o.id === wear.outfit_id);
                    if (!outfit) return null;
                    return (
                      <View
                        key={wear.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderWidth: 1,
                          borderColor: whering.border,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <ThemedText style={{ color: whering.text, fontSize: 12 }}>{outfit.name || "İsimsiz kombin"}</ThemedText>
                        <Pressable onPress={() => handleDeleteWear(wear)} hitSlop={8}>
                          <MaterialCommunityIcons name="trash-can-outline" size={15} color={whering.muted} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              {availableOutfits.length > 0 && (
                <View style={{ gap: 6 }}>
                  <ThemedText style={{ color: whering.muted, fontSize: 11 }}>Bir kombin ekle:</ThemedText>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {availableOutfits.map((outfit) => (
                      <Pressable
                        key={outfit.id}
                        disabled={adding}
                        onPress={() => handleLogWear(outfit.id, selectedIso!)}
                        style={{
                          borderWidth: 2,
                          borderColor: WHERING_LIME + "4d",
                          borderRadius: 999,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          opacity: adding ? 0.5 : 1,
                        }}
                      >
                        <ThemedText style={{ color: WHERING_LIME, fontSize: 11, fontWeight: "600" }}>
                          {outfit.name || "İsimsiz kombin"}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}
