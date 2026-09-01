import { useEffect, useState } from "react";
import {
  ROADMAP_TEMPLATES,
  deleteRoadmap,
  deleteRoadmapNode,
  fetchRoadmapNodes,
  fetchRoadmaps,
  insertCustomRoadmap,
  insertRoadmapNode,
  materializeRoadmapTemplate,
  toggleRoadmapNode,
  updateRoadmapNode,
  type DbRoadmap,
  type DbRoadmapNode,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";

// Kategori Bazlı Tasarım Farklılaştırma (bkz. CLAUDE.md bölüm 9) — Yol
// Haritam'ın mobil karşılığı. Web'de React Flow + Dagre ile görsel bir
// ağaç/omurga çiziliyor (@xyflow/react, RN'de çalışmıyor) — burada aynı
// veri modeli (roadmaps/roadmap_nodes, parent_node_id) korunuyor ama
// GÖRSELLEŞTİRME native-dostu, iç içe girintili bir listeye indirgendi
// (canvas/SVG kütüphanesi eklemeden). Miro'nun açık/pastel-leylak
// kimliği (web Bölüm 6) burada da sabit renklerle uygulanıyor — mobil
// tema sisteminden (useTheme) BAĞIMSIZ, tıpkı web'deki kök-token-ezme
// scope'unun mobildeki karşılığı.
const MIRO = {
  bg: "#fafafa",
  surface: "#ffffff",
  elevated: "#f4f4f5",
  border: "#e4e4e7",
  text: "#27272a",
  muted: "#71717a",
  accent: "#a78bfa",
  accentSoft: "#a78bfa26",
  accentFg: "#211a3d",
  positive: "#16a34a",
};

export function RoadmapPanel({ categoryId }: { categoryId: string }) {
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<DbRoadmap[]>([]);
  const [nodes, setNodes] = useState<DbRoadmapNode[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [addingUnder, setAddingUnder] = useState<string | null>(null); // null = kök seviye, "root" sentinel kullanılmıyor
  const [addingAtRoot, setAddingAtRoot] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [savingNode, setSavingNode] = useState(false);

  async function load() {
    const roadmapRows = await fetchRoadmaps(supabase, categoryId);
    setRoadmaps(roadmapRows);
    const nodeRows = await fetchRoadmapNodes(
      supabase,
      roadmapRows.map((r) => r.id)
    );
    setNodes(nodeRows);
    setActiveRoadmapId((prev) => prev ?? roadmapRows[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handlePickTemplate(templateKey: string) {
    const template = ROADMAP_TEMPLATES.find((t) => t.key === templateKey);
    if (!template) return;
    setCreating(templateKey);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { roadmap, nodes: newNodes } = await materializeRoadmapTemplate(supabase, user.id, categoryId, template, roadmaps.length);
      setRoadmaps((prev) => [...prev, roadmap]);
      setNodes((prev) => [...prev, ...newNodes]);
      setActiveRoadmapId(roadmap.id);
    }
    setCreating(null);
  }

  async function handleCreateCustom() {
    if (!customTitle.trim()) return;
    setCreating("custom");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const roadmap = await insertCustomRoadmap(supabase, user.id, categoryId, customTitle.trim(), roadmaps.length);
      setRoadmaps((prev) => [...prev, roadmap]);
      setActiveRoadmapId(roadmap.id);
      setCustomTitle("");
    }
    setCreating(null);
  }

  async function handleToggle(node: DbRoadmapNode) {
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, completed: !n.completed } : n)));
    await toggleRoadmapNode(supabase, node.id, !node.completed);
  }

  async function handleToggleMilestone(node: DbRoadmapNode) {
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, is_milestone: !n.is_milestone } : n)));
    try {
      await updateRoadmapNode(supabase, node.id, { isMilestone: !node.is_milestone });
    } catch (err) {
      console.error("Kilometre taşı kaydedilemedi (migration uygulanmamış olabilir):", err);
    }
  }

  async function handleDeleteNode(node: DbRoadmapNode) {
    setNodes((prev) => prev.filter((n) => n.id !== node.id && n.parent_node_id !== node.id));
    await deleteRoadmapNode(supabase, node.id);
  }

  async function handleAddNode(parentId: string | null) {
    if (!newNodeTitle.trim() || !activeRoadmapId) return;
    setSavingNode(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const siblingCount = nodes.filter((n) => n.roadmap_id === activeRoadmapId && n.parent_node_id === parentId).length;
      const created = await insertRoadmapNode(supabase, user.id, activeRoadmapId, parentId, newNodeTitle.trim(), siblingCount);
      setNodes((prev) => [...prev, created]);
      setNewNodeTitle("");
      setAddingUnder(null);
      setAddingAtRoot(false);
    }
    setSavingNode(false);
  }

  function confirmDeleteRoadmap(roadmap: DbRoadmap) {
    Alert.alert("Haritayı sil", `"${roadmap.title}" haritasını ve tüm konularını silmek istediğine emin misin?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteRoadmap(supabase, roadmap.id);
          setRoadmaps((prev) => prev.filter((r) => r.id !== roadmap.id));
          setNodes((prev) => prev.filter((n) => n.roadmap_id !== roadmap.id));
          setActiveRoadmapId((prev) => (prev === roadmap.id ? null : prev));
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: MIRO.bg }]}>
        <ActivityIndicator color={MIRO.accent} />
      </View>
    );
  }

  const activeRoadmap = roadmaps.find((r) => r.id === activeRoadmapId);

  if (!activeRoadmap) {
    const existingTitles = new Set(roadmaps.map((r) => r.title));
    const availableTemplates = ROADMAP_TEMPLATES.filter((t) => !existingTitles.has(t.name));

    return (
      <View style={[styles.container, { backgroundColor: MIRO.bg }]}>
        <ThemedText style={[styles.heading, { color: MIRO.text }]}>Yol Haritam</ThemedText>
        <ThemedText style={[styles.subtext, { color: MIRO.muted }]}>
          Hazır bir şablonla başla ya da kendi haritanı elle oluştur.
        </ThemedText>

        {roadmaps.length > 0 && (
          <View style={{ gap: 8 }}>
            {roadmaps.map((r) => {
              const count = nodes.filter((n) => n.roadmap_id === r.id).length;
              const done = nodes.filter((n) => n.roadmap_id === r.id && n.completed).length;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setActiveRoadmapId(r.id)}
                  onLongPress={() => confirmDeleteRoadmap(r)}
                  style={[styles.existingCard, { borderColor: MIRO.accent, backgroundColor: MIRO.surface }]}
                >
                  <ThemedText style={{ color: MIRO.text, fontWeight: "600", fontSize: 14 }}>{r.title}</ThemedText>
                  <ThemedText style={{ color: MIRO.muted, fontSize: 12 }}>
                    {count > 0 ? `%${Math.round((done / count) * 100)} tamamlandı` : "Boş"}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ gap: 8 }}>
          {availableTemplates.map((t) => (
            <Pressable
              key={t.key}
              disabled={creating !== null}
              onPress={() => handlePickTemplate(t.key)}
              style={[styles.templateCard, { borderColor: MIRO.border, backgroundColor: MIRO.surface }]}
            >
              <MaterialCommunityIcons name="map-outline" size={18} color={MIRO.accent} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: MIRO.text, fontWeight: "600", fontSize: 14 }}>{t.name}</ThemedText>
                <ThemedText style={{ color: MIRO.muted, fontSize: 12 }}>{t.nodes.length} ana konu</ThemedText>
              </View>
              {creating === t.key && <ActivityIndicator color={MIRO.accent} size="small" />}
            </Pressable>
          ))}
        </View>

        <View style={[styles.customRow, { borderColor: MIRO.border }]}>
          <TextInput
            value={customTitle}
            onChangeText={setCustomTitle}
            placeholder="Kendi haritamın adı..."
            placeholderTextColor={MIRO.muted}
            style={[styles.input, { borderColor: MIRO.border, color: MIRO.text, backgroundColor: MIRO.elevated }]}
          />
          <Pressable
            onPress={handleCreateCustom}
            disabled={creating !== null || !customTitle.trim()}
            style={[styles.addButton, { backgroundColor: MIRO.accentSoft, opacity: customTitle.trim() ? 1 : 0.5 }]}
          >
            {creating === "custom" ? (
              <ActivityIndicator color={MIRO.accent} size="small" />
            ) : (
              <ThemedText style={{ color: MIRO.accent, fontWeight: "600", fontSize: 13 }}>Oluştur</ThemedText>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  const activeNodes = nodes.filter((n) => n.roadmap_id === activeRoadmap.id);
  const completedCount = activeNodes.filter((n) => n.completed).length;
  const progress = activeNodes.length > 0 ? Math.round((completedCount / activeNodes.length) * 100) : 0;
  const rootNodes = activeNodes.filter((n) => n.parent_node_id === null).sort((a, b) => a.sort_order - b.sort_order);

  function childrenOf(parentId: string): DbRoadmapNode[] {
    return activeNodes.filter((n) => n.parent_node_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
  }

  function renderNode(node: DbRoadmapNode, depth: number) {
    const kids = childrenOf(node.id);
    return (
      <View key={node.id}>
        <View style={[styles.nodeRow, { marginLeft: depth * 16, borderColor: MIRO.border, backgroundColor: depth === 0 ? MIRO.accentSoft : MIRO.surface }]}>
          <Pressable onPress={() => handleToggle(node)} hitSlop={8}>
            <MaterialCommunityIcons
              name={node.completed ? "check-circle" : "checkbox-blank-circle-outline"}
              size={20}
              color={node.completed ? MIRO.positive : MIRO.muted}
            />
          </Pressable>
          <ThemedText
            style={{
              flex: 1,
              color: MIRO.text,
              fontSize: depth === 0 ? 14 : 13,
              fontWeight: depth === 0 ? "700" : "500",
              textDecorationLine: node.completed ? "line-through" : "none",
              opacity: node.completed ? 0.6 : 1,
            }}
          >
            {node.title}
          </ThemedText>
          <Pressable onPress={() => handleToggleMilestone(node)} hitSlop={8}>
            <MaterialCommunityIcons name={node.is_milestone ? "star" : "star-outline"} size={16} color="#f5b400" />
          </Pressable>
          <Pressable
            onPress={() => {
              setAddingUnder(node.id);
              setAddingAtRoot(false);
              setNewNodeTitle("");
            }}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="plus" size={16} color={MIRO.accent} />
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert("Konuyu sil", `"${node.title}" ve altındaki konular silinecek.`, [
                { text: "Vazgeç", style: "cancel" },
                { text: "Sil", style: "destructive", onPress: () => handleDeleteNode(node) },
              ])
            }
            hitSlop={8}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={15} color={MIRO.muted} />
          </Pressable>
        </View>

        {addingUnder === node.id && (
          <View style={[styles.customRow, { marginLeft: (depth + 1) * 16, borderColor: MIRO.border }]}>
            <TextInput
              autoFocus
              value={newNodeTitle}
              onChangeText={setNewNodeTitle}
              placeholder="Alt konu adı..."
              placeholderTextColor={MIRO.muted}
              style={[styles.input, { flex: 1, borderColor: MIRO.border, color: MIRO.text, backgroundColor: MIRO.elevated }]}
              onSubmitEditing={() => handleAddNode(node.id)}
            />
            <Pressable
              onPress={() => handleAddNode(node.id)}
              disabled={savingNode}
              style={[styles.addButton, { backgroundColor: MIRO.accentSoft }]}
            >
              <ThemedText style={{ color: MIRO.accent, fontWeight: "600", fontSize: 13 }}>Ekle</ThemedText>
            </Pressable>
          </View>
        )}

        {kids.map((child) => renderNode(child, depth + 1))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: MIRO.bg }]}>
      <Pressable onPress={() => setActiveRoadmapId(null)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <MaterialCommunityIcons name="arrow-left" size={14} color={MIRO.muted} />
        <ThemedText style={{ color: MIRO.muted, fontSize: 12 }}>Yol Haritalarım</ThemedText>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <ThemedText style={[styles.heading, { color: MIRO.text }]}>{activeRoadmap.title}</ThemedText>
        <ThemedText style={{ color: MIRO.positive, fontWeight: "700", fontFamily: "monospace" }}>%{progress}</ThemedText>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: MIRO.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: MIRO.positive }]} />
      </View>

      <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ gap: 6 }}>
        {rootNodes.length === 0 && (
          <ThemedText style={{ color: MIRO.muted, fontSize: 13 }}>Henüz konu yok, aşağıdan ekle.</ThemedText>
        )}
        {rootNodes.map((n) => renderNode(n, 0))}
      </ScrollView>

      {addingAtRoot ? (
        <View style={[styles.customRow, { borderColor: MIRO.border }]}>
          <TextInput
            autoFocus
            value={newNodeTitle}
            onChangeText={setNewNodeTitle}
            placeholder="Yeni ana konu..."
            placeholderTextColor={MIRO.muted}
            style={[styles.input, { flex: 1, borderColor: MIRO.border, color: MIRO.text, backgroundColor: MIRO.elevated }]}
            onSubmitEditing={() => handleAddNode(null)}
          />
          <Pressable onPress={() => handleAddNode(null)} disabled={savingNode} style={[styles.addButton, { backgroundColor: MIRO.accentSoft }]}>
            <ThemedText style={{ color: MIRO.accent, fontWeight: "600", fontSize: 13 }}>Ekle</ThemedText>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setAddingAtRoot(true);
            setAddingUnder(null);
            setNewNodeTitle("");
          }}
          style={[styles.dashedButton, { borderColor: MIRO.border }]}
        >
          <MaterialCommunityIcons name="plus" size={14} color={MIRO.muted} />
          <ThemedText style={{ color: MIRO.muted, fontSize: 13 }}>Ana Konu Ekle</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, borderRadius: 12, padding: 14 },
  heading: { fontSize: 16, fontWeight: "700" },
  subtext: { fontSize: 12 },
  existingCard: { borderWidth: 2, borderRadius: 10, padding: 12, gap: 2 },
  templateCard: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  customRow: { flexDirection: "row", gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 13 },
  addButton: { borderRadius: 8, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  nodeRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  dashedButton: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderRadius: 8, paddingVertical: 8 },
});
