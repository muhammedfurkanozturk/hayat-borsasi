import { useEffect, useState } from "react";
import { fetchActiveFastingSession, startFasting, stopFasting, type DbFastingSession } from "@hayat-borsasi/shared";
import { useGlobalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";

// nutrition-panel.tsx'teki FastingTab'ın Seviye 2 route'una taşınmış hali
// (bkz. CLAUDE.md bölüm 9) — mantık DEĞİŞMEDİ, sadece kendi ekranı.
const YAZIO_TEAL = "#00c896";
const FASTING_PRESETS = [14, 16, 18, 20];

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function OrucTab() {
  const { categoryId } = useGlobalSearchParams<{ categoryId: string }>();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<DbFastingSession | null>(null);
  const [now, setNow] = useState(() => Date.now());

  async function load() {
    try {
      const row = await fetchActiveFastingSession(supabase, categoryId);
      setSession(row);
    } catch (err) {
      console.error("Oruç verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  async function handleStart(hours: number) {
    setStarting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await startFasting(supabase, user.id, categoryId, hours);
      setSession(created);
    }
    setStarting(false);
  }

  async function handleStop() {
    if (!session) return;
    await stopFasting(supabase, session.id);
    setSession(null);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa" }}>
        <ActivityIndicator color={YAZIO_TEAL} />
      </View>
    );
  }

  if (!session) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: "#fafafa" }]}>
        <ThemedText style={{ fontSize: 13, color: "#71717a" }}>Kaç saatlik oruç tutmak istiyorsun?</ThemedText>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {FASTING_PRESETS.map((h) => (
            <Pressable key={h} disabled={starting} onPress={() => handleStart(h)} style={[styles.waterButton, { borderColor: YAZIO_TEAL }]}>
              <ThemedText style={{ color: YAZIO_TEAL, fontWeight: "700", fontSize: 13 }}>{h} saat</ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  const elapsedMs = now - new Date(session.start_at).getTime();
  const targetMs = session.target_hours * 3600 * 1000;
  const remainingMs = Math.max(0, targetMs - elapsedMs);
  const progress = Math.min(1, elapsedMs / targetMs);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: "#fafafa", alignItems: "center" }]}>
      <ThemedText style={{ fontSize: 12, color: "#71717a" }}>Kalan süre</ThemedText>
      <ThemedText style={{ fontSize: 34, fontWeight: "800", color: "#27272a", fontVariant: ["tabular-nums"] }}>
        {formatDuration(remainingMs)}
      </ThemedText>
      <View style={[styles.progressTrack, { width: "100%" }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: YAZIO_TEAL }]} />
      </View>
      <Pressable onPress={handleStop} style={[styles.primaryButton, { backgroundColor: "#e91e63" }]}>
        <ThemedText style={{ color: "#ffffff", fontWeight: "700" }}>Orucu Bitir</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#e4e4e7", overflow: "hidden", width: "80%" },
  progressFill: { height: "100%", borderRadius: 999 },
  waterButton: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  primaryButton: { height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
});
