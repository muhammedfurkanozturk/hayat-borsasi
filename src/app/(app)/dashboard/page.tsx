import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = { title: "Hayat Borsası | Dashboard" };

export default function DashboardPage() {
  return <DashboardClient />;
}
