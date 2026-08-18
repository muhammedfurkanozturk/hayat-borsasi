import type { Metadata } from "next";
import RaporClient from "./RaporClient";

export const metadata: Metadata = { title: "Hayat Borsası | AI Rapor" };

export default function RaporPage() {
  return <RaporClient />;
}
