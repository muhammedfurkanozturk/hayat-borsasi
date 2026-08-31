"use client";

import type { RoadmapTemplate } from "@hayat-borsasi/shared";
import { Modal } from "@/components/ui/Modal";

const DIFFICULTY_STYLES: Record<string, string> = {
  Başlangıç: "border-positive/30 bg-positive-soft text-positive",
  Orta: "border-pro/30 bg-pro-soft text-pro",
  İleri: "border-negative/30 bg-negative-soft text-negative",
};

// roadmap.sh'in "Proje Fikirleri" bölümünden (piyasa araştırması, WebFetch —
// roadmap.sh/frontend/projects) ilham — gerçek format (zorluk + kategori
// etiketi + kısa başlık + tek cümlelik açıklama) korunuyor, içerik kendi
// yazıldı (kopyalanmadı). Sadece görüntüleme amaçlı — projeyi "yaptım"
// işaretlemek gibi bir takip mekanizması YOK, kapsam dışı bırakıldı (roadmap
// düğümleriyle karıştırılmasın diye, bunlar tamamen ayrı, statik bir esin
// listesi).
export function RoadmapProjectIdeasModal({ template, onClose }: { template: RoadmapTemplate | null; onClose: () => void }) {
  return (
    <Modal
      open={template !== null}
      onClose={onClose}
      panelClassName="flex max-h-[80vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-background-elevated p-5"
    >
      {template && (
        <>
          <div>
            <h3 className="text-base font-semibold text-foreground">{template.name} — Proje Fikirleri</h3>
            <p className="text-xs text-muted">Pratik yapmak için fikir — bunlar takip edilen düğümler değil, sadece ilham.</p>
          </div>
          <div className="flex flex-col gap-2">
            {(template.projectIdeas ?? []).map((idea) => (
              <div key={idea.title} className="flex flex-col gap-1.5 rounded-lg border-2 border-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_STYLES[idea.difficulty]}`}>
                    {idea.difficulty}
                  </span>
                  <span className="rounded-full border border-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted">
                    {idea.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">{idea.title}</span>
                <p className="text-xs text-muted">{idea.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
