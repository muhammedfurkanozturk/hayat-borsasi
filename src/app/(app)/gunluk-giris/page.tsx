"use client";

import { useState } from "react";
import { NoteArchive } from "@/components/gunluk/NoteArchive";
import { TopNoteEditor } from "@/components/gunluk/TopNoteEditor";
import type { EditTarget } from "@/components/gunluk/types";
import { PageHeader } from "@/components/layout/PageHeader";

export default function GunluklerPage() {
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Günlükler" subtitle="Bugünü ve geçmiş günleri kelimelere dök" />

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <TopNoteEditor editTarget={editTarget} onEditConsumed={() => setEditTarget(null)} />
        <NoteArchive onEdit={setEditTarget} />
      </main>
    </div>
  );
}
