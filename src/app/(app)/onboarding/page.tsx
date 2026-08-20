import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = { title: "Hayat Borsası | İlk alışkanlıklarını seç" };

export default function OnboardingPage() {
  return <OnboardingClient />;
}
