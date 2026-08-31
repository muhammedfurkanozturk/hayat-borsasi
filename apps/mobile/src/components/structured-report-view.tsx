import { parseStructuredReport, type ReportTone } from "@hayat-borsasi/shared";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

const TONE_ICON: Record<ReportTone, keyof typeof Feather.glyphMap> = {
  pozitif: "check-circle",
  notr: "info",
  uyari: "alert-triangle",
  negatif: "x-circle",
};

// Web'deki StructuredReportView.tsx'teki ReportSectionBody ile aynı mantık
// — "- " ile başlayan satırlar madde listesi, ardışık düz satırlar
// paragraf olarak gruplanır (Claude bazen ikisini karıştırıyor).
function ReportSectionBody({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];

  for (const line of lines) {
    const isBullet = line.trim().startsWith("- ");
    const type = isBullet ? "ul" : "p";
    const content = isBullet ? line.trim().replace(/^- /, "") : line.trim();
    const last = blocks[blocks.length - 1];
    if (last && last.type === type) {
      last.lines.push(content);
    } else {
      blocks.push({ type, lines: [content] });
    }
  }

  return (
    <View style={{ gap: 4 }}>
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <View key={i} style={{ gap: 2 }}>
            {block.lines.map((line, j) => (
              <ThemedText key={j} style={styles.sectionBody}>
                {"•  "}
                {line}
              </ThemedText>
            ))}
          </View>
        ) : (
          <ThemedText key={i} style={styles.sectionBody}>
            {block.lines.join(" ")}
          </ThemedText>
        )
      )}
    </View>
  );
}

// Web'deki StructuredReportView.tsx'in RN karşılığı — aynı
// parseStructuredReport'u (packages/shared/src/report.ts) kullanıyor, tek
// doğruluk kaynağı orada. `content` geçerli JSON değilse (eski düz-metin
// kayıtlar) sessizce eski paragraf görünümüne düşer.
export function StructuredReportView({ content }: { content: string }) {
  const theme = useTheme();
  const structured = parseStructuredReport(content);

  if (!structured) {
    return <ThemedText style={styles.plainText}>{content}</ThemedText>;
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.summary}>{structured.durum_ozeti}</ThemedText>
      {structured.bolumler.map((bolum, i) => {
        // Mobil tema paletinde ayrı bir "pro/uyarı" rengi tanımlı değil,
        // web'deki --pro token'ıyla (#f5b400) aynı sabit değeri kullanıyoruz.
        const toneColor =
          bolum.ton === "pozitif" ? theme.positive : bolum.ton === "negatif" ? theme.negative : bolum.ton === "uyari" ? "#f5b400" : theme.textSecondary;

        return (
          <View
            key={i}
            style={[styles.section, { borderLeftColor: toneColor, backgroundColor: theme.backgroundSelected }]}
          >
            <View style={styles.sectionHeader}>
              <Feather name={TONE_ICON[bolum.ton] ?? "info"} size={13} color={toneColor} />
              <ThemedText style={[styles.sectionTitle, { color: toneColor }]}>{bolum.baslik}</ThemedText>
            </View>
            <ReportSectionBody text={bolum.icerik} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  plainText: { fontSize: 13, lineHeight: 20 },
  summary: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  section: { borderLeftWidth: 3, borderRadius: 10, padding: 12, gap: 6 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  sectionBody: { fontSize: 13, lineHeight: 19 },
});
