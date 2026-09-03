"use client";

import { useEffect, useState } from "react";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ROADMAP_TEMPLATES,
  bulkSetRoadmapTargetDates,
  deleteRoadmap,
  deleteRoadmapNode,
  fetchRoadmapNodes,
  fetchRoadmaps,
  insertCustomRoadmap,
  insertRoadmapNode,
  materializeRoadmapTemplate,
  toggleRoadmapNode,
  toggleRoadmapNodeBookmark,
  updateRoadmapNode,
  type DbRoadmap,
  type DbRoadmapNode,
} from "@hayat-borsasi/shared";
import { ArrowLeftIcon, BookmarkIcon, CalendarIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme-context";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { layoutRoadmapSpine, type SpineSide } from "./layout";
import { RoadmapNode, type RoadmapNodeData } from "./RoadmapNode";
import { RoadmapNodeDetailModal } from "./RoadmapNodeDetailModal";
import { RoadmapTemplatePicker } from "./RoadmapTemplatePicker";

const nodeTypes = { roadmapNode: RoadmapNode };

// Kategori Bazlı Tasarım Farklılaştırma — Bölüm 6 (Yol Haritam → Miro dili,
// 2026-09-02). "Dijital beyaz tahta" hissi — vurgu, roadmap.sh'in bakır/
// turuncusu yerine Miro'nun pastel leylak tonuna çevrildi.
// Kritik düzeltme (2026-09-03, kullanıcı bulgusu): zemin ÖNCEDEN site
// temasından bağımsız SABİT açıktı — artık genel site temasına göre
// açık/koyu "tahta" arasında geçiş yapıyor, sadece leylak vurgu HER İKİ
// modda da aynı kalıyor (bkz. Finans/Robinhood bölümündeki AYNI kök-
// token-ezme yöntemi).
const ROADMAP_PALETTE: Record<"dark" | "light", Record<string, string>> = {
  dark: {
    "--background": "#1a1a1d",
    "--background-elevated": "#232326",
    "--surface": "#1f1f23",
    "--surface-hover": "#28282c",
    "--border": "rgba(255,255,255,0.12)",
    "--border-soft": "rgba(255,255,255,0.08)",
    "--foreground": "#f4f4f5",
    "--muted": "#a1a1aa",
    "--muted-soft": "#71717a",
  },
  light: {
    "--background": "#fafafa",
    "--background-elevated": "#f4f4f5",
    "--surface": "#ffffff",
    "--surface-hover": "#f0f0f1",
    "--border": "#e4e4e7",
    "--border-soft": "#ececef",
    "--foreground": "#27272a",
    "--muted": "#71717a",
    "--muted-soft": "#a1a1aa",
  },
};
const ROADMAP_ACCENT: React.CSSProperties = {
  "--accent": "#a78bfa",
  "--accent-soft": "#a78bfa26",
  "--accent-foreground": "#211a3d",
} as React.CSSProperties;

// roadmap.sh'teki (piyasa araştırması) "dallanan harita + tıkla-işaretle"
// fikrinin uyarlaması — kod/tasarım kopyalanmadı, sadece etkileşim mantığı.
// Roadmap ilerlemesi bilinçli olarak ana günlük skor motoruna (tasks)
// katılmıyor (kullanıcı onaylı, bkz. CLAUDE.md) — düğümler bir kereye
// mahsus kilometre taşı, günlük tekrar eden görev değil.
export function RoadmapPanel({ categoryId }: { categoryId: string }) {
  const { theme } = useTheme();
  const roadmapScope = { ...ROADMAP_PALETTE[theme], ...ROADMAP_ACCENT } as React.CSSProperties;
  const [roadmaps, setRoadmaps] = useState<DbRoadmap[]>([]);
  const [nodes, setNodes] = useState<DbRoadmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // "tree": aktif haritanın ağacı. "list": bu kategorideki tüm haritaların
  // kart ızgarası (RoadmapTemplatePicker, hem var olan haritalar hem yeni
  // şablonlar). 2026-08-26: "← Panele Dön" yanlışlıkla Dashboard'a
  // (router/Link ile) gidiyordu — kullanıcı bulgusu: aynı kategoride kalıp
  // "genel haritalar" (bu listeye) dönmeliydi, sayfa değişmemeli.
  const [viewMode, setViewMode] = useState<"list" | "tree">("tree");

  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeParentId, setNewNodeParentId] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleEndDate, setScheduleEndDate] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  async function load() {
    setLoadError(null);
    try {
      const supabase = createClient();
      const roadmapRows = await fetchRoadmaps(supabase, categoryId);
      setRoadmaps(roadmapRows);
      setActiveRoadmapId(roadmapRows[0]?.id ?? null);
      const nodeRows = await fetchRoadmapNodes(
        supabase,
        roadmapRows.map((r) => r.id)
      );
      setNodes(nodeRows);
    } catch (err) {
      // roadmaps/roadmap_nodes migration'ı henüz uygulanmamış olabilir.
      console.error("Yol haritası yüklenemedi:", err);
      setLoadError("Yol haritası yüklenemedi. (Migration uygulanmamış olabilir.)");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handlePickTemplate(templateKey: string) {
    const template = ROADMAP_TEMPLATES.find((t) => t.key === templateKey);
    if (!template) return;
    setCreating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { roadmap, nodes: created } = await materializeRoadmapTemplate(supabase, user.id, categoryId, template, roadmaps.length);
      setRoadmaps((prev) => [...prev, roadmap]);
      setNodes((prev) => [...prev, ...created]);
      setActiveRoadmapId(roadmap.id);
      setViewMode("tree");
    }
    setCreating(false);
  }

  async function handleCreateCustom(title: string) {
    setCreating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const roadmap = await insertCustomRoadmap(supabase, user.id, categoryId, title, roadmaps.length);
      setRoadmaps((prev) => [...prev, roadmap]);
      setActiveRoadmapId(roadmap.id);
      setViewMode("tree");
    }
    setCreating(false);
  }

  async function handleDeleteRoadmap(roadmapId: string) {
    const remaining = roadmaps.filter((r) => r.id !== roadmapId);
    setRoadmaps(remaining);
    setNodes((prev) => prev.filter((n) => n.roadmap_id !== roadmapId));
    setActiveRoadmapId((prev) => (prev === roadmapId ? (remaining[0]?.id ?? null) : prev));
    if (remaining.length === 0) setViewMode("tree");
    const supabase = createClient();
    await deleteRoadmap(supabase, roadmapId);
  }

  async function handleToggleNode(node: DbRoadmapNode) {
    const nextCompleted = !node.completed;
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, completed: nextCompleted } : n)));
    const supabase = createClient();
    await toggleRoadmapNode(supabase, node.id, nextCompleted);
  }

  async function handleSaveNodeDetail(
    nodeId: string,
    input: { title: string; isMilestone: boolean; targetDate: string | null; actionNote: string | null }
  ) {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, title: input.title, is_milestone: input.isMilestone, target_date: input.targetDate, action_note: input.actionNote }
          : n
      )
    );
    const supabase = createClient();
    await updateRoadmapNode(supabase, nodeId, input);
  }

  async function handleDeleteNode(nodeId: string) {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId && n.parent_node_id !== nodeId));
    setDetailNodeId(null);
    const supabase = createClient();
    await deleteRoadmapNode(supabase, nodeId);
  }

  async function handleToggleBookmark(node: DbRoadmapNode) {
    const next = !node.bookmarked;
    setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, bookmarked: next } : n)));
    const supabase = createClient();
    try {
      await toggleRoadmapNodeBookmark(supabase, node.id, next);
    } catch (err) {
      // bookmarked migration'ı (20260901140000) henüz uygulanmamış olabilir
      // — modaldeki yerel görünüm zaten geri alıyor (RoadmapNodeDetailModal),
      // burada da AYNI şekilde geri alınmazsa "Yer İşaretlerim" listesi ve
      // düğüm rozeti DB'ye hiç yazılmamış bir durumu göstermeye devam eder
      // (test sırasında bulunan gerçek bir tutarsızlık).
      setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, bookmarked: node.bookmarked } : n)));
      throw err;
    }
  }

  // Onepin ilhamı — "kişiselleştirilebilir hız/plan": tamamlanmamış
  // düğümlere, ağacın görsel okuma sırasına (üstten alta, her dalın kendi
  // alt dalları) göre bir bitiş tarihine kadar eşit aralıklı hedef tarih
  // dağıtıyor. `flattenPreOrder` layout.ts'teki AYNI omurga+dal mantığını
  // (üst-seviye önce, sonra her birinin çocukları) izliyor.
  function flattenPreOrder(all: DbRoadmapNode[]): DbRoadmapNode[] {
    const byParent = new Map<string | null, DbRoadmapNode[]>();
    for (const n of all) {
      const list = byParent.get(n.parent_node_id) ?? [];
      list.push(n);
      byParent.set(n.parent_node_id, list);
    }
    for (const list of byParent.values()) list.sort((a, b) => a.sort_order - b.sort_order);

    const result: DbRoadmapNode[] = [];
    function visit(parentId: string | null) {
      for (const n of byParent.get(parentId) ?? []) {
        result.push(n);
        visit(n.id);
      }
    }
    visit(null);
    return result;
  }

  async function handleAutoSchedule() {
    if (!scheduleEndDate) return;
    const incomplete = flattenPreOrder(activeNodes).filter((n) => !n.completed);
    if (incomplete.length === 0) return;
    setScheduling(true);

    const start = new Date().getTime();
    const end = new Date(`${scheduleEndDate}T00:00:00`).getTime();
    const totalMs = Math.max(end - start, 0);

    const updates = incomplete.map((n, i) => {
      const fraction = (i + 1) / incomplete.length;
      const date = new Date(start + totalMs * fraction);
      return { id: n.id, targetDate: date.toISOString().slice(0, 10) };
    });

    setNodes((prev) => {
      const byId = new Map(updates.map((u) => [u.id, u.targetDate]));
      return prev.map((n) => (byId.has(n.id) ? { ...n, target_date: byId.get(n.id)! } : n));
    });

    const supabase = createClient();
    try {
      await bulkSetRoadmapTargetDates(supabase, updates);
      setScheduleOpen(false);
      setScheduleEndDate("");
      setScheduleError(null);
    } catch (err) {
      // is_milestone/target_date/action_note migration'ı (20260901130000)
      // henüz uygulanmamış olabilir — düğümler ekranda tarihli görünüyor
      // (optimistic) ama kalıcı olmuyor, kullanıcıya bunu açıkça söylüyoruz.
      console.error("Otomatik planlama kaydedilemedi (migration uygulanmamış olabilir):", err);
      setScheduleError("Kaydedilemedi. (Migration uygulanmamış olabilir.) Tarihler sadece bu ekranda görünüyor.");
    }
    setScheduling(false);
  }

  async function handleAddNode(e: React.FormEvent) {
    e.preventDefault();
    if (!newNodeTitle.trim() || !activeRoadmapId) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const siblingCount = nodes.filter(
        (n) => n.roadmap_id === activeRoadmapId && n.parent_node_id === (newNodeParentId || null)
      ).length;
      const created = await insertRoadmapNode(
        supabase,
        user.id,
        activeRoadmapId,
        newNodeParentId || null,
        newNodeTitle.trim(),
        siblingCount
      );
      setNodes((prev) => [...prev, created]);
    }
    setNewNodeTitle("");
    setNewNodeParentId("");
    setAddNodeOpen(false);
  }

  if (loading) {
    return <div className="rounded-lg border border-border bg-surface shadow-card p-5 text-sm text-muted">Yükleniyor...</div>;
  }

  if (loadError) {
    return <div className="rounded-lg border border-border bg-surface shadow-card p-5 text-sm text-negative">{loadError}</div>;
  }

  if (roadmaps.length === 0 || viewMode === "list") {
    const existingRoadmaps = roadmaps.map((r) => {
      const rNodes = nodes.filter((n) => n.roadmap_id === r.id);
      const rCompleted = rNodes.filter((n) => n.completed).length;
      return {
        id: r.id,
        title: r.title,
        progress: rNodes.length > 0 ? Math.round((rCompleted / rNodes.length) * 100) : 0,
      };
    });
    return (
      <div className="rounded-lg bg-[color:var(--background)] p-4 sm:p-5" style={roadmapScope}>
        <RoadmapTemplatePicker
          existingRoadmaps={existingRoadmaps}
          onSelectExisting={(roadmapId) => {
            setActiveRoadmapId(roadmapId);
            setViewMode("tree");
          }}
          onPickTemplate={handlePickTemplate}
          onCreateCustom={handleCreateCustom}
          creating={creating}
        />
      </div>
    );
  }

  const activeRoadmap = roadmaps.find((r) => r.id === activeRoadmapId) ?? roadmaps[0];
  const activeNodes = nodes.filter((n) => n.roadmap_id === activeRoadmap.id);
  const completedCount = activeNodes.filter((n) => n.completed).length;
  const progress = activeNodes.length > 0 ? Math.round((completedCount / activeNodes.length) * 100) : 0;

  // "eksikler" envanteri madde 5 — el-çizimi vurgu: pre-order sırasındaki
  // İLK tamamlanmamış düğüm "şu an sırada bu var" olarak işaretleniyor.
  const currentFocusId = flattenPreOrder(activeNodes).find((n) => !n.completed)?.id ?? null;

  const { nodes: flowNodes, edges: flowEdges } = layoutRoadmapSpine(
    activeNodes,
    (n, variant, spineSide: SpineSide | undefined, depth?: number) =>
      ({
        title: n.title,
        completed: n.completed,
        onToggle: () => handleToggleNode(n),
        onOpenDetail: () => setDetailNodeId(n.id),
        variant,
        spineSide,
        isMilestone: n.is_milestone,
        targetDate: n.target_date,
        bookmarked: n.bookmarked,
        completedAt: n.completed_at,
        isCurrentFocus: n.id === currentFocusId,
        branchDepth: depth ?? 1,
      }) satisfies RoadmapNodeData
  );

  const detailNode = detailNodeId ? (activeNodes.find((n) => n.id === detailNodeId) ?? null) : null;
  const detailNodeParent = detailNode?.parent_node_id
    ? (activeNodes.find((n) => n.id === detailNode.parent_node_id)?.title ?? null)
    : null;
  const bookmarkedNodes = activeNodes.filter((n) => n.bookmarked);

  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5"
      style={roadmapScope}
    >
      {/* 2026-08-26: harita ağacı açıldığında çıkış yolu yoktu (kullanıcı
          bulgusu). İlk versiyon Dashboard'a giden bir Link'ti — ama bu
          kategoriden tamamen çıkarıyordu; kullanıcı asıl aynı kategoride
          kalıp bu haritalar arası seçim ekranına (viewMode="list") dönmek
          istediğini belirtti, o yüzden sayfa değişmeyen bir state geçişine
          çevrildi. */}
      <button
        type="button"
        onClick={() => setViewMode("list")}
        className="btn flex w-fit items-center gap-1.5 text-xs text-muted hover:text-foreground"
      >
        <ArrowLeftIcon width={14} height={14} />
        Yol Haritalarım
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium text-foreground">Yol Haritam</h2>
          {roadmaps.length > 1 && (
            <SegmentedControl
              size="sm"
              options={roadmaps.map((r) => ({ value: r.id, label: r.title }))}
              value={activeRoadmap.id}
              onChange={setActiveRoadmapId}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold tabular-nums text-positive">%{progress}</span>
          <span className="text-xs text-muted">
            {completedCount}/{activeNodes.length} tamamlandı
          </span>
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            aria-label="Otomatik planla"
            className="btn flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-accent"
          >
            <CalendarIcon width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteRoadmap(activeRoadmap.id)}
            aria-label="Haritayı sil"
            className="btn flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-negative"
          >
            <TrashIcon width={14} height={14} />
          </button>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
        <div className="h-full rounded-full bg-positive transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* roadmap.sh keşif eki — büyük ağaçta (97+ düğüm) önemli konulara
          hızlı erişim için yer işaretli düğümlerin bir listesi. Tıklayınca
          o düğümün detay modalı açılıyor (ağaçta kaydırma/odaklama gibi
          daha karmaşık bir viewport hesaplaması yerine — modal zaten
          düzenleme için gereken her şeyi gösteriyor). */}
      {bookmarkedNodes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-accent/20 bg-accent-soft/20 p-2.5">
          <span className="flex items-center gap-1 text-xs font-medium text-accent">
            <BookmarkIcon width={12} height={12} strokeWidth={0} fill="currentColor" />
            Yer İşaretlerim
          </span>
          {bookmarkedNodes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setDetailNodeId(n.id)}
              className="btn rounded-full border border-accent/30 bg-background px-2.5 py-1 text-xs text-foreground hover:border-accent/60"
            >
              {n.title}
            </button>
          ))}
        </div>
      )}

      {/* Bölüm 5 (2026-08-25): roadmap.sh'teki gibi büyük, aşağı doğru akan
          bir ağaç hissi için konteyner 420px'ten çok daha büyük bir yüksekliğe
          çıkarıldı (dagre zaten TB/üstten-alta düzen kuruyordu — küçük kutu
          "yana sıkışmış" hissi veriyordu, sorun konteynerin boyutuydu). */}
      <div className="roadmap-flow h-[75vh] min-h-[560px] w-full overflow-hidden rounded-lg border-2 border-border-soft bg-background-elevated">
        {activeNodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Henüz düğüm yok, aşağıdan ekle.</div>
        ) : (
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} color="var(--border-soft)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>

      {addNodeOpen ? (
        <form onSubmit={handleAddNode} className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
            placeholder="Konu adı"
            className="h-9 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <select
            value={newNodeParentId}
            onChange={(e) => setNewNodeParentId(e.target.value)}
            className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none focus:border-accent/50"
          >
            <option value="">Kök düğüm</option>
            {activeNodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newNodeTitle.trim()}
            className="btn h-9 shrink-0 rounded-lg bg-accent-soft px-4 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
          >
            Ekle
          </button>
          <button
            type="button"
            onClick={() => setAddNodeOpen(false)}
            className="btn h-9 rounded-lg border-2 border-muted/30 px-3 text-xs text-muted hover:text-foreground"
          >
            Vazgeç
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddNodeOpen(true)}
          className="btn flex w-fit items-center gap-1.5 rounded-lg border-2 border-dashed border-muted/30 px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          <PlusIcon width={12} height={12} />
          Konu Ekle
        </button>
      )}

      <RoadmapNodeDetailModal
        key={detailNode?.id}
        node={detailNode}
        roadmapName={activeRoadmap.title}
        parentTitle={detailNodeParent}
        onClose={() => setDetailNodeId(null)}
        onSave={(input) => handleSaveNodeDetail(detailNode!.id, input)}
        onDelete={() => handleDeleteNode(detailNode!.id)}
        onToggleBookmark={() => handleToggleBookmark(detailNode!)}
      />

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        panelClassName="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-background-elevated p-5"
      >
        <h3 className="text-base font-semibold text-foreground">Otomatik Planla</h3>
        <p className="text-xs text-muted">
          Onepin&apos;in kişisel hız fikrinden ilham — bir bitiş tarihi seç, tamamlanmamış tüm konulara ağaçtaki sırasına göre
          eşit aralıklı hedef tarihler dağıtılsın.
        </p>
        <input
          type="date"
          value={scheduleEndDate}
          onChange={(e) => setScheduleEndDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none"
        />
        <button
          type="button"
          onClick={handleAutoSchedule}
          disabled={!scheduleEndDate || scheduling}
          className="btn h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {scheduling ? "Uygulanıyor..." : "Uygula"}
        </button>
        {scheduleError && <p className="text-xs text-negative">{scheduleError}</p>}
      </Modal>
    </div>
  );
}
