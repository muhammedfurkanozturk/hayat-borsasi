"use client";

import { useEffect, useRef, useState } from "react";
import { MusicIcon } from "@/components/icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AmbientNoisePlayer, type NoiseColor } from "@/lib/focus/ambient-noise";

const COLORS: { value: NoiseColor; label: string }[] = [
  { value: "white", label: "Beyaz" },
  { value: "pink", label: "Pembe" },
  { value: "brown", label: "Kahverengi" },
];

// Bkz. ambient-noise.ts'teki üst not — bu GERÇEK lofi müzik değil, tamamen
// tarayıcıda üretilen gürültü. Seans bitince/kategoriden çıkılınca otomatik
// durduruluyor (unmount'ta cleanup).
export function FocusSoundPlayer() {
  const playerRef = useRef<AmbientNoisePlayer | null>(null);
  const [color, setColor] = useState<NoiseColor>("brown");
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    playerRef.current = new AmbientNoisePlayer();
    return () => {
      playerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (playing) playerRef.current?.play(color, volume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  function toggle() {
    if (playing) {
      playerRef.current?.stop();
      setPlaying(false);
    } else {
      playerRef.current?.play(color, volume);
      setPlaying(true);
    }
  }

  function handleVolume(v: number) {
    setVolume(v);
    playerRef.current?.setVolume(v);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-muted/20 bg-background-elevated px-4 py-2.5 text-xs">
      <div className="flex items-center gap-1.5 text-muted">
        <MusicIcon width={14} height={14} />
        Odak Sesi
      </div>
      <SegmentedControl size="sm" options={COLORS} value={color} onChange={setColor} />
      <button
        type="button"
        onClick={toggle}
        className="btn h-7 shrink-0 rounded-md bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25"
      >
        {playing ? "Durdur" : "Çal"}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => handleVolume(Number(e.target.value))}
        className="h-1.5 w-20 accent-[var(--accent)]"
        aria-label="Ses seviyesi"
      />
    </div>
  );
}
