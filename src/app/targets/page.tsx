import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TargetsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/sign-in?next=/targets");

  const { data: targets, error } = await supabase
    .from("targets")
    .select("id,monster_name,monster_level,map_x,map_y,status,last_seen_at,confidence,score")
    .in("status", ["active", "claimed"])
    .order("score", { ascending: false, nullsFirst: false })
    .order("last_seen_at", { ascending: false })
    .limit(50);

  return (
    <main className="shell">
      <section className="board-heading">
        <div>
          <p className="eyebrow">Alliance intelligence</p>
          <h1>Monster Board</h1>
        </div>
        <Link href="/">Scan another map</Link>
      </section>

      {error && <p className="upload-error">Could not load targets: {error.message}</p>}
      {!error && (targets?.length ?? 0) === 0 && (
        <section className="empty-card">
          <h2>No active targets yet</h2>
          <p>Upload a map capture to begin building your searchable target board.</p>
          <Link href="/">Find Your Map</Link>
        </section>
      )}

      <section className="target-list" aria-label="Ranked monster targets">
        {targets?.map((target, index) => (
          <article className="target-card" key={target.id}>
            <div className="target-rank">#{index + 1}</div>
            <div className="target-main">
              <strong>{target.monster_name}{target.monster_level ? ` Lv.${target.monster_level}` : ""}</strong>
              <span>X:{target.map_x} · Y:{target.map_y}</span>
            </div>
            <div className="target-meta">
              <span>{target.status}</span>
              <span>{Math.round(Number(target.confidence) * 100)}% confidence</span>
              <span>{target.score == null ? "Unscored" : `Score ${Number(target.score).toFixed(1)}`}</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
