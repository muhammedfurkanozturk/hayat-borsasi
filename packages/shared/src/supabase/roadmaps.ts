import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoadmapTemplate, RoadmapTemplateNode } from "../roadmapTemplates";

export interface DbRoadmap {
  id: string;
  title: string;
  sort_order: number;
}

export interface DbRoadmapNode {
  id: string;
  roadmap_id: string;
  parent_node_id: string | null;
  title: string;
  sort_order: number;
  completed: boolean;
  is_milestone: boolean;
  target_date: string | null;
  action_note: string | null;
  bookmarked: boolean;
  completed_at: string | null;
}

const ROADMAP_NODE_COLUMNS = "id, roadmap_id, parent_node_id, title, sort_order, completed";
const ROADMAP_NODE_COLUMNS_WITH_EXTRAS = `${ROADMAP_NODE_COLUMNS}, is_milestone, target_date, action_note, bookmarked, completed_at`;

// `is_milestone`/`target_date`/`action_note` (20260901130000),
// `bookmarked` (20260901140000) ve `completed_at` (20260903090000, "eksikler"
// envanteri madde 5 — zaman etiketi) migration'ları henüz uygulanmamış
// olabilir — önce yeni sütunlarla dener, "kolon yok" hatası alırsa eski
// sütun listesine düşüp yeni alanları varsayılan değerlerle doldurur
// (projede zaten defalarca kullanılan desen). Üçü ayrı migration dosyası
// ama tek bir "extras" katmanı olarak ele alınıyor — biri eksikse geçici
// olarak hepsi varsayılana düşer, hepsi uygulanınca normale döner.
type RawRoadmapNode = {
  id: string;
  roadmap_id: string;
  parent_node_id: string | null;
  title: string;
  sort_order: number;
  completed: boolean;
  is_milestone?: boolean;
  target_date?: string | null;
  action_note?: string | null;
  bookmarked?: boolean;
  completed_at?: string | null;
};

function normalizeRoadmapNode(n: RawRoadmapNode): DbRoadmapNode {
  return {
    ...n,
    is_milestone: n.is_milestone ?? false,
    target_date: n.target_date ?? null,
    bookmarked: n.bookmarked ?? false,
    action_note: n.action_note ?? null,
    completed_at: n.completed_at ?? null,
  };
}

export async function fetchRoadmaps(supabase: SupabaseClient, categoryId: string): Promise<DbRoadmap[]> {
  const { data, error } = await supabase
    .from("roadmaps")
    .select("id, title, sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRoadmapNodes(supabase: SupabaseClient, roadmapIds: string[]): Promise<DbRoadmapNode[]> {
  if (roadmapIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from("roadmap_nodes")
      .select(ROADMAP_NODE_COLUMNS_WITH_EXTRAS)
      .in("roadmap_id", roadmapIds)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(normalizeRoadmapNode);
  } catch {
    const { data, error } = await supabase
      .from("roadmap_nodes")
      .select(ROADMAP_NODE_COLUMNS)
      .in("roadmap_id", roadmapIds)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(normalizeRoadmapNode);
  }
}

// Şablon ağacını (statik TS verisi, packages/shared/src/roadmapTemplates.ts)
// kullanıcının kendi roadmaps/roadmap_nodes satırlarına "materialize" eder
// — meals/exercises'daki insertDefault* fonksiyonlarıyla aynı felsefe
// (şablon sadece öneri, seçilince kullanıcının kendi düzenlenebilir verisi
// olur). id'ler önceden istemci tarafında üretilip tek bir toplu insert'te
// gönderiliyor — parent_node_id kendine referans verdiği için satırlar
// üst-önce (pre-order) sırada olmalı, aksi halde FK ihlali olur.
export async function materializeRoadmapTemplate(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  template: RoadmapTemplate,
  sortOrder: number
): Promise<{ roadmap: DbRoadmap; nodes: DbRoadmapNode[] }> {
  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .insert({ user_id: userId, category_id: categoryId, title: template.name, sort_order: sortOrder })
    .select("id, title, sort_order")
    .single();
  if (roadmapError) throw roadmapError;

  const flatNodes = flattenTemplateNodes(template.nodes, null);
  const rows = flatNodes.map((n) => ({
    id: n.id,
    user_id: userId,
    roadmap_id: roadmap.id,
    parent_node_id: n.parentId,
    title: n.title,
    sort_order: n.sortOrder,
  }));

  const { data: nodes, error: nodesError } = await supabase.from("roadmap_nodes").insert(rows).select(ROADMAP_NODE_COLUMNS);
  if (nodesError) throw nodesError;

  return { roadmap, nodes: (nodes ?? []).map(normalizeRoadmapNode) };
}

function flattenTemplateNodes(
  nodes: RoadmapTemplateNode[],
  parentId: string | null
): { id: string; parentId: string | null; title: string; sortOrder: number }[] {
  const result: { id: string; parentId: string | null; title: string; sortOrder: number }[] = [];
  nodes.forEach((node, index) => {
    const id = crypto.randomUUID();
    result.push({ id, parentId, title: node.title, sortOrder: index });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTemplateNodes(node.children, id));
    }
  });
  return result;
}

