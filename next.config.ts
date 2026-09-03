import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  transpilePackages: ["@hayat-borsasi/shared"],
  // iyzipay (Faz 2 ödeme iskeleti) kendi kaynak dosyalarını dinamik
  // `fs.readdirSync` + `require(path + '/' + fileName)` ile yüklüyor —
  // Turbopack bunu statik analiz edip bundle'layamıyor ("server relative
  // imports are not implemented" hatası). `serverExternalPackages`,
  // paketi hiç bundle'lamadan çalışma anında Node'un kendi require'ına
  // bırakıyor (serverless fonksiyonlarda node_modules zaten mevcut).
  serverExternalPackages: ["iyzipay"],
};

export default nextConfig;
