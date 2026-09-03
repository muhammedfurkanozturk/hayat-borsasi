import { NextResponse } from "next/server";
import { fetchSportHeroPhoto } from "@/lib/sport/pexels";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const photo = await fetchSportHeroPhoto();
  return NextResponse.json({ photo });
}
