import { Position, type Edge, type Node } from "@xyflow/react";
import type { DbRoadmapNode } from "@hayat-borsasi/shared";

// Bölüm 5 (2026-08-26) — kullanıcının roadmap.sh'te gerçekten gördüğü
// yapı: üst-seviye konular (parent_node_id = null) tek bir dikey "omurga"
// oluşturuyor (Internet → HTML → CSS → ...), her omurga düğümünün alt
// konuları (children) omurganın YANINA (sırayla sağa/sola) küme halinde
// açılıyor — genel bir dagre ağacı DEĞİL. Önceki sürüm (saf dagre TB)
// omurga düğümleri arasında hiç kenar kurmuyordu (hepsi kardeşti, tek bir
// kök altında), bu yüzden hepsi aynı satırda yan yana diziliyordu — asıl
// kopukluk buradaydı. Bu dosya artık dagre kullanmıyor, elle (ama basit)
// bir omurga+dal yerleşimi hesaplıyor.
//
// Madde 7 (2026-08-30) — TEŞHİS: bu fonksiyon sadece omurga (depth 0) +
// DOĞRUDAN çocuklarını (depth 1) yerleştiriyordu — `flattenTemplateNodes`
// (roadmaps.ts) ve `RoadmapTemplateNode.children` tipi zaten iç içe
// (recursive) olduğu için VERİ katmanı 3+ seviyeyi hep destekliyordu, ama
// bu YERLEŞİM fonksiyonu depth>=2 düğümleri hiç `nodes`/`edges`'e eklemiyordu
// — sessizce kayboluyorlardı. `layoutBranchRecursive` ile genelleştirildi:
// her dal, kendi çocuklarını (varsa) omurgadan bir kademe daha uzağa,
// AYNI yönde (sağ/sol) açıyor — derinlik sınırı yok.
const TRUNK_WIDTH = 220;
const TRUNK_HEIGHT = 56;
const TRUNK_GAP_Y = 120;
const BRANCH_WIDTH = 200;
const BRANCH_HEIGHT = 42;
const BRANCH_GAP_Y = 16;
const BRANCH_OFFSET_X = 300;
// Bir dal seviyesinden bir sonrakine (ör. depth1 → depth2) yatay mesafe —
// depth1'in omurgadan uzaklığıyla (BRANCH_OFFSET_X + BRANCH_WIDTH/2) aynı
// oranı koruyor, sadece bir önceki düğümün genişliğini de hesaba katıyor.
const LEVEL_STEP_X = BRANCH_OFFSET_X + BRANCH_WIDTH;

export type SpineSide = "left" | "right";

function childrenOf(activeNodes: DbRoadmapNode[], parentId: string): DbRoadmapNode[] {
  return activeNodes.filter((n) => n.parent_node_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
}

// Bir düğümün (ve tüm alt ağacının) dikey olarak ne kadar yer kapladığını
// hesaplıyor — derin bir alt ağaç, kendi çocuklarının toplam yüksekliği
// kadar yer kaplar (kendi tek satırlık yüksekliği değil), böylece kardeş
// dallar üst üste binmiyor.
function measureClusterHeight(node: DbRoadmapNode, activeNodes: DbRoadmapNode[]): number {
  const children = childrenOf(activeNodes, node.id);
  if (children.length === 0) return BRANCH_HEIGHT;
  const heights = children.map((c) => measureClusterHeight(c, activeNodes));
  return heights.reduce((a, b) => a + b, 0) + (children.length - 1) * BRANCH_GAP_Y;
}

function layoutBranchRecursive(
  node: DbRoadmapNode,
  activeNodes: DbRoadmapNode[],
  centerY: number,
  depth: number,
  side: SpineSide,
  parentId: string,
  parentSourceHandle: string,
  buildData: (node: DbRoadmapNode, variant: "trunk" | "branch", spineSide?: SpineSide) => Record<string, unknown>,
  nodes: Node[],
  edges: Edge[]
) {
  const dir = side === "right" ? 1 : -1;
  const centerX = dir * (TRUNK_WIDTH / 2 + BRANCH_OFFSET_X + BRANCH_WIDTH / 2 + (depth - 1) * LEVEL_STEP_X);

  nodes.push({
    id: node.id,
    type: "roadmapNode",
    position: { x: centerX - BRANCH_WIDTH / 2, y: centerY - BRANCH_HEIGHT / 2 },
    data: buildData(node, "branch", side),
  });
  edges.push({
    id: `${parentId}-${node.id}`,
    source: parentId,
    sourceHandle: parentSourceHandle,
    target: node.id,
    targetHandle: "branch",
    style: { stroke: "var(--border)", strokeWidth: 1.5, strokeDasharray: "4 4" },
  });

  const children = childrenOf(activeNodes, node.id);
  if (children.length === 0) return;

  const childHeights = children.map((c) => measureClusterHeight(c, activeNodes));
  const clusterHeight = childHeights.reduce((a, b) => a + b, 0) + (children.length - 1) * BRANCH_GAP_Y;
  let cursorY = centerY - clusterHeight / 2;
  children.forEach((child, i) => {
    const h = childHeights[i];
    const childCenterY = cursorY + h / 2;
    layoutBranchRecursive(child, activeNodes, childCenterY, depth + 1, side, node.id, "branch-out", buildData, nodes, edges);
    cursorY += h + BRANCH_GAP_Y;
  });
}

export function layoutRoadmapSpine(
  activeNodes: DbRoadmapNode[],
  buildData: (node: DbRoadmapNode, variant: "trunk" | "branch", spineSide?: SpineSide) => Record<string, unknown>
): { nodes: Node[]; edges: Edge[] } {
  const trunkNodes = activeNodes
    .filter((n) => n.parent_node_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  trunkNodes.forEach((trunk, i) => {
    const trunkCenterY = i * (TRUNK_HEIGHT + TRUNK_GAP_Y);
    const children = childrenOf(activeNodes, trunk.id);
    // Omurga düğümleri sırayla sağa/sola dallanıyor — roadmap.sh'teki gibi
    // tek yöne yığılmak yerine iki yana dağılmış, daha nefes alan bir his.
    const side: SpineSide = i % 2 === 0 ? "right" : "left";

    nodes.push({
      id: trunk.id,
      type: "roadmapNode",
      position: { x: -TRUNK_WIDTH / 2, y: trunkCenterY - TRUNK_HEIGHT / 2 },
      data: buildData(trunk, "trunk", children.length > 0 ? side : undefined),
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    });

    if (i > 0) {
      const prev = trunkNodes[i - 1];
      edges.push({
        id: `spine-${prev.id}-${trunk.id}`,
        source: prev.id,
        sourceHandle: "bottom",
        target: trunk.id,
        targetHandle: "top",
        style: { stroke: "var(--accent)", strokeWidth: 2.5 },
      });
    }

    if (children.length === 0) return;

    const childHeights = children.map((c) => measureClusterHeight(c, activeNodes));
    const clusterHeight = childHeights.reduce((a, b) => a + b, 0) + (children.length - 1) * BRANCH_GAP_Y;
    let cursorY = trunkCenterY - clusterHeight / 2;

    children.forEach((child, j) => {
      const h = childHeights[j];
      const childCenterY = cursorY + h / 2;
      layoutBranchRecursive(child, activeNodes, childCenterY, 1, side, trunk.id, "branch", buildData, nodes, edges);
      cursorY += h + BRANCH_GAP_Y;
    });
  });

  return { nodes, edges };
}
