// group-hover kullanıyoruz (kendi hover'ı değil) çünkü bu her zaman bir
// <button>'ın içine render ediliyor ve tıklama olayı o butona bağlı — bu
// span'in kendi :hover'ı olsaydı, dokunmatik tarayıcılarda ilk dokunuş
// sadece hover'ı tetikleyip click'i yutuyordu (iki dokunuş gerektiren
// klasik WebKit tuzağı). Kullanan butonun `group` class'ı olmalı.
export function CheckMark({ checked, size = 20 }: { checked: boolean; size?: number }) {
  return (
    <span
      style={{
        height: size,
        width: size,
        transitionProperty: "color, background-color, border-color, transform",
        transitionDuration: "var(--dur-base)",
        transitionTimingFunction: "var(--ease-snap)",
      }}
      className={`flex shrink-0 items-center justify-center rounded-md border-2 ${
        checked
          ? "check-pop border-positive bg-positive-soft text-positive"
          : "border-muted bg-background-elevated text-transparent group-hover:scale-105 group-hover:border-foreground"
      }`}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        style={{
          strokeDasharray: 24,
          strokeDashoffset: checked ? 0 : 24,
          transition: `stroke-dashoffset var(--dur-slow) var(--ease-snap)`,
        }}
      >
        <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
