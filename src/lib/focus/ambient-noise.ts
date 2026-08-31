// Prodpod'daki (piyasa araştırması) "lofi ses kütüphanesi" fikrinden ilham —
// ama GERÇEK lofi hip-hop müziği telif hakkı taşıyor, bu proje hiçbir zaman
// harici bir müzik/ses dosyası barındırmıyor (self-hosted font kararıyla
// aynı prensip) ve senkron YouTube kullanıcının kendi isteğiyle KAPSAM DIŞI
// bırakıldı. Bunun yerine dürüst bir alternatif: tamamen tarayıcıda,
// Web Audio API ile ANLIK ÜRETİLEN beyaz/pembe/kahverengi gürültü — gerçek,
// tanınmış akustik kavramlar (Noisli/Brain.fm gibi ticari uygulamaların da
// kullandığı), telif sorunu yok, hiçbir dosya indirilmiyor/barındırılmıyor.
export type NoiseColor = "white" | "pink" | "brown";

const BUFFER_SECONDS = 4;

function createNoiseBuffer(ctx: AudioContext, color: NoiseColor): AudioBuffer {
  const length = ctx.sampleRate * BUFFER_SECONDS;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (color === "white") {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (color === "brown") {
    // Klasik "integrasyon" tekniği — beyaz gürültünün koşan toplamı,
    // yüksek frekansları söndürür, daha derin/yumuşak bir uğultu verir.
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5; // seviyeyi diğer renklerle kabaca dengelemek için
    }
  } else {
    // Paul Kellet'in bilinen basit pembe gürültü filtresi (oktav başına
    // eşit enerji — beyazdan daha yumuşak, kahverengiden daha parlak).
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11;
    }
  }
  return buffer;
}

export class AmbientNoisePlayer {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;

  play(color: NoiseColor, volume: number) {
    this.stop();
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    const buffer = createNoiseBuffer(ctx, color);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    this.ctx = ctx;
    this.source = source;
    this.gain = gain;
  }

  setVolume(volume: number) {
    if (this.gain) this.gain.gain.value = volume;
  }

  stop() {
    this.source?.stop();
    this.source?.disconnect();
    this.gain?.disconnect();
    this.ctx?.close().catch(() => {});
    this.source = null;
    this.gain = null;
    this.ctx = null;
  }

  get isPlaying() {
    return this.source !== null;
  }
}
