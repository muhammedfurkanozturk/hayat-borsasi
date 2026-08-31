"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { fetchReportsForDate, periodTypeToLabel, type DbReport } from "@/lib/supabase/reports";
import { StructuredReportView } from "./StructuredReportView";

// Arşivdeki bir günü kapsayan kayıtlı AI raporlarını gösterir — salt okunur,
// raporlar düzenlenemez, sadece o gün otomatik oluşturulanı görürsün.
export function ArchivedReportView({ date, dateLabel }: { date: string; dateLabel: string }) {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DbReport[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const data = await fetchReportsForDate(supabase, user.id, date);
      if (!cancelled) {
        setReports(data);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-card p-5">
        <p className="text-sm text-muted">Yükleniyor...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-card p-5">
        <h2 className="mb-2 text-sm font-medium text-foreground">{dateLabel}</h2>
        <p className="text-sm text-muted">Bu tarih için arşivlenmiş bir AI raporu yok.</p>
      </div>
    );
  }

  return (
    <div className="modal-in flex flex-col gap-3">
      {reports.map((report) => (
        <div key={report.id} className="rounded-lg border border-border bg-surface shadow-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              {periodTypeToLabel(report.period_type)} Rapor
            </span>
            <span className="font-mono text-xs text-muted">{formatDateTime(report.created_at)}</span>
          </div>
          <StructuredReportView content={report.content_text} />
        </div>
      ))}
    </div>
  );
}
