"use client";

import { useEffect, useRef } from "react";

// Klasik Perlin/Simplex gürültüsü — parçacıklar rastgele sıçramak yerine
// akışkan, organik bir yönde sürükleniyor. Sabit permütasyon tablosu, standart
// Perlin referans implementasyonu (Ken Perlin, kamu malı algoritma).
function createNoise() {
  const permutation = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
    36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
    234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
    230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
    124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
    47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
    154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
    108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
    239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243,
    141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];

  const p = new Array(512);
  for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];

  function fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }
  function grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  return {
    simplex3(x: number, y: number, z: number) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;

      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);

      const u = fade(x);
      const v = fade(y);
      const w = fade(z);

      const A = p[X] + Y;
      const AA = p[A] + Z;
      const AB = p[A + 1] + Z;
      const B = p[X + 1] + Y;
      const BA = p[B] + Z;
      const BB = p[B + 1] + Z;

      return lerp(
        w,
        lerp(
          v,
          lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
          lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))
        ),
        lerp(
          v,
          lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
          lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))
        )
      );
    },
  };
}

interface Particle {
  x: number;
  y: number;
  size: number;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
  angle: number;
  noiseOffset: number;
}

// Motion.dev'in scroll-linked animasyonlarıyla (whileInView) aynı anda 60fps
// koşan, sabit tam-ekran bir canvas — her karede 150+ parçacık için Simplex
// gürültüsü hesaplamak CPU'yu zorluyordu ve kaydırırken fark edilir bir
// kasmaya yol açıyordu. Yön açısını HER karede değil birkaç karede bir
// (NOISE_UPDATE_EVERY) yeniden hesaplayıp aradaki karelerde son bilinen
// açıyla devam ederek gürültü maliyetini ~4'te 1'e indiriyoruz — göz,
// aradaki karelerde hareketin sabit hızla sürdüğünü ayırt edemiyor.
const NOISE_UPDATE_EVERY = 4;

// Uygulamanın accent rengiyle eşleşen, temaya göre otomatik uyan, canlı bir
// kayan parçacık dokusu. Landing sayfasında TEK bir kez, sayfanın en dışında
// render edilir ve `position: fixed` ile ekrana sabitlenir — her bölümün
// kendi ayrı canvas'ı OLMAZ, aksi halde bölüm sınırlarında parçacık akışı
// kesilip görünmez bir "dikiş" oluşuyordu. Sabit tek katman sayesinde
// bölümler üstünden kaydıkça parçacıklar kesintisiz, aynı akışta devam eder.
export function ParticlesBackground({
  particleCount = 170,
  className = "",
}: {
  particleCount?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const noise = createNoise();
    let raf = 0;
    const noiseIntensity = 0.0022;
    const particleSize = { min: 0.8, max: 3.2 };

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();

    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * (particleSize.max - particleSize.min) + particleSize.min,
      velocity: { x: 0, y: 0 },
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 50,
      angle: 0,
      // Parçacıkları NOISE_UPDATE_EVERY kareye eşit dağıtıyoruz ki hepsi
      // aynı karede birden gürültü hesaplamasın (CPU yükü karelere yayılır).
      noiseOffset: i % NOISE_UPDATE_EVERY,
    }));

    let frame = 0;

    function animate() {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const [r, g, b] = isLight ? [0, 113, 227] : [10, 209, 235];
      const t = frame * 0.0027;

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const particle of particles) {
        particle.life += 1;
        if (particle.life > particle.maxLife) {
          particle.life = 0;
          particle.x = Math.random() * canvas!.width;
          particle.y = Math.random() * canvas!.height;
        }

        const opacity = Math.sin((particle.life / particle.maxLife) * Math.PI) * 0.65;

        if ((frame + particle.noiseOffset) % NOISE_UPDATE_EVERY === 0) {
          const n = noise.simplex3(particle.x * noiseIntensity, particle.y * noiseIntensity, t);
          particle.angle = n * Math.PI * 4;
          particle.velocity.x = Math.cos(particle.angle) * 1.3;
          particle.velocity.y = Math.sin(particle.angle) * 1.3;
        }

        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;

        if (particle.x < 0) particle.x = canvas!.width;
        if (particle.x > canvas!.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas!.height;
        if (particle.y > canvas!.height) particle.y = 0;

        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx!.beginPath();
        ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      frame += 1;
      raf = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      resize();
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
    };
  }, [particleCount]);

  return (
    <canvas ref={canvasRef} aria-hidden className={`pointer-events-none fixed inset-0 z-0 h-screen w-screen ${className}`} />
  );
}
