import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  storagePath: z.string().min(1).max(500),
  allianceId: z.string().uuid().nullable().optional(),
  capturedAt: z.string().datetime().nullable().optional(),
  source: z.string().min(1).max(40).default("upload"),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const input = parsed.data;
  const { data, error } = await supabase.rpc("enqueue_observation", {
    p_storage_path: input.storagePath,
    p_alliance_id: input.allianceId ?? null,
    p_captured_at: input.capturedAt ?? null,
    p_source: input.source,
    p_width: input.width ?? null,
    p_height: input.height ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "observation_enqueue_failed", message: error.message }, { status: 400 });
  }

  return NextResponse.json({ observationId: data, status: "queued" }, { status: 202 });
}
