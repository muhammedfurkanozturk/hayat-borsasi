"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
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
}

const handleDot = "!h-2 !w-2 !border-2 !border-background !bg-border";

// roadmap.sh'in gerçek yapısına (2026-08-26, tarayıcıdan canlı incelendi)
// göre iki ayrı düğüm tipi: "trunk" (omurga — İnternet, HTML, CSS gibi ana
// sıra, bakır/dolu) ve "branch" (dal — alt konular, daha soluk/ikincil).
// Tamamlanma artık gövde içinde bir ikon değil, köşede küçük, roadmap.sh'in
// kendi tamamlanma rozetlerini anımsatan dairesel bir rozet.
export function RoadmapNode({ data }: NodeProps) {
  const { title, completed, onToggle, onOpenDetail, variant, spineSide, isMilestone, targetDate, bookmarked } =
    data as unknown as RoadmapNodeData;
  const isTrunk = variant === "trunk";
  const isOverdue = !completed && targetDate != null && targetDate < new Date().toISOString().slice(0, 10);

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
      className={`group relative flex cursor-pointer items-center justify-center rounded-lg border-2 text-center transition-colors ${
        isTrunk
          ? `px-4 py-3.5 text-sm font-semibold ${
              completed
                ? "border-positive bg-positive text-white"
                : "border-accent bg-accent text-accent-foreground hover:brightness-110"
            }`
          : `px-3 py-2 text-xs font-medium ${
              completed
                ? "border-positive/50 bg-positive-soft text-positive"
                : "border-accent/30 bg-accent-soft/50 text-foreground hover:border-accent/50"
            }`
      }`}
    >
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
        {targetDate && (
          <span className={`font-mono text-[9px] tabular-nums ${isOverdue ? "text-negative" : "opacity-70"}`}>
            {targetDate.slice(5).split("-").reverse().join(".")}
          </span>
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
