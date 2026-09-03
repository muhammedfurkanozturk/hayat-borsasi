"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { formatDaysAgo, todayIso } from "@hayat-borsasi/shared";
import { BookmarkIcon, CheckIcon, PencilIcon, StarIcon } from "@/components/icons";
import type { SpineSide } from "./layout";

export interface RoadmapNodeData extends Record<string, unknown> {
  title: string;
  completed: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
  variant: "trunk" | "branch";
  // trunk: dallarının hangi yana açıldığı (varsa). branch: hangi omurga
  // yanına ait olduğu — kendi bağlantı noktasını (Handle) doğru tarafa
  // koymak için.
  spineSide?: SpineSide;
  // Onepin ilhamı (Madde 8) — bkz. RoadmapNodeDetailModal.
  isMilestone: boolean;
  targetDate: string | null;
  // roadmap.sh keşif eki (Madde 9) — bkz. RoadmapNodeDetailModal.
  bookmarked: boolean;
  // "eksikler" envanteri madde 5 — zaman etiketi (ne zaman tamamlandığı).
  completedAt: string | null;
  // "eksikler" envanteri madde 5 — el-çizimi vurgu: pre-order sırasında
  // İLK tamamlanmamış düğüm ("şu an sırada bu var"), RoadmapPanel'de
  // flattenPreOrder ile hesaplanıyor.
  isCurrentFocus: boolean;
  // "eksikler" envanteri madde 5 — dal başına renk rotasyonu: 1=omurgaya
  // en yakın dal, 2=onun çocuğu, vb. (RoadmapPanel'de layoutRoadmapSpine'ın
  // depth parametresinden geliyor). Sadece "branch" variant'ı için anlamlı.
  branchDepth: number;
}

const handleDot = "!h-2 !w-2 !border-2 !border-background !bg-border";

// "eksikler" envanteri madde 5 — "her dal seviyesi için FARKLI pastel ton"
// (önceden ertelenmişti, bkz. CLAUDE.md Bölüm 6). Omurganın kendi leylağıyla
// (--accent) başlayıp, bir sonraki dal seviyesinde pembe, ondan sonra
// maviye dönüyor, 4. seviye + tekrar leylağa sarıyor (modulo).
const BRANCH_PALETTE = ["#a78bfa", "#f9a8d4", "#93c5fd"];

