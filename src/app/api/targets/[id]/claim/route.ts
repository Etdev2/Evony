import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({ ttlSeconds: z.number().int().min(30).max(3600).default(300) });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "invalid_target_id" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("claim_target", {
    p_target_id: id,
    p_ttl_seconds: parsed.data.ttlSeconds,
  });

  if (error) {
    const conflict = error.message.toLowerCase().includes("already claimed");
    return NextResponse.json(
      { error: conflict ? "target_already_claimed" : "target_claim_failed", message: error.message },
      { status: conflict ? 409 : 400 },
    );
  }

  return NextResponse.json({ claim: data });
}
