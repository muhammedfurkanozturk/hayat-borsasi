"use client";

// Acloset'in "Smart Detector" özelliğinden (piyasa araştırması) ilham —
// bir ayna selfisindeki her parçayı Claude'un verdiği YAKLAŞIK konuma göre
// kırpıp, sonra TAMAMEN İSTEMCİ TARAFINDA (kullanıcıya soruldu, onaylandı)
// @imgly/background-removal ile arka planını kaldırıyor. Fotoğraf hiçbir
// zaman üçüncü bir servise gitmiyor — sadece Claude'a analiz için (mevcut
// tek-parça akışıyla aynı, zaten kabul edilmiş bir veri yolu).

const MIN_FRACTION = 0.05; // %5'ten küçük bir kutu muhtemelen hatalı tahmin

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi."));
    img.src = URL.createObjectURL(file);
  });
}

// Konum tahmini KESİN DEĞİL (bkz. mirror-selfie-analysis.ts) — bu yüzden
// geniş bir kenar payıyla (%4) kırpıyoruz ve kutu anlamsız derecede
// küçükse (muhtemelen hatalı tahmin) tüm fotoğrafa düşüyoruz, parçayı hiç
// kaybetmiyoruz.
export async function cropImageToBox(
  file: File,
  box: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const img = await loadImage(file);
  const padding = 0.04;

  const useFullImage = box.width < MIN_FRACTION || box.height < MIN_FRACTION;
  const x0 = useFullImage ? 0 : Math.max(0, box.x - padding);
  const y0 = useFullImage ? 0 : Math.max(0, box.y - padding);
  const x1 = useFullImage ? 1 : Math.min(1, box.x + box.width + padding);
  const y1 = useFullImage ? 1 : Math.min(1, box.y + box.height + padding);

  const sx = x0 * img.naturalWidth;
  const sy = y0 * img.naturalHeight;
  const sw = Math.max(1, (x1 - x0) * img.naturalWidth);
  const sh = Math.max(1, (y1 - y0) * img.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kırpma için canvas oluşturulamadı.");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  URL.revokeObjectURL(img.src);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Kırpma başarısız oldu."))), "image/png");
  });
}

// @imgly/background-removal WASM tabanlı ve ağır (birkaç MB model dosyası
// indiriyor) — dinamik import ile sadece gerçekten kullanılınca yükleniyor,
// ana bundle'ı şişirmiyor.
export async function removeBackgroundFromBlob(blob: Blob): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");
  return removeBackground(blob);
}
