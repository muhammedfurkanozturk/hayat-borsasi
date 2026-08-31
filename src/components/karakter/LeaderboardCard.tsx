import { getTier } from "./CharacterCard";

const MONTH_FORMATTER = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

function currentMonthRangeLabel() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${MONTH_FORMATTER.format(start)} – ${MONTH_FORMATTER.format(end)}`;
}

// 21st.dev'in LeaderboardCard'ından ilham (Bölüm 7, 2026-08-25) — kod
// birebir kopyalanmadı, zinc/shadcn token'ları yerine bizim sistemimize
// çevrildi. Bağımlı olduğu LeaderboardPodium/LeaderboardRankings alt-
// component'lerinin kodu paylaşılmamıştı, burada kendi (Recharts değil,
// düz Tailwind) sade versiyonları kuruldu.
//
// ÖNEMLİ DÜRÜSTLÜK NOTU: Proje henüz gerçek çok-kullanıcılı bir sıralamaya
// sahip değil (bkz. CharacterCard.tsx'teki "Sıralama: #1" notu) — burada
// başka kullanıcılar için UYDURMA isim/skor YOK. Gerçek kullanıcı kendi
// gerçek verisiyle #1 gösteriliyor, kalan sıralar "iskelet" (boş,
// kesikli çerçeveli) placeholder — kullanıcı bunu onayladı ("kişisel trend
// şimdi + iskelet leaderboard"). Görünürlük "varsayılan açık" olacak
// şekilde karar verildi ama henüz gizleyecek başka kullanıcı olmadığından
// işlevsiz bir aç/kapa kontrolü EKLENMEDİ — çok-kullanıcı geldiğinde
// eklenecek.
export function LeaderboardCard({
  currentUser,
}: {
  currentUser: { name: string; initial: string; score: number };
}) {
  const tier = getTier(currentUser.score);

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface shadow-card p-5">
      <div>
        <h2 className="text-sm font-medium text-foreground">Aylık Sıralama</h2>
        <p className="text-xs text-muted">{currentMonthRangeLabel()}</p>
      </div>

      {/* Podyum — sadece gerçek kullanıcı dolu, 2. ve 3. sıra iskelet. */}
      <div className="grid grid-cols-3 items-end gap-2">
        <PodiumSlot rank={2} empty />
        <PodiumSlot rank={1} name={currentUser.name} initial={currentUser.initial} score={currentUser.score} tierLabel={tier.label} />
        <PodiumSlot rank={3} empty />
      </div>

      {/* Sıralama listesi */}
      <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft">
        <div className="ledger-row flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex items-center gap-3">
            <span className="w-5 text-center font-mono text-sm font-semibold text-accent">#1</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {currentUser.initial}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
              <span className="text-xs text-muted">{tier.label} Tier</span>
            </div>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{Math.round(currentUser.score)}</span>
        </div>

        {[2, 3, 4].map((rank) => (
          <div key={rank} className="ledger-row flex items-center gap-3 px-3 py-2.5 opacity-40">
            <span className="w-5 text-center font-mono text-sm font-semibold text-muted">#{rank}</span>
            <div className="h-8 w-8 rounded-full border border-dashed border-muted/40" />
            <span className="text-sm text-muted">Henüz kimse yok</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-soft">
        Diğer kullanıcılar katıldıkça burada sıralanacak — skorun varsayılan olarak herkese açık görünür.
      </p>
    </div>
  );
}

function PodiumSlot({
  rank,
  name,
  initial,
  score,
  tierLabel,
  empty = false,
}: {
  rank: 1 | 2 | 3;
  name?: string;
  initial?: string;
  score?: number;
  tierLabel?: string;
  empty?: boolean;
}) {
  const height = rank === 1 ? "h-24" : "h-16";
  return (
    <div className="flex flex-col items-center gap-2">
      {empty ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted/30 text-xs text-muted">
          ?
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-accent text-base font-bold text-white">
          {initial}
        </div>
      )}
      <span className="max-w-full truncate text-xs font-medium text-foreground">{empty ? "—" : name}</span>
      {!empty && tierLabel && <span className="text-[10px] uppercase tracking-wider text-muted">{tierLabel}</span>}
      <div
        className={`flex w-full items-center justify-center rounded-lg border-2 ${height} ${
          empty ? "border-dashed border-muted/25 bg-transparent" : "border-accent/40 bg-accent-soft"
        }`}
      >
        <span className={`font-mono text-lg font-bold ${empty ? "text-muted" : "text-accent"}`}>
          {empty ? "" : Math.round(score ?? 0)}
        </span>
      </div>
      <span className="font-mono text-xs text-muted">#{rank}</span>
    </div>
  );
}
