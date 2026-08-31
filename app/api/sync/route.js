// Cloud sync for the gradebook.
// Stores the whole gradebook state as one JSON document in Upstash Redis
// (Vercel Marketplace "Upstash for Redis" — the free tier is plenty),
// keyed by a hash of the user's sync code. The code never touches disk
// server-side; without it the data can't be looked up.

import { createHash } from "crypto";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1_500_000;

function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

// Local-testing fallback only — never active unless explicitly enabled
const devMem = () =>
  process.env.SYNC_DEV_MEMORY === "1"
    ? (globalThis.__syncMem ||= new Map())
    : null;

const keyFor = (code) =>
  "megs:" + createHash("sha256").update(`megs-sync:${code}`).digest("hex");

function badCode(code) {
  return typeof code !== "string" || code.trim().length < 6 || code.length > 64;
}

async function redis(cfg, command) {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`storage error (${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error(`storage error: ${data.error}`);
  return data.result;
}

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const notConfigured = () =>
  json(
    {
      error:
        "Sync isn't set up on the server yet. In the Vercel dashboard, open the project's Storage tab and connect a free Upstash for Redis database, then redeploy.",
    },
    503
  );

export async function GET(req) {
  const code = new URL(req.url).searchParams.get("code") || "";
  if (badCode(code)) return json({ error: "Sync code must be at least 6 characters." }, 400);

  const mem = devMem();
  const cfg = kvConfig();
  if (!cfg && !mem) return notConfigured();

  try {
    const raw = mem ? mem.get(keyFor(code)) ?? null : await redis(cfg, ["GET", keyFor(code)]);
    return json({ state: raw ? JSON.parse(raw) : null });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}

export async function PUT(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const { code, state } = body || {};
  if (badCode(code)) return json({ error: "Sync code must be at least 6 characters." }, 400);
  if (!state || typeof state !== "object" || !Array.isArray(state.classes)) {
    return json({ error: "Invalid gradebook data." }, 400);
  }
  const raw = JSON.stringify(state);
  if (raw.length > MAX_BYTES) return json({ error: "Gradebook too large to sync." }, 413);

  const mem = devMem();
  const cfg = kvConfig();
  if (!cfg && !mem) return notConfigured();

  try {
    if (mem) mem.set(keyFor(code), raw);
    else await redis(cfg, ["SET", keyFor(code), raw]);
    return json({ ok: true, updatedAt: state.updatedAt ?? null });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
