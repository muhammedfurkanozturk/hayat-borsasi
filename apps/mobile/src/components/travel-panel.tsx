import { useEffect, useMemo, useState } from "react";
import { fetchTravelVisits, toggleTravelVisit, TURKEY_PROVINCES, turkeyProvinceRefCode, type DbTravelVisit } from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ALPHA2_TO_TURKISH_NAME } from "@/lib/travel/world-country-codes";
import { supabase } from "@/lib/supabase/client";

// Kategori Bazlı Tasarım Farklılaştırma (bkz. CLAUDE.md bölüm 9) — Seyahat'in
// mobil karşılığı, SON kategori. Polarsteps'in koyu lacivert + teal/pembe-
// kırmızı kimliği (sabit renkler). **En büyük mimari basitleştirme bu
// turda burada:** web'in `react-simple-maps` (SVG/DOM-only) tabanlı dünya
// haritası + Türkiye il haritası RN'de HİÇ çalışmıyor — canvas/SVG harita
// kütüphanesi eklemek yerine (react-native-svg + gerçek ülke/il poligon
// verisi, çok daha büyük bir iş) GERÇEK VERİYE dayalı, aranabilir bir LİSTE
// görünümüne indirgendi (Yol Haritam'daki ağaç→liste basitleştirmesiyle
// AYNI felsefe). Veri modeli (travel_visits, level/ref_code) BİREBİR AYNI
// — web'de işaretlenen bir ülke burada da işaretli görünür ve tersi.
// Ülke isimleri `lib/travel/world-country-codes.ts`'te STATİK bir Türkçe
// isim haritası olarak tutuluyor (web'in `Intl.DisplayNames`'i çalışma
// anında kullanan versiyonundan BİLİNÇLİ OLARAK farklı — bkz. o dosyadaki
// yorum, bu ortamdaki Hermes'te `Intl.DisplayNames` yok, uygulamayı
// çökertiyordu).
// **Bilinçli kapsam dışı bırakılan:** ilçe seviyesi (Level 3) ve "mekan"
// (Level 4) — sadece ülke (Level 1) ve Türkiye illeri (Level 2) taşındı.
const POLARSTEPS = {
  bg: "#0d1b2a",
  surface: "#152a3d",
  elevated: "#1c3650",
  border: "rgba(255,255,255,0.12)",
  text: "#f2f6f9",
  muted: "#8fa3b3",
  accent: "#2dd4bf",
  negative: "#e91e63",
};

const TURKEY_REF_CODE = "TR";

interface CountryRow {
  refCode: string;
  name: string;
}

