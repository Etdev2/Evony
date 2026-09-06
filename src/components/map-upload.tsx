"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; message: string }
  | { kind: "queued"; observationId: string }
  | { kind: "error"; message: string };

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export function MapUpload() {
  const [state, setState] = useState<UploadState>({ kind: "idle" });

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      setState({ kind: "error", message: "Use a PNG, JPEG, or WebP map capture." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({ kind: "error", message: "Map captures must be 10 MB or smaller." });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setState({ kind: "error", message: "Sign in before uploading a map capture." });
      return;
    }

    setState({ kind: "uploading", message: "Uploading map capture…" });
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("map-observations")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setState({ kind: "error", message: uploadError.message });
      return;
    }

    setState({ kind: "uploading", message: "Queueing recognition…" });
    const response = await fetch("/api/observations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storagePath: path, source: "upload" }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.observationId) {
      await supabase.storage.from("map-observations").remove([path]);
      setState({ kind: "error", message: payload.message ?? "Could not queue this capture." });
      return;
    }

    setState({ kind: "queued", observationId: payload.observationId });
  }

  return (
    <div className="upload-card">
      <label className="upload-control">
        <span>Select map capture</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={state.kind === "uploading"}
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </label>
      {state.kind === "uploading" && <p className="upload-status">{state.message}</p>}
      {state.kind === "queued" && (
        <p className="upload-status">Queued for recognition. Observation {state.observationId.slice(0, 8)}…</p>
      )}
      {state.kind === "error" && <p className="upload-error">{state.message}</p>}
    </div>
  );
}
