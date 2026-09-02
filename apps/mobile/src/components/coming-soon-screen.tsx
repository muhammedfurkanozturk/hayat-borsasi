import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";

// Seviye 2'nin (bkz. CLAUDE.md bölüm 9) her kategoride "6 sekme, bazıları
// Yakında pasif" kararına göre kullanılan paylaşılan placeholder — mobilde
// henüz taşınmamış web alt-özellikleri için (AI-ağırlıklı veya
// grafik-ağırlıklı, ayrı turlarda ele alınacak). Sekme _layout.tsx'te
// ComingSoonTabButton ile zaten dokunulamaz yapıldığı için bu ekran normalde
// hiç açılmıyor, sadece route dosyası olarak var olması gerekiyor.
export function ComingSoonScreen({
  label,
  icon,
  backgroundColor = "#fafafa",
  textColor = "#71717a",
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor?: string;
  textColor?: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor, gap: 10, padding: 20 }}>
      <MaterialCommunityIcons name={icon} size={28} color={textColor} />
      <ThemedText style={{ color: textColor, fontSize: 13, textAlign: "center" }}>{label} mobilde yakında.</ThemedText>
    </View>
  );
}
