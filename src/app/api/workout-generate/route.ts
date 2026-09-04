import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { EquipmentType, MuscleGroup } from "@hayat-borsasi/shared";
import { generateQuickWorkout, generateWeeklyWorkout, type WorkoutGoal } from "@/lib/ai/workout-generate";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Mobil (Spor & Vücut — Antrenman Oluştur) uygulamanın çerezi yok —
// /api/rapor'daki AYNI Bearer token + CORS deseni burada da uygulandı
// (bkz. o dosyadaki yorum, 2026-09-04 — madde 4 "eksikler" envanteri).
function createBearerClient(token: string) {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const VALID_GOALS: WorkoutGoal[] = ["hypertrophy", "strength", "endurance"];

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;

  const supabase = bearerToken ? createBearerClient(bearerToken) : await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(bearerToken ?? undefined);
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401, headers: CORS_HEADERS });
  }

  const body = (await request.json()) as {
    mode?: unknown;
    muscleGroups?: unknown;
    equipment?: unknown;
    goal?: unknown;
    daysPerWeek?: unknown;
  };

  const mode = body.mode === "weekly" ? "weekly" : "quick";
  const muscleGroups = Array.isArray(body.muscleGroups) ? (body.muscleGroups.filter((m) => typeof m === "string") as MuscleGroup[]) : [];
  const equipment = Array.isArray(body.equipment) ? (body.equipment.filter((e) => typeof e === "string") as EquipmentType[]) : [];
  const goal: WorkoutGoal = VALID_GOALS.includes(body.goal as WorkoutGoal) ? (body.goal as WorkoutGoal) : "hypertrophy";
  const daysPerWeek = typeof body.daysPerWeek === "number" ? Math.min(6, Math.max(3, Math.round(body.daysPerWeek))) : 3;

  if (muscleGroups.length === 0) {
    return NextResponse.json({ error: "En az bir kas grubu seç." }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const result =
      mode === "weekly"
        ? await generateWeeklyWorkout({ muscleGroups, equipment, goal, daysPerWeek })
        : await generateQuickWorkout({ muscleGroups, equipment, goal });
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Antrenman üretimi hatası:", error);

    let message = error instanceof Error ? error.message : "Antrenman üretilemedi, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }

    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
