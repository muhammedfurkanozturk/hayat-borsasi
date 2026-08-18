import type { Metadata } from "next";
import ProClient from "./ProClient";

export const metadata: Metadata = { title: "Hayat Borsası | Pro" };

export default function ProPage() {
  return <ProClient />;
}
