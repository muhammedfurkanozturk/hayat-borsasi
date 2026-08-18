import type { Metadata } from "next";
import GunluklerClient from "./GunluklerClient";

export const metadata: Metadata = { title: "Hayat Borsası | Günlükler" };

export default function GunluklerPage() {
  return <GunluklerClient />;
}
