"use client";

import { useEffect, useState } from "react";

interface SportPhoto {
  url: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
  alt: string | null;
}

// Freeletics'in "koyu/gritty sokak antrenmanı" hissine gerçek bir fotoğraf
// katmanı — Bölüm 2'de (Kategori Bazlı Tasarım Farklılaştırma) bilinçli
// olarak ertelenmişti, kullanıcının kendi Pexels API anahtarıyla eklendi
// (bkz. CLAUDE.md "eksikler" envanteri madde 5). Anahtar sadece server'da
// (/api/sport-photos, src/lib/sport/pexels.ts) kullanılıyor. Anahtar
// tanımlı değilse veya istek başarısız olursa BANNER SESSİZCE HİÇ
// RENDER OLMUYOR (bkz. `photo === null` dönüşü) — panelin geri kalanı
// zaten fotoğrafsız da tam işlevsel olduğu için bir hata mesajı göstermek
// gereksiz gürültü olurdu.
export function SportHeroBanner() {
  const [photo, setPhoto] = useState<SportPhoto | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sport-photos")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.photo) setPhoto(json.photo);
      })
      .catch((err) => console.error("Spor fotoğrafı alınamadı:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!photo) return null;

  return (
    <div className="relative h-36 w-full overflow-hidden rounded-lg border border-[color:var(--sport-border)] sm:h-44">
      {/* eslint-disable-next-line @next/next/no-img-element -- harici Pexels URL'i, next/image domain izni eklemeye değmeyecek kadar küçük/dekoratif bir kullanım */}
      <img src={photo.url} alt={photo.alt ?? ""} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--sport-bg)] via-[color:var(--sport-bg)]/20 to-transparent" />
      <a
        href={photo.pexelsUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 right-3 text-[10px] text-white/70 hover:text-white/90"
      >
        Fotoğraf: {photo.photographer} / Pexels
      </a>
    </div>
  );
}