export async function insertCustomRoadmap(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  title: string,
  sortOrder: number
): Promise<DbRoadmap> {
  const { data, error } = await supabase
    .from("roadmaps")
    .insert({ user_id: userId, category_id: categoryId, title, sort_order: sortOrder })
    .select("id, title, sort_order")
    .single();
  if (error) throw error;
  return data;
}

export async function insertRoadmapNode(
  supabase: SupabaseClient,
  userId: string,
  roadmapId: string,
  parentNodeId: string | null,
  title: string,
  sortOrder: number
): Promise<DbRoadmapNode> {
  const { data, error } = await supabase
    .from("roadmap_nodes")
    .insert({ user_id: userId, roadmap_id: roadmapId, parent_node_id: parentNodeId, title, sort_order: sortOrder })
    .select(ROADMAP_NODE_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeRoadmapNode(data);
}

export async function toggleRoadmapNode(supabase: SupabaseClient, nodeId: string, completed: boolean): Promise<void> {
  // completed_at (20260903090000) henüz uygulanmamışsa "kolon yok" hatası
  // alınıp sadece completed ile tekrar denenir — normalizeRoadmapNode zaten
  // eksik alanı null'a düşürüyor, zaman etiketi o zamana dek gösterilmez.
  const patch = { completed, completed_at: completed ? new Date().toISOString() : null };
  const { error } = await supabase.from("roadmap_nodes").update(patch).eq("id", nodeId);
  if (error) {
    const { error: fallbackError } = await supabase.from("roadmap_nodes").update({ completed }).eq("id", nodeId);
    if (fallbackError) throw fallbackError;
  }
}

// Onepin'in "aksiyona geçirilebilir düğüm + kilometre taşı + hedef tarih"
// fikri — düğüm detay modalından (RoadmapNodeDetailModal) çağrılıyor.
export async function updateRoadmapNode(
  supabase: SupabaseClient,
  nodeId: string,
  input: { title?: string; isMilestone?: boolean; targetDate?: string | null; actionNote?: string | null }
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.isMilestone !== undefined) patch.is_milestone = input.isMilestone;
  if (input.targetDate !== undefined) patch.target_date = input.targetDate;
  if (input.actionNote !== undefined) patch.action_note = input.actionNote;
  const { error } = await supabase.from("roadmap_nodes").update(patch).eq("id", nodeId);
  if (error) throw error;
}

// roadmap.sh keşif eki — "Yer İşareti", tek tıkla açılıp kapanan anlık bir
// aksiyon (toggleRoadmapNode'un tamamlanma için yaptığının aynısı), modal
// açıp "Kaydet"e basmayı gerektirmiyor.
export async function toggleRoadmapNodeBookmark(supabase: SupabaseClient, nodeId: string, bookmarked: boolean): Promise<void> {
  const { error } = await supabase.from("roadmap_nodes").update({ bookmarked }).eq("id", nodeId);
  if (error) throw error;
}

// "Kişiselleştirilebilir hız/plan" (Onepin) — bir bitiş tarihine göre,
// tamamlanmamış düğümlere GÖRSEL SIRALARINA (pre-order, dışarıdan verilir)
// göre eşit aralıklı hedef tarihler dağıtıyor. Tek tek update yerine paralel
// çağrılıyor (nodeId + tarih çifti küçük, tek bir bulk upsert'e değecek
// kadar sık kullanılan bir işlem değil).
export async function bulkSetRoadmapTargetDates(
  supabase: SupabaseClient,
  updates: { id: string; targetDate: string }[]
): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, targetDate }) => supabase.from("roadmap_nodes").update({ target_date: targetDate }).eq("id", id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function deleteRoadmap(supabase: SupabaseClient, roadmapId: string): Promise<void> {
  const { error } = await supabase.from("roadmaps").delete().eq("id", roadmapId);
  if (error) throw error;
}

export async function deleteRoadmapNode(supabase: SupabaseClient, nodeId: string): Promise<void> {
  const { error } = await supabase.from("roadmap_nodes").delete().eq("id", nodeId);
  if (error) throw error;
}
