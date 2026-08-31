"use client";

import { useState } from "react";
import { ROADMAP_TEMPLATES, type RoadmapTemplate } from "@hayat-borsasi/shared";
import { CheckIcon, CompassIcon, LightbulbIcon, PlusIcon } from "@/components/icons";
import { RoadmapProjectIdeasModal } from "./RoadmapProjectIdeasModal";

const NEW_BADGE_WINDOW_DAYS = 30;

function isRecentlyAdded(addedDate: string): boolean {
  const days = (new Date().getTime() - new Date(`${addedDate}T00:00:00`).getTime()) / (24 * 60 * 60 * 1000);
  return days <= NEW_BADGE_WINDOW_DAYS;
}

export interface ExistingRoadmapSummary {
  id: string;
  title: string;
  progress: number;
}

// roadmap.sh'in ana sayfasındaki geniş kart-ızgara seçim ekranından ilham
// (Bölüm 5, 2026-08-25) — önceki küçük pill-buton sırası yerine, her
// şablon kendi kartında (ikon + ad + konu sayısı), roadmap.sh'teki
// "Role-based Roadmaps" bölümüne benzer bir ızgara. Kod/marka
// kopyalanmadı, sadece kompozisyon. Kullanıcı kendi haritasını da
// oluşturabilsin diye (dayatma yok, bkz. CLAUDE.md bölüm 1) ızgaranın
// sonunda her zaman "Kendi Haritamı Oluştur" kartı var.
//
// 2026-08-26: kullanıcının zaten oluşturduğu haritalar (varsa) artık en
// başta kendi kartlarıyla listeleniyor — RoadmapPanel'deki "← Yol
// Haritalarım" butonuyla buraya dönüldüğünde sadece yeni harita şablonları
// değil, "Frontend"/"Backend" gibi zaten var olan haritalar arasında geçiş
// de yapılabilsin diye (kullanıcı bulgusu: geri tuşu Dashboard'a
// götürüyordu, oysa aynı kategori içindeki genel harita listesine dönmeliydi).
export function RoadmapTemplatePicker({
  existingRoadmaps = [],
  onSelectExisting,
  onPickTemplate,
  onCreateCustom,
  creating,
}: {
  existingRoadmaps?: ExistingRoadmapSummary[];
  onSelectExisting?: (roadmapId: string) => void;
  onPickTemplate: (templateKey: string) => void;
  onCreateCustom: (title: string) => void;
  creating: boolean;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [projectIdeasTemplate, setProjectIdeasTemplate] = useState<RoadmapTemplate | null>(null);

  // 2026-08-26 (kullanıcı bulgusu — gerçek bug): şablonlar hep tam listeyle
  // gösteriliyordu, kullanıcı zaten "Frontend Geliştirme"den bir harita
  // oluşturmuş olsa bile aynı isimli şablon kartı YİNE görünüyordu — ikisi
  // görsel olarak neredeyse aynı olduğu için kullanıcı yanlışlıkla şablon
  // kartına tıklayıp her seferinde YENİ bir "Frontend Geliştirme" harita
  // daha oluşturuyordu ("sonsuz harita"). Zaten var olan bir haritanın
  // adıyla eşleşen şablonlar artık ızgaradan tamamen çıkarılıyor.
  const existingTitles = new Set(existingRoadmaps.map((r) => r.title));
  const availableTemplates = ROADMAP_TEMPLATES.filter((t) => !existingTitles.has(t.name));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customTitle.trim()) return;
    onCreateCustom(customTitle.trim());
    setCustomTitle("");
    setCustomOpen(false);
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface shadow-card p-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {existingRoadmaps.length > 0 ? "Yol Haritalarım" : "Bir Yol Haritası Seç"}
        </h2>
        <p className="text-sm text-muted">
          {existingRoadmaps.length > 0
            ? "Var olan bir haritana devam et veya yeni bir tane başlat."
            : "Hazır bir şablonla başla veya kendi haritanı sıfırdan oluştur."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {existingRoadmaps.map((roadmap) => (
          <button
            key={roadmap.id}
            type="button"
            onClick={() => onSelectExisting?.(roadmap.id)}
            className="card-lift flex flex-col items-start gap-4 rounded-lg border-2 border-accent/30 bg-background-elevated p-5 text-left hover:border-accent/60"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-soft bg-accent-soft text-accent">
              {roadmap.progress >= 100 ? <CheckIcon width={20} height={20} /> : <CompassIcon width={22} height={22} />}
            </div>
            <div className="flex w-full flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">{roadmap.title}</span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
                <div className="h-full rounded-full bg-positive" style={{ width: `${roadmap.progress}%` }} />
              </div>
              <span className="font-mono text-xs text-muted">%{roadmap.progress} tamamlandı</span>
            </div>
          </button>
        ))}

        {availableTemplates.map((template) => {
          const topicCount = template.nodes.length;
          const isNew = isRecentlyAdded(template.addedDate);
          return (
            <div
              key={template.key}
              className="card-lift relative flex flex-col items-start gap-4 rounded-lg border-2 border-muted/30 bg-background-elevated p-5 text-left hover:border-accent/50"
            >
              {/* roadmap.sh'teki "New" rozeti (piyasa araştırması) — statik
                  bir liste değil, addedDate'ten otomatik hesaplanıyor. */}
              {isNew && (
                <span className="absolute right-3 top-3 rounded-full bg-positive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Yeni
                </span>
              )}
              <button type="button" onClick={() => onPickTemplate(template.key)} disabled={creating} className="btn flex w-full flex-col items-start gap-4 text-left disabled:pointer-events-none disabled:opacity-50">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-soft bg-accent-soft text-accent">
                  <CompassIcon width={22} height={22} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">{template.name}</span>
                  <span className="text-xs text-muted">
                    {topicCount} ana başlık · {template.category === "role" ? "Rol Bazlı" : "Beceri Bazlı"}
                  </span>
                </div>
              </button>
              {template.projectIdeas && template.projectIdeas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setProjectIdeasTemplate(template)}
                  className="btn flex items-center gap-1.5 rounded-lg border border-accent/30 px-2.5 py-1 text-xs text-accent hover:bg-accent-soft"
                >
                  <LightbulbIcon width={12} height={12} />
                  Proje Fikirleri
                </button>
              )}
            </div>
          );
        })}

        {customOpen ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-3 rounded-lg border-2 border-dashed border-accent/40 bg-background-elevated p-5"
          >
            <span className="text-sm font-semibold text-foreground">Kendi Haritan</span>
            <input
              autoFocus
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Harita adı, örn. Rust Öğrenme"
              className="h-10 w-full rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={creating || !customTitle.trim()}
              className="btn h-9 w-full rounded-lg bg-accent-soft px-4 text-sm font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
            >
              Oluştur
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="card-lift flex flex-col items-start justify-center gap-3 rounded-lg border-2 border-dashed border-muted/30 p-5 text-left text-muted hover:border-accent/50 hover:text-accent"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-current">
              <PlusIcon width={18} height={18} />
            </div>
            <span className="text-sm font-medium">Kendi Haritamı Oluştur</span>
          </button>
        )}
      </div>

      <RoadmapProjectIdeasModal template={projectIdeasTemplate} onClose={() => setProjectIdeasTemplate(null)} />
    </div>
  );
}
