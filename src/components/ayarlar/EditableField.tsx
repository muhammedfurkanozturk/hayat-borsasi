"use client";

import { useState } from "react";
import { PencilIcon } from "@/components/icons";

export function EditableField({
  label,
  value,
  placeholder,
  type = "text",
  onSave,
  successMessage,
  validate,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onSave: (value: string) => Promise<{ error: string | null }>;
  successMessage?: string;
  validate?: (value: string) => string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function open() {
    setDraft(value);
    setError(null);
    setSuccess(false);
    setEditing(true);
  }

  async function handleSave() {
    const validationError = validate?.(draft.trim());
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    const { error } = await onSave(draft);
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    if (successMessage) {
      setSuccess(true);
    } else {
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={open}
        className="btn flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-background-elevated px-3 py-2.5 text-left hover:border-accent/50"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs text-muted">{label}</span>
          <span className={`truncate text-sm ${value ? "text-foreground" : "text-muted-soft"}`}>
            {value || "Belirtilmemiş"}
          </span>
        </div>
        <PencilIcon width={14} height={14} className="shrink-0 text-muted" />
      </button>
    );
  }

  return (
    <div className="popover-in flex flex-col gap-2 rounded-lg border-2 border-accent/50 bg-background-elevated px-3 py-2.5">
      <span className="text-xs text-muted">{label}</span>

      {success ? (
        <p className="text-sm text-positive">{successMessage}</p>
      ) : (
        <>
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
          {error && <p className="text-xs text-negative">{error}</p>}
        </>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="btn rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          {success ? "Kapat" : "Vazgeç"}
        </button>
        {!success && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        )}
      </div>
    </div>
  );
}