// roadmap.sh'in gerçek yapısına (2026-08-26, tarayıcıdan canlı incelendi)
// göre iki ayrı düğüm tipi: "trunk" (omurga — İnternet, HTML, CSS gibi ana
// sıra, bakır/dolu) ve "branch" (dal — alt konular, daha soluk/ikincil).
// Tamamlanma artık gövde içinde bir ikon değil, köşede küçük, roadmap.sh'in
// kendi tamamlanma rozetlerini anımsatan dairesel bir rozet.
export function RoadmapNode({ data }: NodeProps) {
  const {
    title,
    completed,
    onToggle,
    onOpenDetail,
    variant,
    spineSide,
    isMilestone,
    targetDate,
    bookmarked,
    completedAt,
    isCurrentFocus,
    branchDepth,
  } = data as unknown as RoadmapNodeData;
  const isTrunk = variant === "trunk";
  const isOverdue = !completed && targetDate != null && targetDate < new Date().toISOString().slice(0, 10);
  const branchColor = BRANCH_PALETTE[((branchDepth ?? 1) - 1) % BRANCH_PALETTE.length];

  return (
    // Madde 8'de eklenen "Düğüm detayı" düzenleme butonu bu elemanın İÇİNDE
    // yaşıyor — <button> içine <button> koymak geçersiz HTML (hydration
    // hatası, tıklamalar öngörülemez davranıyordu, test sırasında bulundu).
    // Kök eleman bu yüzden erişilebilir bir div'e çevrildi (role/tabIndex/
    // onKeyDown ile klavye desteği korunuyor).
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      style={!isTrunk ? ({ "--branch-color": branchColor } as React.CSSProperties) : undefined}
      className={`group relative flex cursor-pointer items-center justify-center border-2 text-center transition-colors ${
        isTrunk
          ? `rounded-full px-4 py-3.5 text-sm font-semibold ${
              completed
                ? "border-positive bg-positive text-white"
                : "border-accent bg-accent text-accent-foreground hover:brightness-110"
            }`
          : `rounded-lg px-3 py-2 text-xs font-medium ${
              completed
                ? "border-positive/50 bg-positive-soft text-positive"
                : "border-[color:var(--branch-color)]/35 bg-[color:var(--branch-color)]/12 text-foreground hover:border-[color:var(--branch-color)]/60"
            }`
      }`}
    >
      {/* "eksikler" envanteri madde 5 — el-çizimi vurgu: sıradaki (pre-order
          ilk tamamlanmamış) düğümü, roadmap.sh/Onepin'de olmayan, elle
          çizilmiş bir daireyle "şu an buna odaklanıyorum" diye işaretliyor.
          Kesin geometrik bir daire değil, hafif düzensiz bir bezier — sabit,
          animasyonsuz (dikkat dağıtmasın diye). */}
      {isCurrentFocus && !completed && (
        // Trunk'ın kendi dolu leylağı/dalın pastel tonuyla karışmasın diye
        // bilinçli olarak paletteki HİÇBİR rengi kullanmıyor — gerçek bir
        // el-çizimi vurgu gibi sıcak/kontrast bir sarı-turuncu (highlighter
        // kalem hissi).
        <svg
          viewBox="0 0 100 60"
          className="pointer-events-none absolute -inset-x-3 -inset-y-2.5"
          style={{ transform: "rotate(-1.5deg)", color: "#f5b400" }}
          aria-hidden="true"
        >
          <path
            d="M 8,32 C 6,14 24,3 50,4 C 78,2 95,13 93,31 C 96,49 76,57 49,56 C 23,58 5,50 8,32 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      )}

      {isTrunk ? (
        <>
          <Handle type="target" position={Position.Top} id="top" className={handleDot} />
          <Handle type="source" position={Position.Bottom} id="bottom" className={handleDot} />
          {spineSide && (
            <Handle
              type="source"
              position={spineSide === "right" ? Position.Right : Position.Left}
              id="branch"
              className={handleDot}
            />
          )}
        </>
      ) : (
        spineSide && (
          <>
            {/* Ebeveyne (omurga veya bir üst dal) bakan giriş noktası. */}
            <Handle
              type="target"
              position={spineSide === "right" ? Position.Left : Position.Right}
              id="branch"
              className={handleDot}
            />
            {/* Omurgadan uzağa bakan çıkış noktası — bu dalın kendi alt
                dalları (3. seviye ve ötesi) varsa buradan bağlanıyor.
                Alt dalı olmayan yapraklar için kullanılmıyor, zararsız. */}
            <Handle
              type="source"
              position={spineSide === "right" ? Position.Right : Position.Left}
              id="branch-out"
              className={handleDot}
            />
          </>
        )
      )}

      {/* roadmap.sh'teki köşe rozeti — tamamlandıysa dolu yeşil, değilse
          kesikli çerçeveli boş daire. */}
      <span
        className={`absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border ${
          completed ? "border-positive bg-positive text-white" : "border-dashed border-muted/40 bg-background"
        }`}
      >
        {completed && <CheckIcon width={9} height={9} strokeWidth={3} />}
      </span>

      {/* Onepin'in "kilometre taşı" fikri — kullanıcı işaretlediği önemli
          düğümler için köşede altın bir yıldız. */}
      {isMilestone && (
        <span className="absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-pro bg-pro text-white">
          <StarIcon width={9} height={9} strokeWidth={0} fill="currentColor" />
        </span>
      )}

      {/* roadmap.sh keşif eki — "sonra bakacağım" anlamına gelen yer
          işareti, kilometre taşından (başarı) kasıtlı olarak farklı bir
          köşede/renk kimliğinde. */}
      {bookmarked && (
        <span className="absolute -bottom-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-accent bg-accent text-accent-foreground">
          <BookmarkIcon width={8} height={8} strokeWidth={0} fill="currentColor" />
        </span>
      )}

      <span className="flex flex-col items-center gap-0.5">
        <span className="whitespace-nowrap">{title}</span>
        {targetDate && !completed && (
          <span className={`font-mono text-[9px] tabular-nums ${isOverdue ? "text-negative" : "opacity-70"}`}>
            {targetDate.slice(5).split("-").reverse().join(".")}
          </span>
        )}
        {/* "eksikler" envanteri madde 5 — zaman etiketi. completed_at
            migration'ı (20260903090000) henüz uygulanmamışsa completedAt
            null geliyor, etiket sessizce hiç görünmüyor. */}
        {completed && completedAt && (
          <span className="text-[9px] opacity-70">{formatDaysAgo(completedAt.slice(0, 10), todayIso())}</span>
        )}
      </span>

      {/* Detay/düzenleme — tıklama tamamlanmayı değiştirmesin diye
          stopPropagation. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetail();
        }}
        aria-label="Düğüm detayı"
        className="btn absolute -bottom-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted opacity-0 hover:text-accent group-hover:opacity-100"
      >
        <PencilIcon width={8} height={8} />
      </button>
    </div>
  );
}
