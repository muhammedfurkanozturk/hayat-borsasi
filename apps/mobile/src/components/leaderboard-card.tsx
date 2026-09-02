import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import type { ThemeColors } from "@/constants/theme";

const MONTH_FORMATTER = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

function currentMonthRangeLabel() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${MONTH_FORMATTER.format(start)} – ${MONTH_FORMATTER.format(end)}`;
}

// Web'in src/components/karakter/LeaderboardCard.tsx'inin RN portu — bkz.
// oradaki dürüstlük notu: proje henüz gerçek çok-kullanıcılı değil, başka
// kullanıcılar için UYDURMA isim/skor YOK. Gerçek kullanıcı kendi gerçek
// verisiyle #1 gösteriliyor, kalan sıralar (#2-#4) iskelet/kesikli
// placeholder. Görünürlük aç/kapa kontrolü YOK (web'deki aynı gerekçeyle —
// gizleyecek başka kullanıcı yok, çok-kullanıcı gelince eklenecek).
export function LeaderboardCard({
  currentUser,
}: {
  currentUser: { name: string; initial: string; score: number; tierLabel: string; tierColor: string };
}) {
  const theme = useTheme();
  const monthLabel = useMemo(() => currentMonthRangeLabel(), []);

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <View>
        <ThemedText style={styles.title}>Aylık Sıralama</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {monthLabel}
        </ThemedText>
      </View>

      <View style={styles.podiumRow}>
        <PodiumSlot rank={2} empty theme={theme} />
        <PodiumSlot
          rank={1}
          name={currentUser.name}
          initial={currentUser.initial}
          score={currentUser.score}
          tierLabel={currentUser.tierLabel}
          tierColor={currentUser.tierColor}
          theme={theme}
        />
        <PodiumSlot rank={3} empty theme={theme} />
      </View>

      <View style={[styles.list, { borderColor: theme.border }]}>
        <View style={[styles.row, { borderBottomColor: theme.border }]}>
          <View style={styles.rowLeft}>
            <ThemedText style={[styles.rank, { color: theme.accent }]}>#1</ThemedText>
            <View style={[styles.avatarSmall, { backgroundColor: theme.accent }]}>
              <ThemedText style={styles.avatarSmallText}>{currentUser.initial}</ThemedText>
            </View>
            <View>
              <ThemedText style={styles.rowName}>{currentUser.name}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.rowTier}>
                {currentUser.tierLabel} Tier
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.rowScore}>{Math.round(currentUser.score)}</ThemedText>
        </View>

        {[2, 3, 4].map((rank) => (
          <View key={rank} style={[styles.row, styles.rowGhost, { borderBottomColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <ThemedText themeColor="textSecondary" style={styles.rank}>
                #{rank}
              </ThemedText>
              <View style={[styles.avatarSmall, styles.avatarGhost, { borderColor: theme.textSecondary }]} />
              <ThemedText themeColor="textSecondary" style={styles.rowName}>
                Henüz kimse yok
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      <ThemedText themeColor="textSecondary" style={styles.footnote}>
        Diğer kullanıcılar katıldıkça burada sıralanacak — skorun varsayılan olarak herkese açık görünür.
      </ThemedText>
    </View>
  );
}

function PodiumSlot({
  rank,
  name,
  initial,
  score,
  tierLabel,
  tierColor,
  empty = false,
  theme,
}: {
  rank: 1 | 2 | 3;
  name?: string;
  initial?: string;
  score?: number;
  tierLabel?: string;
  tierColor?: string;
  empty?: boolean;
  theme: ThemeColors;
}) {
  const barHeight = rank === 1 ? 88 : 56;
  const accentColor = tierColor ?? theme.accent;

  return (
    <View style={styles.podiumSlot}>
      {empty ? (
        <View style={[styles.podiumAvatar, styles.podiumAvatarGhost, { borderColor: theme.textSecondary + "55" }]}>
          <ThemedText themeColor="textSecondary" style={styles.podiumQuestion}>
            ?
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.podiumAvatar, { backgroundColor: theme.accent, borderColor: accentColor }]}>
          <ThemedText style={styles.podiumAvatarText}>{initial}</ThemedText>
        </View>
      )}
      <ThemedText numberOfLines={1} style={styles.podiumName}>
        {empty ? "—" : name}
      </ThemedText>
      {!empty && tierLabel ? (
        <ThemedText themeColor="textSecondary" style={styles.podiumTier}>
          {tierLabel}
        </ThemedText>
      ) : (
        <View style={styles.podiumTierSpacer} />
      )}
      <View
        style={[
          styles.podiumBar,
          { height: barHeight },
          empty
            ? { borderColor: theme.border, borderStyle: "dashed", backgroundColor: "transparent" }
            : { borderColor: accentColor + "66", backgroundColor: theme.accent + "1a" },
        ]}
      >
        <ThemedText style={[styles.podiumScore, { color: empty ? theme.textSecondary : accentColor }]}>
          {empty ? "" : Math.round(score ?? 0)}
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" style={styles.podiumRank}>
        #{rank}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 16 },
  title: { fontSize: 14, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  podiumRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  podiumSlot: { flex: 1, alignItems: "center", gap: 5 },
  podiumAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  podiumAvatarGhost: { borderStyle: "dashed", backgroundColor: "transparent" },
  podiumAvatarText: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
  podiumQuestion: { fontSize: 12 },
  podiumName: { fontSize: 11, fontWeight: "600", maxWidth: "100%" },
  podiumTier: { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  podiumTierSpacer: { height: 12 },
  podiumBar: { width: "100%", borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  podiumScore: { fontSize: 16, fontWeight: "800" },
  podiumRank: { fontSize: 11 },
  list: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rowGhost: { opacity: 0.4 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  rank: { width: 20, textAlign: "center", fontSize: 13, fontWeight: "700" },
  avatarSmall: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarGhost: { borderWidth: 1, borderStyle: "dashed", backgroundColor: "transparent" },
  avatarSmallText: { fontSize: 12, fontWeight: "700", color: "#ffffff" },
  rowName: { fontSize: 13, fontWeight: "600" },
  rowTier: { fontSize: 11, marginTop: 1 },
  rowScore: { fontSize: 13, fontWeight: "700" },
  footnote: { fontSize: 11, lineHeight: 16 },
});
