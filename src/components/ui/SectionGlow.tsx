// Cam panelin dışında kalan bölüm zemini düz siyah/beyaz kalmasın diye —
// panelin kendi renk kimliğiyle eşleşen, ağır bulanıklaştırılmış, geniş bir
// ışık lekesi. Panel kenarıyla zemin arasında sert bir "dikiş" oluşmasını
// önler, bir sonraki bölüme geçiş de böylece daha yumuşak hissettirir.
export function SectionGlow({ rgb }: { rgb: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 h-[75vh] w-[85vw] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
      style={{ background: `radial-gradient(circle, rgba(${rgb},0.16) 0%, transparent 72%)`, filter: "blur(90px)" }}
    />
  );
}
