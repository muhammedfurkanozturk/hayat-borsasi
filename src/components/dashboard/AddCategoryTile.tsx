"use client";

import Link from "next/link";
import { useState } from "react";
import { ONBOARDING_TEMPLATES, type OnboardingTemplate } from "@hayat-borsasi/shared";
import { AppIcon, ArrowLeftIcon, LockIcon, PlusIcon, iconLabels, iconPalette, type IconKey } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import { useAppData } from "@/lib/supabase/app-data-context";
import { useProfile } from "@/lib/supabase/profile-context";

const iconOptions = Object.keys(iconPalette) as IconKey[];
export const FREE_CATEGORY_LIMIT = 6;

export function AddCategoryTile({ emptyState = false }: { emptyState?: boolean }) {
  const { addCategory, addCategoriesFromTemplates, categories } = useAppData();
  const { isPro } = useProfile();
  const [open, setOpen] = useState(false);
  // "templates" — hazır özelleştirilmiş kategori kartları (Beslenme, Spor,
  // Seyahat vb.) + "kendi kategorimi oluştur" seçeneği burada. Kullanıcı
  // "otomatik olmalı, kategori eklerken hazır kategoriler de çıkmalı" dedi
  // (2026-09-02) — önceden bu şablonlar SADECE hesap açılışındaki /onboarding
  // ekranında vardı, normal "Kategori Ekle" akışında hiç görünmüyordu.
  const [step, setStep] = useState<"templates" | "custom">("templates");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [icon, setIcon] = useState<IconKey>("star");
  const [saving, setSaving] = useState(false);
  const [addingTemplateKey, setAddingTemplateKey] = useState<string | null>(null);

  const limitReached = !isPro && categories.length >= FREE_CATEGORY_LIMIT;
  // Zaten o modüle sahipse (örn. bir "Seyahat" kategorisi varsa) aynı
  // şablonu tekrar önermiyoruz — RoadmapTemplatePicker'daki "var olanı
  // filtrele" deseniyle aynı mantık.
  const availableTemplates = ONBOARDING_TEMPLATES.filter(
    (t) => !categories.some((c) => c.moduleType === t.moduleType)
  );

  function close() {
    setOpen(false);
    setStep("templates");
    setName("");
    setNameTouched(false);
    setIcon("star");
    setAddingTemplateKey(null);
  }

  function pickIcon(key: IconKey) {
    setIcon(key);
    // Kullanıcı adı kendi yazmadıysa, seçtiği ikonun adını isim alanına
    // öneri olarak yazıyoruz — istersen üzerine yazıp değiştirebilirsin.
    if (!nameTouched) setName(iconLabels[key]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addCategory(name, icon);
    setSaving(false);
    close();
  }

  async function handleAddTemplate(template: OnboardingTemplate) {
    setAddingTemplateKey(template.key);
    await addCategoriesFromTemplates([{ name: template.name, icon: template.icon, moduleType: template.moduleType }]);
    setAddingTemplateKey(null);
    close();
  }

  return (
    <>
      {emptyState ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-accent/40 bg-accent-soft px-6 py-10 text-accent hover:border-accent/60 hover:bg-accent/25"
        >
          <PlusIcon width={22} height={22} />
          <span className="text-base font-semibold">Kategori Eklemeye Başla</span>
        </button>
      ) : limitReached ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          // CategoryTile.tsx'teki gerçek kategori kartlarıyla aynı satırı
          // paylaştığı için sabit bir piksel yüksekliği tahmin etmek yerine
          // (2026-08-26'da denendi, dar ekranlarda CategoryTile'ın içeriği
          // daha uzun olduğunda hâlâ küçük kalıyordu) grid'in doğal
          // items-stretch davranışına bırakıldı: h-full, satırdaki en uzun
          // kart neyse ona eşitler; min-h sadece tek başına kaldığı satırlarda
          // bir taban değer.
          className="btn flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-pro/50 bg-pro-soft text-pro hover:border-pro/70"
        >
          <LockIcon width={22} height={22} />
          <span className="text-sm font-semibold">Pro&apos;ya Geç</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted shadow-sm hover:border-accent/40 hover:text-accent"
        >
          <PlusIcon width={22} height={22} />
          <span className="text-sm font-medium">Kategori Ekle</span>
        </button>
      )}

      <Modal
        open={open && limitReached}
        onClose={close}
        panelClassName="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-background-elevated p-6 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pro-soft text-pro">
          <LockIcon width={26} height={26} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-foreground">Ücretsiz kategori limitine ulaştın</p>
          <p className="text-sm text-muted">
            Ücretsiz planda en fazla {FREE_CATEGORY_LIMIT} kategori oluşturabilirsin. Sınırsız
            kategori için Pro&apos;ya geç.
          </p>
        </div>
        <div className="flex w-full gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className="btn flex-1 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
          >
            Vazgeç
          </button>
          <Link
            href="/pro"
            onClick={close}
            className="btn flex-1 rounded-lg bg-pro px-3 py-2 text-sm font-semibold text-pro-foreground hover:opacity-90"
          >
            Pro&apos;ya Geç
          </Link>
        </div>
      </Modal>

      <Modal
        open={open && !limitReached}
        onClose={close}
        panelClassName="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-background-elevated p-4 sm:p-6"
      >
        {step === "templates" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-foreground">Yeni Kategori</h2>
              <p className="text-xs text-muted">
                Hazır, özelleştirilmiş bir kategoriyle başla ya da kendi kategorini elle oluştur.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {availableTemplates.length > 0 && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {availableTemplates.map((template) => {
                    const isAdding = addingTemplateKey === template.key;
                    return (
                      <button
                        key={template.key}
                        type="button"
                        onClick={() => handleAddTemplate(template)}
                        disabled={addingTemplateKey !== null}
                        className="btn flex items-start gap-3 rounded-lg border-2 border-border-soft bg-surface p-4 text-left shadow-sm transition-colors hover:border-accent/50 hover:bg-accent-soft disabled:pointer-events-none disabled:opacity-60"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                          <AppIcon name={template.icon} width={18} height={18} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-foreground">
                            {isAdding ? "Ekleniyor..." : template.name}
                          </span>
                          <span className="text-xs leading-relaxed text-muted">{template.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep("custom")}
                className="btn mt-2.5 flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-border p-4 text-left text-muted hover:border-accent/40 hover:text-accent"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface">
                  <PlusIcon width={18} height={18} />
                </div>
                <span className="text-sm font-medium">Kendi Kategorimi Oluştur</span>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={close}
                className="btn rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
              >
                Vazgeç
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep("templates")}
                className="btn rounded-lg p-1.5 text-muted hover:text-foreground"
                aria-label="Şablonlara dön"
              >
                <ArrowLeftIcon width={16} height={16} />
              </button>
              <h2 className="text-base font-semibold text-foreground">Kendi Kategorimi Oluştur</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category-name" className="text-xs text-muted">
                  Kategori adı
                </label>
                <input
                  id="category-name"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameTouched(true);
                  }}
                  placeholder="örn. Finans"
                  className="rounded-lg border border-border-soft bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent/50"
                />
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <span className="text-xs text-muted">İkon seç</span>
                <div className="grid min-h-0 flex-1 grid-cols-4 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-6 sm:gap-3 md:grid-cols-8">
                  {iconOptions.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => pickIcon(key)}
                      title={iconLabels[key]}
                      className={`btn flex h-12 w-12 items-center justify-center rounded-lg border-2 sm:h-14 sm:w-14 ${
                        icon === key
                          ? "border-accent/60 bg-accent-soft text-accent"
                          : "border-border-soft text-muted hover:border-border hover:text-foreground"
                      }`}
                    >
                      <AppIcon name={key} width={22} height={22} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={close}
                  className="btn rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  {saving ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
