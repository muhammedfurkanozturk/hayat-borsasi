const steps = [
  {
    title: "Kategorilerini yarat",
    description: "Girişimcilik, Sağlık, Disiplin — sana anlamlı gelen ne varsa kendi kategorini oluştur.",
  },
  {
    title: "Görevlerini ve ağırlıklarını belirle",
    description: "Her kategoriye görevler ekle, hangisi senin için ne kadar önemliyse ona göre ağırlık ver.",
  },
  {
    title: "Endeksini izle",
    description: "Günlük, haftalık, aylık, yıllık — gelişimin zaman içinde nasıl bir trend çiziyor gör.",
  },
];

export function HowItWorks() {
  return (
    <section id="nasil-calisir" className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
      <div className="mb-10 flex flex-col gap-3 text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Nasıl çalışır</span>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Üç adımda kendi endeksin
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-surface/60 p-6"
          >
            <span className="font-mono text-sm text-accent">0{i + 1}</span>
            <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