export function TravelPanel({ categoryId }: { categoryId: string }) {
  const [view, setView] = useState<"world" | "turkey">("world");
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<DbTravelVisit[]>([]);
  const [query, setQuery] = useState("");
  const [selectedRefCode, setSelectedRefCode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const rows = await fetchTravelVisits(supabase, categoryId);
      setVisits(rows);
    } catch (err) {
      console.error("Seyahat verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const worldCountries = useMemo<CountryRow[]>(() => {
    const rows = Object.entries(ALPHA2_TO_TURKISH_NAME).map(([alpha2, name]) => ({ refCode: alpha2, name }));
    return rows.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, []);

  const turkeyRows = useMemo<CountryRow[]>(
    () =>
      TURKEY_PROVINCES.map((p) => ({ refCode: turkeyProvinceRefCode(p.plateCode), name: p.name })).sort((a, b) =>
        a.name.localeCompare(b.name, "tr")
      ),
    []
  );

  const activeLevel = view === "world" ? "country" : "province";
  const activeRows = view === "world" ? worldCountries : turkeyRows;
  const visitByRefCode = new Map(visits.filter((v) => v.level === activeLevel).map((v) => [v.ref_code, v]));

  const filteredRows = query.trim()
    ? activeRows.filter((r) => r.name.toLocaleLowerCase("tr").includes(query.trim().toLocaleLowerCase("tr")))
    : activeRows;

  const visitedCount = activeRows.filter((r) => visitByRefCode.has(r.refCode)).length;

  async function handleRowPress(row: CountryRow) {
    const existing = visitByRefCode.get(row.refCode);
    if (existing) {
      setSelectedRefCode(row.refCode);
      setNote(existing.note ?? "");
      return;
    }
    try {
      await toggleTravelVisit(supabase, categoryId, activeLevel, row.refCode, null);
      await load();
    } catch (err) {
      console.error("Ziyaret eklenemedi:", err);
    }
  }

  async function handleRemoveVisit(row: CountryRow) {
    const existing = visitByRefCode.get(row.refCode);
    if (!existing) return;
    setVisits((prev) => prev.filter((v) => v.id !== existing.id));
    setSelectedRefCode(null);
    await toggleTravelVisit(supabase, categoryId, activeLevel, row.refCode, existing.id);
  }

  async function handleSaveNote(row: CountryRow) {
    const existing = visitByRefCode.get(row.refCode);
    if (!existing) return;
    setSaving(true);
    const { error } = await supabase.from("travel_visits").update({ note }).eq("id", existing.id);
    if (!error) {
      setVisits((prev) => prev.map((v) => (v.id === existing.id ? { ...v, note } : v)));
      setSelectedRefCode(null);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: POLARSTEPS.bg }]}>
        <ActivityIndicator color={POLARSTEPS.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: POLARSTEPS.bg }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {view === "turkey" && (
            <Pressable onPress={() => setView("world")} hitSlop={8}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={POLARSTEPS.muted} />
            </Pressable>
          )}
          <ThemedText style={{ color: POLARSTEPS.text, fontSize: 15, fontWeight: "700" }}>
            {view === "world" ? "Dünya" : "Türkiye"}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: POLARSTEPS.accent + "26" }]}>
          <ThemedText style={{ color: POLARSTEPS.accent, fontSize: 11, fontWeight: "700" }}>
            {visitedCount}/{activeRows.length}
          </ThemedText>
        </View>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={view === "world" ? "Ülke ara..." : "İl ara..."}
        placeholderTextColor={POLARSTEPS.muted}
        style={[styles.input, { borderColor: POLARSTEPS.border, color: POLARSTEPS.text, backgroundColor: POLARSTEPS.elevated }]}
      />

      <View style={{ gap: 6 }}>
        {filteredRows.map((item) => {
          const visited = visitByRefCode.has(item.refCode);
          const isTurkeyFromWorld = view === "world" && item.refCode === TURKEY_REF_CODE;
          const isSelected = selectedRefCode === item.refCode;
          return (
            <View key={item.refCode}>
              <Pressable
                onPress={() => handleRowPress(item)}
                style={[
                  styles.row,
                  { borderColor: visited ? POLARSTEPS.accent : POLARSTEPS.border, backgroundColor: visited ? POLARSTEPS.accent + "1a" : "transparent" },
                ]}
              >
                <MaterialCommunityIcons
                  name={visited ? "check-circle" : "circle-outline"}
                  size={18}
                  color={visited ? POLARSTEPS.accent : POLARSTEPS.muted}
                />
                <ThemedText style={{ color: POLARSTEPS.text, fontSize: 13, flex: 1 }}>{item.name}</ThemedText>
              </Pressable>
              {isSelected && (
                <View style={[styles.detailBox, { borderColor: POLARSTEPS.accent + "4d", backgroundColor: POLARSTEPS.surface }]}>
                  {isTurkeyFromWorld && (
                    <Pressable onPress={() => setView("turkey")} style={[styles.primaryButton, { backgroundColor: POLARSTEPS.accent }]}>
                      <ThemedText style={{ color: "#04201c", fontWeight: "700", fontSize: 13 }}>Türkiye İllerini Gör →</ThemedText>
                    </Pressable>
                  )}
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Bu yerle ilgili kısa bir not..."
                    placeholderTextColor={POLARSTEPS.muted}
                    multiline
                    style={[styles.noteInput, { borderColor: POLARSTEPS.border, color: POLARSTEPS.text, backgroundColor: POLARSTEPS.elevated }]}
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => handleSaveNote(item)} disabled={saving} style={[styles.secondaryButton, { backgroundColor: POLARSTEPS.accent + "26", flex: 1 }]}>
                      <ThemedText style={{ color: POLARSTEPS.accent, fontWeight: "700", fontSize: 12 }}>{saving ? "Kaydediliyor..." : "Notu Kaydet"}</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        Alert.alert("Ziyareti kaldır", `"${item.name}" ziyaretini kaldırmak istiyor musun?`, [
                          { text: "Vazgeç", style: "cancel" },
                          { text: "Kaldır", style: "destructive", onPress: () => handleRemoveVisit(item) },
                        ])
                      }
                      style={[styles.secondaryButton, { borderWidth: 1, borderColor: POLARSTEPS.negative + "66" }]}
                    >
                      <ThemedText style={{ color: POLARSTEPS.negative, fontWeight: "700", fontSize: 12 }}>Ziyareti Kaldır</ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, borderRadius: 12, padding: 14 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  detailBox: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 4, gap: 8 },
  primaryButton: { height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  secondaryButton: { height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  noteInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, minHeight: 44 },
});
