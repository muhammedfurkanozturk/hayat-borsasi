import type { Metadata } from "next";
import AyarlarClient from "./AyarlarClient";

export const metadata: Metadata = { title: "Hayat Borsası | Ayarlar" };

export default function AyarlarPage() {
  return <AyarlarClient />;
}
