import type { Metadata } from "next";
import KarakterKartiClient from "./KarakterKartiClient";

export const metadata: Metadata = { title: "Hayat Borsası | Karakter Kartı" };

export default function KarakterKartiPage() {
  return <KarakterKartiClient />;
}
