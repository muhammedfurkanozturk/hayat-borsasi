import { parseStructuredReport, type ReportTone } from "@hayat-borsasi/shared";
import { AlertTriangleIcon, CheckIcon, LightbulbIcon, XIcon } from "@/components/icons";

const TONE_STYLES: Record<ReportTone, { color: string; soft: string; Icon: typeof CheckIcon }> = {
  pozitif: { color: "var(--positive)", soft: "var(--positive-soft)", Icon: CheckIcon },
  notr: { color: "var(--muted)", soft: "var(--border-soft)", Icon: LightbulbIcon },
  uyari: { color: "var(--pro)", soft: "var(--pro-soft)", Icon: AlertTriangleIcon },
  negatif: { color: "var(--negative)", soft: "var(--negative-soft)", Icon: XIcon },
};

// İçerik, "- " ile başlayan satırları madde listesi olarak, ardışık düz
// satırları paragraf olarak gruplar — Claude bazen bir giriş cümlesi +
// ardından madde listesi karışımı üretiyor (bkz. claude.ts'teki sistem
// promptu), tek tip bir biçim zorlanmıyor.
function ReportSectionBody({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];

  for (const line of lines) {
    const isBullet = line.trim().startsWith("- ");
    const type = isBullet ? "ul" : "p";
    const content = isBullet ? line.trim().replace(/^- /, "") : line.trim();
    const last = blocks[blocks.length - 1];
    if (last && last.type === type) {
      last.lines.push(content);
    } else {
      blocks.push({ type, lines: [content] });
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground">
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={i} className="flex flex-col gap-1 pl-4">
            {block.lines.map((line, j) => (
              <li key={j} className="list-disc">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>{block.lines.join(" ")}</p>
        )
      )}
    </div>
  );
}

// AI Rapor'un yapılandırılmış JSON çıktısını (bkz. claude.ts) kutucuklu,
// tona göre renklenen kartlar olarak gösterir. `content` geçerli JSON
// DEĞİLSE (eski düz-metin arşiv kayıtları ya da beklenmedik bir Claude
// cevabı) sessizce eski düz-paragraf görünümüne düşer — hem web hem
// mobil aynı parseStructuredReport'u (packages/shared) kullanıyor.
export function StructuredReportView({ content }: { content: string }) {
  const structured = parseStructuredReport(content);

  if (!structured) {
    return <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{content}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold leading-relaxed text-foreground">{structured.durum_ozeti}</p>
      <div className="flex flex-col gap-2.5">
        {structured.bolumler.map((bolum, i) => {
          const tone = TONE_STYLES[bolum.ton] ?? TONE_STYLES.notr;
          const Icon = tone.Icon;
          return (
            <div
              key={i}
              className="flex flex-col gap-1.5 rounded-lg border-l-4 bg-background-elevated p-3.5"
              style={{ borderLeftColor: tone.color, backgroundColor: tone.soft }}
            >
              <div className="flex items-center gap-2">
                <Icon width={14} height={14} style={{ color: tone.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tone.color }}>
                  {bolum.baslik}
                </span>
              </div>
              <ReportSectionBody text={bolum.icerik} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
