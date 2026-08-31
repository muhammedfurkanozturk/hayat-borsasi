# Frontend Design — Anti-Slop Edition

Kaynak: skillcraft.cloud, yazar "Grug-brained Marketer" (https://skillcraft.cloud/skill/ad852e2f-108d-4970-802f-3eadad93b96f). Kullanıcı onayıyla, tam içerik kurulum öncesi incelenerek eklendi.

## Purpose
This Claude skill helps designers create distinctive web UIs that avoid typical AI-generated aesthetics like purple gradients and excessive rounding.

## Key Design Principles

1. **Warm over Corporate** — Use warm neutrals (#12110f) rather than pure blacks; rooms feel inviting, not corporate.
2. **Monospace + Display Fonts** — Apply monospace (JetBrains Mono, IBM Plex Mono) for UI elements; reserve display fonts (Space Grotesk, Satoshi) for hierarchy.
3. **Single Accent Color** — Pick one strong color (mint, amber, coral) used sparingly for primary actions only.
4. **Borders Over Shadows** — Subtle 1px borders create structure without the floaty feeling of box-shadows.
5. **Content Density** — Space serves content, not vice versa; avoid whitespace theater.
6. **Rounded-lg Maximum** — No rounded-xl; keep rounding to 8px or less for intentional feel.

## Anti-Patterns to Avoid
- Purple-to-blue gradients
- Bento grids with excessive rounding
- "Transform your X" hero text with gradient fills
- Emoji icons
- Generic system fonts everywhere
- Floating hover animations

## Color Palettes

**Dark:** Background #12110f, Surface #1e1c18, Text #e8e4dc, Border #33302a
**Light:** Background #faf9f7, Surface #ffffff, Text #1e1c18, Border #e8e4dc

## Usage in this project

Bu komut, mevcut kod tabanını (sayfalar, component'ler, `globals.css`) yukarıdaki kurallara göre denetlemek ve somut, dosya/satır bazlı klişe tespiti + alternatif önerisi üretmek için kullanılıyor — Hayat Borsası'nın kendi `DESIGN.md`'sindeki kararlarla çelişen bir öneri çıkarsa bunu açıkça belirt, körü körüne uygulama.
