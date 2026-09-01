import { useEffect, useRef, useState } from "react";
import {
  calculateHabitSavings,
  calculateLockedInScore,
  calculateNextMilestone,
  calculateStreak,
  daysAgoIso,
  deleteHabitNote,
  deleteHabitReward,
  fetchHabitNotes,
  fetchHabitRewards,
  fetchRelapses,
  fetchTaskCompletionDates,
  fillDateRange,
  insertHabitNote,
  insertHabitReward,
  todayIso,
  unlockedMilestones,
  upsertRelapse,
  HABIT_MILESTONES_DAYS,
  type DbHabitNote,
  type DbHabitRelapse,
  type DbHabitReward,
  type HabitCostPeriod,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase/client";
import { useAppData, type Task } from "@/lib/app-data-context";

const GOLD = "#f5b400";

// "Kötü Alışkanlıklar" kategorisinin mobil karşılığı (web: HabitTrackerPanel.
// tsx + HabitBreakCard.tsx). Bu kategoride genel "Görev Ekle" yerine bu panel
// var — eklenen her şey otomatik olarak bir kötü alışkanlık (is_habit_break=
// true, günlük) sayılır. Streak/nüksetme/not/ödül/rozet mantığı web'le
// birebir aynı @hayat-borsasi/shared fonksiyonlarını kullanıyor.
export function HabitTrackerPanel({ categoryId, tasks }: { categoryId: string; tasks: Task[] }) {
  const theme = useTheme();
  const { addTask } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    await addTask(categoryId, name.trim(), 5, "daily", true);
    setName("");
    setSaving(false);
    setOpen(false);
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={[styles.addButton, { backgroundColor: theme.accent + "1a" }]}
        >
          <MaterialCommunityIcons name="plus" size={14} color={theme.accent} />
          <ThemedText themeColor="accent" style={styles.addButtonText}>
            Kötü Alışkanlık Ekle
          </ThemedText>
        </Pressable>
      </View>

      {open && (
        <View style={[styles.addForm, { borderColor: theme.border }]}>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="örn. Sigara"
            placeholderTextColor={theme.textSecondary}
            style={[styles.addFormInput, { borderColor: theme.border, color: theme.text }]}
            onSubmitEditing={handleSubmit}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={saving}
            style={[styles.addFormButton, { backgroundColor: theme.accent + "1a", opacity: saving ? 0.5 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color={theme.accent} size="small" />
            ) : (
              <ThemedText themeColor="accent" style={styles.addButtonText}>
                Ekle
              </ThemedText>
            )}
          </Pressable>
        </View>
      )}

      {tasks.length === 0 ? (
        <ThemedText themeColor="textSecondary" style={styles.emptyText}>
          Henüz bir kötü alışkanlık eklemedin.
        </ThemedText>
      ) : (
        <View style={{ gap: 10 }}>
          {tasks.map((task) => (
            <HabitCard key={task.id} task={task} />
          ))}
        </View>
      )}
    </View>
  );
}

// 120 günden uzun süredir takip edilen alışkanlıklarda "en uzun seri"nin
// pencere dışı kalmaması için (web'deki STREAK_WINDOW_DAYS ile aynı, bkz.
// HabitBreakCard.tsx) 5 yıl.
const STREAK_WINDOW_DAYS = 1825;

function HabitCard({ task }: { task: Task }) {
  const theme = useTheme();
  const { toggleTask, changeHabitCost } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [relapses, setRelapses] = useState<DbHabitRelapse[]>([]);
  const [notes, setNotes] = useState<DbHabitNote[]>([]);
  const [relapseNote, setRelapseNote] = useState("");
  const [loggingRelapse, setLoggingRelapse] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [rewards, setRewards] = useState<DbHabitReward[]>([]);
  const [costOpen, setCostOpen] = useState(false);
  const [costAmount, setCostAmount] = useState("");
  const [costPeriod, setCostPeriod] = useState<HabitCostPeriod>("week");
  const [savingCost, setSavingCost] = useState(false);

  const [urgeOpen, setUrgeOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const autoInsightRequestedRef = useRef(false);

  async function loadDetails() {
    const since = daysAgoIso(STREAK_WINDOW_DAYS);
    const [dates, relapseRows, noteRows, rewardRows] = await Promise.all([
      fetchTaskCompletionDates(supabase, task.id, since),
      fetchRelapses(supabase, task.id),
      fetchHabitNotes(supabase, task.id),
      fetchHabitRewards(supabase, task.id).catch((err) => {
        console.error("Ödül hedefleri yüklenemedi (migration uygulanmamış olabilir):", err);
        return [] as DbHabitReward[];
      }),
    ]);
    setStreak(calculateStreak(fillDateRange(dates, since, todayIso())));
    setRelapses(relapseRows);
    setNotes(noteRows);
    setRewards(rewardRows);
    setLoading(false);
  }

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  async function handleUsedToday() {
    setLoggingRelapse(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await upsertRelapse(supabase, user.id, task.id, todayIso(), relapseNote.trim());
      if (task.completed) await toggleTask(task.id);
      await loadDetails();
      setRelapseNote("");
    }
    setLoggingRelapse(false);
  }

  async function handleNotUsedToday() {
    if (task.completed) return;
    await toggleTask(task.id);
    await loadDetails();
  }

  const today = todayIso();
  const usedToday = relapses.some((r) => r.date === today);

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertHabitNote(supabase, user.id, task.id, newNote.trim());
      setNotes((prev) => [created, ...prev]);
      setNewNote("");
    }
    setSavingNote(false);
  }

  async function handleDeleteNote(noteId: string) {
    await deleteHabitNote(supabase, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function handleSaveCost() {
    setSavingCost(true);
    const amount = costAmount.trim() ? Number(costAmount) : null;
    await changeHabitCost(task.id, amount, amount != null ? costPeriod : null);
    setSavingCost(false);
    setCostOpen(false);
  }

  async function handleAddReward(title: string, targetAmount: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertHabitReward(supabase, user.id, task.id, title, targetAmount);
      setRewards((prev) => [...prev, created]);
    }
  }

  async function handleDeleteReward(rewardId: string) {
    await deleteHabitReward(supabase, rewardId);
    setRewards((prev) => prev.filter((r) => r.id !== rewardId));
  }

  // Deploy edilmiş web backend'ini çağırıyor — /api/rapor'daki AYNI Bearer
  // token + CORS deseni /api/habit-insight'a da eklendi (bkz. route.ts).
  // Bu, o düzeltme deploy edilene kadar mobilde 401 ile başarısız olur.
  async function handleRequestInsight() {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/habit-insight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          habitTitle: task.title,
          relapses: relapses.map((r) => ({ date: r.date, note: r.note_text || null })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "İçgörü alınamadı.");
      setInsight(json.insight);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : "İçgörü alınamadı.");
    }
    setInsightLoading(false);
  }

  const savings = calculateHabitSavings(task.habitCostAmount, task.habitCostPeriod, streak.current);
  const counterSince = relapses[0]?.created_at ?? task.createdAt;

  const relapsesLast30Days = relapses.filter((r) => r.date >= daysAgoIso(30)).length;
  const relapsesLast7Days = relapses.filter((r) => r.date >= daysAgoIso(7)).length;
  const lockedInScore = calculateLockedInScore(streak, relapsesLast30Days);
  const nextMilestone = calculateNextMilestone(streak.current);
  const improvementMode = relapsesLast7Days >= 2;

  useEffect(() => {
    if (improvementMode && expanded && !autoInsightRequestedRef.current && !loading) {
      autoInsightRequestedRef.current = true;
      void handleRequestInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [improvementMode, expanded, loading]);

  const lockedInColor = lockedInScore >= 70 ? theme.positive : lockedInScore >= 40 ? theme.textSecondary : theme.negative;

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.cardHeader}>
        <MaterialCommunityIcons name="fire" size={18} color={theme.accent} />
        <ThemedText style={{ flex: 1, fontSize: 14, fontWeight: "500" }}>{task.title}</ThemedText>
        {!loading && (
          <View style={styles.statusRow}>
            {task.completed ? (
              <ThemedText themeColor="positive" style={styles.statusText}>
                Bugün kullanmadın
              </ThemedText>
            ) : usedToday ? (
              <ThemedText themeColor="negative" style={styles.statusText}>
                Bugün kullandın
              </ThemedText>
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.statusText}>
                İşaretlenmedi
              </ThemedText>
            )}
          </View>
        )}
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>

      {!loading && (
        <View style={styles.statsRow}>
          <ThemedText themeColor="textSecondary" style={styles.statChip}>
            {streak.current} gün
          </ThemedText>
          <ThemedText style={[styles.statChip, { color: lockedInColor }]}>Kilitlenme: %{lockedInScore}</ThemedText>
        </View>
      )}

      {expanded && (
        <View style={[styles.cardBody, { borderTopColor: theme.border }]}>
          {improvementMode && (
            <View style={[styles.improvementBox, { borderColor: theme.accent + "4d", backgroundColor: theme.accent + "1a" }]}>
              <ThemedText themeColor="accent" style={styles.smallLabel}>
                Bu hafta biraz zorlanmış görünüyorsun — bugüne odaklan, seri sıfırdan başlar.
              </ThemedText>
              {insightLoading && (
                <ThemedText themeColor="textSecondary" style={styles.smallText}>
                  Koçun bir not hazırlıyor...
                </ThemedText>
              )}
              {insightError && (
                <ThemedText themeColor="negative" style={styles.smallText}>
                  {insightError}
                </ThemedText>
              )}
              {insight && !insightLoading && (
                <View style={[styles.insightBox, { borderColor: theme.accent + "66", backgroundColor: theme.background + "99" }]}>
                  <ThemedText style={styles.smallText}>{insight}</ThemedText>
                </View>
              )}
            </View>
          )}

          <View style={[styles.counterRow, { borderColor: theme.border }]}>
            <View>
              <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
                Temiz Süre
              </ThemedText>
              <PreciseCounter since={counterSince} />
            </View>
            <Pressable onPress={() => setUrgeOpen(true)} style={[styles.urgeButton, { backgroundColor: theme.accent }]}>
              <ThemedText style={styles.urgeButtonText}>İstek Hissediyorum</ThemedText>
            </Pressable>
          </View>

          {nextMilestone && (
            <View style={{ gap: 6 }}>
              <View style={styles.milestoneRow}>
                <ThemedText themeColor="textSecondary" style={styles.smallText}>
                  Sıradaki hedef: {nextMilestone.days} gün
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.smallText}>
                  {nextMilestone.daysRemaining} gün kaldı
                </ThemedText>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${nextMilestone.progressPct}%`, backgroundColor: theme.accent }]} />
              </View>
            </View>
          )}

          <HabitBadges longestStreak={streak.longest} />

          <View style={{ gap: 8 }}>
            <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
              Bugün ne oldu?
            </ThemedText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={handleNotUsedToday}
                disabled={task.completed}
                style={[styles.choiceButton, { borderColor: theme.positive + "4d", opacity: task.completed ? 0.5 : 1 }]}
              >
                <MaterialCommunityIcons name="check" size={14} color={theme.positive} />
                <ThemedText themeColor="positive" style={styles.choiceButtonText}>
                  Bugün Kullanmadım
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleUsedToday}
                disabled={loggingRelapse}
                style={[styles.choiceButton, { borderColor: theme.negative + "4d", opacity: loggingRelapse ? 0.5 : 1 }]}
              >
                {loggingRelapse ? (
                  <ActivityIndicator size="small" color={theme.negative} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="close" size={14} color={theme.negative} />
                    <ThemedText themeColor="negative" style={styles.choiceButtonText}>
                      Bugün Kullandım
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>
            <TextInput
              value={relapseNote}
              onChangeText={setRelapseNote}
              placeholder="Kullandıysan ne oldu, tetikleyici neydi? (opsiyonel)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
            />
            {relapses.length > 0 && (
              <ThemedText themeColor="textSecondary" style={styles.smallText}>
                Son nüksetme: {relapses[0].date}
                {relapses[0].note_text ? ` — "${relapses[0].note_text}"` : ""}
              </ThemedText>
            )}

            <Pressable
              onPress={handleRequestInsight}
              disabled={insightLoading}
              style={[styles.insightRequestButton, { borderColor: theme.border, opacity: insightLoading ? 0.5 : 1 }]}
            >
              <MaterialCommunityIcons name="lightbulb-on-outline" size={12} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary" style={styles.smallText}>
                {insightLoading ? "Düşünüyor..." : "AI'dan İçgörü İste"}
              </ThemedText>
            </Pressable>
            {insightError && !improvementMode && (
              <ThemedText themeColor="negative" style={styles.smallText}>
                {insightError}
              </ThemedText>
            )}
            {insight && !improvementMode && (
              <View style={[styles.insightBox, { borderColor: theme.accent + "66", backgroundColor: theme.accent + "1a" }]}>
                <ThemedText style={styles.smallText}>{insight}</ThemedText>
              </View>
            )}
          </View>

          <View style={[styles.savingsSection, { borderTopColor: theme.border }]}>
            <View style={styles.savingsHeader}>
              <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
                Tasarruf
              </ThemedText>
              <Pressable
                onPress={() => {
                  setCostAmount(task.habitCostAmount != null ? String(task.habitCostAmount) : "");
                  setCostPeriod(task.habitCostPeriod ?? "week");
                  setCostOpen((v) => !v);
                }}
              >
                <ThemedText themeColor="accent" style={styles.smallText}>
                  {task.habitCostAmount != null ? "Maliyeti Düzenle" : "Maliyet Gir"}
                </ThemedText>
              </Pressable>
            </View>

            {costOpen ? (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={costAmount}
                    onChangeText={setCostAmount}
                    placeholder="Maliyet (₺)"
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.textInput, { flex: 1, borderColor: theme.border, color: theme.text }]}
                  />
                  <View style={styles.periodRow}>
                    {(["day", "week", "month"] as HabitCostPeriod[]).map((p) => (
                      <Pressable
                        key={p}
                        onPress={() => setCostPeriod(p)}
                        style={[
                          styles.periodPill,
                          {
                            borderColor: costPeriod === p ? theme.accent : theme.border,
                            backgroundColor: costPeriod === p ? theme.accent + "1a" : "transparent",
                          },
                        ]}
                      >
                        <ThemedText themeColor={costPeriod === p ? "accent" : "textSecondary"} style={styles.periodPillText}>
                          {p === "day" ? "/gün" : p === "week" ? "/hafta" : "/ay"}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Pressable
                  onPress={handleSaveCost}
                  disabled={savingCost}
                  style={[styles.saveCostButton, { backgroundColor: theme.accent + "1a" }]}
                >
                  <ThemedText themeColor="accent" style={styles.addButtonText}>
                    {savingCost ? "Kaydediliyor..." : "Kaydet"}
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              task.habitCostAmount != null && (
                <ThemedText themeColor="positive" style={styles.savingsText}>
                  {savings.toFixed(0)} ₺ biriktirdin
                </ThemedText>
              )
            )}

            {task.habitCostAmount != null && (
              <HabitRewards rewards={rewards} currentSavings={savings} onAdd={handleAddReward} onDelete={handleDeleteReward} />
            )}
          </View>

          <View style={{ gap: 8 }}>
            <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
              Motivasyon Notların
            </ThemedText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Neden bırakıyorsun? Kendine bir not bırak..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.textInput, { flex: 1, borderColor: theme.border, color: theme.text }]}
              />
              <Pressable
                onPress={handleAddNote}
                disabled={savingNote || !newNote.trim()}
                style={[styles.addFormButton, { backgroundColor: theme.accent + "1a", opacity: newNote.trim() ? 1 : 0.5 }]}
              >
                <ThemedText themeColor="accent" style={styles.addButtonText}>
                  Ekle
                </ThemedText>
              </Pressable>
            </View>

            {notes.length === 0 ? (
              <ThemedText themeColor="textSecondary" style={styles.smallText}>
                Henüz not yok.
              </ThemedText>
            ) : (
              <View style={{ gap: 6 }}>
                {notes.map((note) => (
                  <View key={note.id} style={[styles.noteRow, { borderColor: theme.border, backgroundColor: theme.background }]}>
                    <ThemedText style={{ flex: 1, fontSize: 13 }}>{note.note_text}</ThemedText>
                    <Pressable hitSlop={8} onPress={() => handleDeleteNote(note.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={15} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      <UrgeReliefModal open={urgeOpen} onClose={() => setUrgeOpen(false)} notes={notes} />
    </View>
  );
}

const MILESTONE_LABELS: Record<number, string> = {
  1: "1 Gün",
  3: "3 Gün",
  7: "1 Hafta",
  14: "2 Hafta",
  30: "1 Ay",
  60: "2 Ay",
  90: "3 Ay",
  180: "6 Ay",
  365: "1 Yıl",
};

function HabitBadges({ longestStreak }: { longestStreak: number }) {
  const theme = useTheme();
  const unlocked = new Set(unlockedMilestones(longestStreak));

  return (
    <View style={styles.badgeRow}>
      {HABIT_MILESTONES_DAYS.map((d) => {
        const isUnlocked = unlocked.has(d);
        return (
          <View
            key={d}
            style={[
              styles.badge,
              {
                borderColor: isUnlocked ? GOLD + "80" : theme.border,
                backgroundColor: isUnlocked ? GOLD + "1f" : "transparent",
                opacity: isUnlocked ? 1 : 0.5,
              },
            ]}
          >
            <MaterialCommunityIcons name="trophy" size={10} color={isUnlocked ? GOLD : theme.textSecondary} />
            <ThemedText style={[styles.badgeText, { color: isUnlocked ? GOLD : theme.textSecondary }]}>
              {MILESTONE_LABELS[d]}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function HabitRewards({
  rewards,
  currentSavings,
  onAdd,
  onDelete,
}: {
  rewards: DbHabitReward[];
  currentSavings: number;
  onAdd: (title: string, targetAmount: number) => void;
  onDelete: (rewardId: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  function handleSubmit() {
    const targetNum = Number(target);
    if (!title.trim() || !(targetNum > 0)) return;
    onAdd(title.trim(), targetNum);
    setTitle("");
    setTarget("");
    setOpen(false);
  }

  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
        Ödül Hedeflerin
      </ThemedText>

      {rewards.map((reward) => {
        const achieved = currentSavings >= reward.target_amount;
        const progressPct = Math.min(100, (currentSavings / reward.target_amount) * 100);
        return (
          <View key={reward.id} style={[styles.rewardCard, { borderColor: theme.border }]}>
            <View style={styles.rewardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                {achieved && <MaterialCommunityIcons name="check" size={13} color={theme.positive} />}
                <ThemedText themeColor={achieved ? "positive" : "text"} style={{ fontSize: 13 }}>
                  {reward.title}
                </ThemedText>
              </View>
              <ThemedText themeColor="textSecondary" style={styles.smallText}>
                {reward.target_amount.toFixed(0)} ₺
              </ThemedText>
              <Pressable hitSlop={8} onPress={() => onDelete(reward.id)}>
                <MaterialCommunityIcons name="trash-can-outline" size={13} color={theme.textSecondary} />
              </Pressable>
            </View>
            {!achieved && (
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: theme.accent }]} />
              </View>
            )}
          </View>
        );
      })}

      {open ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            autoFocus
            value={title}
            onChangeText={setTitle}
            placeholder="Ödül, örn. Yeni kulaklık"
            placeholderTextColor={theme.textSecondary}
            style={[styles.textInput, { flex: 1, borderColor: theme.border, color: theme.text }]}
          />
          <TextInput
            value={target}
            onChangeText={setTarget}
            placeholder="Hedef ₺"
            keyboardType="decimal-pad"
            placeholderTextColor={theme.textSecondary}
            style={[styles.textInput, { width: 90, borderColor: theme.border, color: theme.text }]}
          />
          <Pressable onPress={handleSubmit} style={[styles.addFormButton, { backgroundColor: theme.accent + "1a" }]}>
            <ThemedText themeColor="accent" style={styles.addButtonText}>
              Ekle
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setOpen(true)} style={[styles.dashedButton, { borderColor: theme.border }]}>
          <MaterialCommunityIcons name="plus" size={12} color={theme.textSecondary} />
          <ThemedText themeColor="textSecondary" style={styles.smallText}>
            Ödül Hedefi Ekle
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

function formatPrecise(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}g ${hours}s ${minutes}d ${seconds}sn`;
}

function PreciseCounter({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - new Date(since).getTime();
  return <ThemedText style={styles.counterText}>{formatPrecise(elapsed)}</ThemedText>;
}

const BREATH_SECONDS = 4;

// Delust ilhamı (bkz. web'in UrgeReliefModal.tsx) — istek anında, nükseme
// olmadan ÖNCE kısa bir nefes egzersizi + kendi kayıtlı motivasyon
// notlarından biri. Web'de `motion/react` kullanıyordu, burada RN'in
// yerleşik Animated API'si (worklet/reanimated kurulumu gerekmiyor).
function UrgeReliefModal({ open, onClose, notes }: { open: boolean; onClose: () => void; notes: DbHabitNote[] }) {
  const theme = useTheme();
  // useRef(...).current okuması render sırasında react-hooks/refs kuralını
  // tetikliyor (React Compiler kuralı, Animated.Value'nun render-dışı
  // mutasyon amaçlı bir "escape hatch" olduğunu bilmiyor) — useState'in
  // lazy initializer'ı aynı "bir kere oluştur, referansı sabit tut"
  // sonucunu, kuralı tetiklemeden veriyor.
  const [scale] = useState(() => new Animated.Value(1));
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [randomNote] = useState(() => (notes.length > 0 ? notes[Math.floor(Math.random() * notes.length)] : null));

  useEffect(() => {
    if (!open) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: BREATH_SECONDS * 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.85, duration: BREATH_SECONDS * 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    const id = setInterval(() => setPhase((p) => (p === "in" ? "out" : "in")), BREATH_SECONDS * 1000);
    return () => {
      loop.stop();
      clearInterval(id);
    };
  }, [open, scale]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ThemedText style={styles.modalTitle}>Bir dakika dur, nefes al</ThemedText>

          <Animated.View
            style={[
              styles.breathCircle,
              { borderColor: theme.accent + "80", backgroundColor: theme.accent + "1a", transform: [{ scale }] },
            ]}
          >
            <ThemedText themeColor="accent" style={styles.breathText}>
              {phase === "in" ? "Nefes Al" : "Nefes Ver"}
            </ThemedText>
          </Animated.View>

          {randomNote && (
            <View style={[styles.motivationBox, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <ThemedText themeColor="textSecondary" style={styles.smallLabel}>
                Kendi notundan
              </ThemedText>
              <ThemedText style={{ marginTop: 4, fontSize: 14, textAlign: "center" }}>{randomNote.note_text}</ThemedText>
            </View>
          )}

          <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: theme.border }]}>
            <ThemedText themeColor="textSecondary">Geçti, kapat</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 12 },
  panelHeader: { flexDirection: "row", justifyContent: "flex-end" },
  addButton: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  addButtonText: { fontSize: 12, fontWeight: "600" },
  addForm: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  addFormInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 13 },
  addFormButton: { borderRadius: 8, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, paddingVertical: 8 },
  card: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  statusRow: { flexDirection: "row" },
  statusText: { fontSize: 11, fontWeight: "500" },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 14, paddingBottom: 12 },
  statChip: { fontSize: 11, fontFamily: "monospace" },
  cardBody: { borderTopWidth: 1, padding: 14, gap: 14 },
  improvementBox: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  smallLabel: { fontSize: 12, fontWeight: "500" },
  smallText: { fontSize: 12 },
  insightBox: { borderWidth: 1, borderRadius: 8, padding: 10 },
  counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 10, padding: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  counterText: { fontFamily: "monospace", fontSize: 14 },
  urgeButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  urgeButtonText: { color: "#04191d", fontWeight: "600", fontSize: 12 },
  milestoneRow: { flexDirection: "row", justifyContent: "space-between" },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: "500" },
  choiceButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 8, height: 40 },
  choiceButtonText: { fontSize: 13, fontWeight: "500" },
  textInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 13 },
  insightRequestButton: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  savingsSection: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  savingsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  savingsText: { fontFamily: "monospace", fontSize: 17, fontWeight: "600" },
  periodRow: { flexDirection: "row", gap: 4 },
  periodPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, justifyContent: "center" },
  periodPillText: { fontSize: 11 },
  saveCostButton: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  rewardCard: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  rewardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  dashedButton: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderWidth: 1, borderStyle: "dashed", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: 8, padding: 10 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 340, borderWidth: 1, borderRadius: 16, padding: 24, alignItems: "center", gap: 16 },
  modalTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  breathCircle: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  breathText: { fontSize: 13, fontWeight: "600" },
  motivationBox: { width: "100%", borderWidth: 1, borderRadius: 10, padding: 12, alignItems: "center" },
  closeButton: { width: "100%", height: 40, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
