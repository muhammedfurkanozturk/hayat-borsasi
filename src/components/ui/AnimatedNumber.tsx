"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

// B-fit'teki (piyasa araştırması) "count-up" sayaç fikri — bir değer
// değiştiğinde rakam sıçramak yerine mevcut --ease-snap eğrisiyle akıcı
// sayarak değişiyor. Proje zaten `motion` paketini kullanıyor, ek
// bağımlılık gerekmedi.
export function AnimatedNumber({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}
