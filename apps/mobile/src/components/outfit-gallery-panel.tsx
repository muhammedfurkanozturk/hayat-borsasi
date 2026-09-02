import { useEffect, useState } from "react";
import {
  deleteOutfit,
  fetchClothingItems,
  fetchOutfitWears,
  fetchOutfits,
  insertOutfitWear,
  todayIso,
  type DbClothingItem,
  type DbOutfit,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Image, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { WHERING_LIME } from "@/components/wardrobe-panel";
import { supabase } from "@/lib/supabase/client";

const BUCKET = "clothing-photos";
const SIGNED_URL_TTL_SECONDS = 3600;

// Stil & Giyim'in Seviye 2 "Kombinlerim" route'u (bkz. CLAUDE.md bölüm 9)
// — web'in WardrobePanel.tsx'teki "03 Kombinlerim" bölümünün (kaydedilmiş
// kombinler, Indyx'ten ilham cost-per-wear/"Bugün Giydim" fikri) RN portu.
// Gardırobum'un (wardrobe-panel.tsx) AYNI signed-URL yükleme deseni
// kullanılıyor — kendi verisini kendi yüklüyor (nutrition su/oruç/kalori
// route'larıyla AYNI mimari desen). **Bilinçli kapsam sınırlaması:** Kombin
// Oluştur (sürükle-bırak+AI puanlama), AI Stilist, Stil Takvimi, Seyahat
// Paketleme hâlâ ERTELENMİŞ — sadece zaten kaydedilmiş kombinleri listeleme
// + "Bugün Giydim" işaretleme taşındı, yeni kombin oluşturma akışı YOK.
export function OutfitGalleryPanel({ categoryId }: { categoryId: string }) {
  const [loading, setLoading] = useState(true);
  const [outfits, setOutfits] = useState<DbOutfit[]>([]);
  const [items, setItems] = useState<DbClothingItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [wearCounts, setWearCounts] = useState<Map<string, number>>(new Map());

  async function load() {
    try {
      const [outfitRows, itemRows] = await Promise.all([
        fetchOutfits(supabase, categoryId),
        fetchClothingItems(supabase, categoryId),
      ]);
      setOutfits(outfitRows);
      setItems(itemRows);

      const urls: Record<string, string> = {};
      for (const item of itemRows) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(item.photo_path, SIGNED_URL_TTL_SECONDS);
        if (data?.signedUrl) urls[item.id] = data.signedUrl;
      }
      setPhotoUrls(urls);

      const wears = await fetchOutfitWears(
        supabase,
        outfitRows.map((o) => o.id)
      );
      const counts = new Map<string, number>();
      for (const wear of wears) counts.set(wear.outfit_id, (counts.get(wear.outfit_id) ?? 0) + 1);
      setWearCounts(counts);
    } catch (err) {
      console.error("Kombinler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleMarkWorn(outfit: DbOutfit) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await insertOutfitWear(supabase, user.id, outfit.id, todayIso());
    setWearCounts((prev) => new Map(prev).set(outfit.id, (prev.get(outfit.id) ?? 0) + 1));
  }

  function confirmDelete(outfit: DbOutfit) {
    Alert.alert("Kombini sil", `"${outfit.name}" kombini silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setOutfits((prev) => prev.filter((o) => o.id !== outfit.id));
          await deleteOutfit(supabase, outfit.id);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={{ padding: 14, alignItems: "center" }}>
        <ActivityIndicator color={WHERING_LIME} />
      </View>
    );
  }

  return (
    <View style={{ gap: 12, padding: 14 }}>
      <ThemedText style={{ fontSize: 15, fontWeight: "700", color: "#f5f5f5", fontStyle: "italic" }}>
        03 Kombinlerim
      </ThemedText>

      {outfits.length === 0 ? (
        <ThemedText style={{ color: "#9a9a9a", fontSize: 12 }}>
          {"Henüz kaydedilmiş bir kombinin yok — bu akış mobilde henüz yok, web'de “Kombin Oluştur” ile oluşturduklarınız burada listelenecek."}
        </ThemedText>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {outfits.map((outfit) => {
            const outfitItems = outfit.item_ids
              .map((id) => items.find((i) => i.id === id))
              .filter((i): i is DbClothingItem => Boolean(i));
            const wearCount = wearCounts.get(outfit.id) ?? 0;
            return (
              <Pressable
                key={outfit.id}
                onLongPress={() => confirmDelete(outfit)}
                style={{ width: "47%", gap: 8, borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 12, padding: 10, backgroundColor: "#141414" }}
              >
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {outfitItems.slice(0, 4).map((item) =>
                    photoUrls[item.id] ? (
                      <Image
                        key={item.id}
                        source={{ uri: photoUrls[item.id] }}
                        accessibilityLabel={item.ai_label}
                        style={{ flex: 1, aspectRatio: 3 / 4, borderRadius: 8 }}
                      />
                    ) : (
                      <View key={item.id} style={{ flex: 1, aspectRatio: 3 / 4, borderRadius: 8, backgroundColor: "#1c1c1c" }} />
                    )
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ borderWidth: 1, borderColor: WHERING_LIME + "80", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <ThemedText style={{ color: WHERING_LIME, fontSize: 11, fontWeight: "700" }}>
                      {outfit.ai_score != null ? `${outfit.ai_score}/10` : "—"}
                    </ThemedText>
                  </View>
                </View>
                {outfit.ai_comment ? (
                  <ThemedText numberOfLines={3} style={{ color: "#9a9a9a", fontSize: 11 }}>
                    {outfit.ai_comment}
                  </ThemedText>
                ) : null}
                <Pressable
                  onPress={() => handleMarkWorn(outfit)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 8, paddingVertical: 7 }}
                >
                  <MaterialCommunityIcons name="check" size={12} color="#9a9a9a" />
                  <ThemedText style={{ color: "#9a9a9a", fontSize: 11, fontWeight: "600" }}>
                    Bugün Giydim{wearCount > 0 ? ` · ${wearCount}` : ""}
                  </ThemedText>
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
