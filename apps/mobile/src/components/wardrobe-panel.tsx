import { useEffect, useState } from "react";
import { deleteClothingItem, fetchClothingItems, insertClothingItem, type DbClothingItem } from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";
import { useThemeMode } from "@/lib/theme-context";

// Kategori Bazlı Tasarım Farklılaştırma (bkz. CLAUDE.md bölüm 9) — Stil &
// Giyim'in mobil karşılığı, Bölüm 1: SADECE Gardırobum. Whering'in neon
// lime kimliği (sabit renkler, mobil tema sisteminden bağımsız). **Bilinçli
// kapsam sınırlaması (web'in "Gardırobum/Kombin Oluştur/Kombinlerim/AI
// Stilist/Stil Takvimi/Seyahat Paketleme" 6 alt-özelliğinden SADECE biri):**
// Kombin Oluştur (sürükle-bırak + AI puanlama), Kombinlerim, AI Stilist
// (hava durumu entegrasyonu), Stil Takvimi (takvim UI) ve Seyahat
// Paketleme KASITLI OLARAK ERTELENDİ — her biri kendi başına ayrı bir
// tur gerektirecek kadar büyük. Bu turda mobile YENİ eklenen bağımlılıklar:
// `expo-image-picker` (fotoğraf seçimi — mobilde İLK KEZ kullanılıyor),
// `base64-arraybuffer` (Supabase Storage'a RN'den yükleme için standart
// desen — `fetch().blob()` RN'de local file:// URI'lerde güvenilir değil).
export const WHERING_LIME = "#d4ff00";
export const WHERING_LIME_TEXT = "#141400";

// Kritik düzeltme (2026-09-03, madde 3) — zemin sabit/tek moda kilitliydi
// (web'in bu turda düzeltilen 6 kategorisiyle AYNI hata sınıfı, bkz.
// CLAUDE.md "Kategori Temaları" kritik düzeltme notu). Artık genel site
// temasına göre (koyu/açık) iki varyant arasında geçiş yapıyor — lime
// vurgu (WHERING_LIME) HER İKİ modda da aynı. Style & Giyim'in diğer
// dosyaları (outfit-gallery-panel.tsx, style-calendar-panel.tsx) da bu
// fonksiyonu yeniden kullanıyor.
export function getWheringTheme(isDark: boolean) {
  return isDark
    ? { bg: "#0a0a0a", elevated: "#1c1c1c", border: "#2a2a2a", text: "#f5f5f5", muted: "#9a9a9a" }
    : { bg: "#fafafa", elevated: "#f0f0f0", border: "#e4e4e7", text: "#141414", muted: "#6b6b6b" };
}

const BUCKET = "clothing-photos";
const SIGNED_URL_TTL_SECONDS = 3600;

export function WardrobePanel({ categoryId }: { categoryId: string }) {
  const whering = getWheringTheme(useThemeMode().theme === "dark");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DbClothingItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPhotoUrls(entries: { id: string; path: string }[]) {
    const urls: Record<string, string> = {};
    for (const { id, path } of entries) {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (data?.signedUrl) urls[id] = data.signedUrl;
    }
    setPhotoUrls((prev) => ({ ...prev, ...urls }));
  }

  async function load() {
    try {
      const rows = await fetchClothingItems(supabase, categoryId);
      setItems(rows);
      await loadPhotoUrls(rows.map((i) => ({ id: i.id, path: i.photo_path })));
    } catch (err) {
      console.error("Gardırop yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handlePickPhoto() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Fotoğraf seçmek için galeri izni gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setError("Fotoğraf okunamadı.");
      return;
    }
    const mediaType = asset.mimeType ?? "image/jpeg";

    setAnalyzing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/clothing-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ imageBase64: asset.base64, mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analiz başarısız oldu.");

      const ext = mediaType.split("/")[1] ?? "jpg";
      const path = `${user.id}/${Date.now()}-mobil.${ext}`;
      const upload = await supabase.storage.from(BUCKET).upload(path, decode(asset.base64), { contentType: mediaType });
      if (upload.error) throw new Error("Fotoğraf yüklenemedi: " + upload.error.message);

      const created = await insertClothingItem(supabase, user.id, categoryId, {
        photoPath: path,
        photoMime: mediaType,
        aiLabel: json.label ?? "Parça",
        category: json.category ?? null,
        color: json.color ?? null,
        season: json.season ?? null,
        formality: json.formality ?? null,
      });
      setItems((prev) => [created, ...prev]);
      await loadPhotoUrls([{ id: created.id, path }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz başarısız oldu.");
    }
    setAnalyzing(false);
  }

  function confirmDelete(item: DbClothingItem) {
    Alert.alert("Parçayı sil", `"${item.ai_label}" gardıroptan silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          await supabase.storage.from(BUCKET).remove([item.photo_path]);
          await deleteClothingItem(supabase, item.id);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: whering.bg }]}>
        <ActivityIndicator color={WHERING_LIME} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#0a0a0a" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <ThemedText style={{ fontSize: 15, fontWeight: "700", color: whering.text, fontStyle: "italic" }}>01 Gardırobum</ThemedText>
      </View>

      <Pressable onPress={handlePickPhoto} disabled={analyzing} style={[styles.uploadButton, { backgroundColor: WHERING_LIME, opacity: analyzing ? 0.6 : 1 }]}>
        {analyzing ? (
          <ActivityIndicator color={WHERING_LIME_TEXT} size="small" />
        ) : (
          <>
            <MaterialCommunityIcons name="camera-plus-outline" size={16} color={WHERING_LIME_TEXT} />
            <ThemedText style={{ color: WHERING_LIME_TEXT, fontWeight: "700", fontSize: 13 }}>Parça Fotoğrafı Yükle</ThemedText>
          </>
        )}
      </Pressable>
      {error && <ThemedText style={{ color: "#f87171", fontSize: 12 }}>{error}</ThemedText>}

      {items.length === 0 ? (
        <ThemedText style={{ color: whering.muted, fontSize: 12 }}>Henüz bir parça eklemedin.</ThemedText>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <Pressable key={item.id} onLongPress={() => confirmDelete(item)} style={styles.gridItem}>
              {photoUrls[item.id] ? (
                <Image source={{ uri: photoUrls[item.id] }} style={styles.gridImage} accessibilityLabel={item.ai_label} />
              ) : (
                <View style={[styles.gridImage, { alignItems: "center", justifyContent: "center", backgroundColor: whering.elevated }]}>
                  <ActivityIndicator size="small" color={WHERING_LIME} />
                </View>
              )}
              <ThemedText numberOfLines={1} style={{ color: whering.text, fontSize: 10, marginTop: 4 }}>
                {item.ai_label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, borderRadius: 12, padding: 14 },
  uploadButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "30%" },
  gridImage: { width: "100%", aspectRatio: 1, borderRadius: 10 },
});
