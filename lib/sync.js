// Client-side sync helpers. The whole gradebook state syncs as one
// document; the newer copy (by updatedAt) wins. The sync code lives in
// localStorage and is the only credential — same code on every device.

import { loadState, rawSaveState } from "./data";

const CODE_KEY = "megs-sync-code";

export function getSyncCode() {
  try {
    return localStorage.getItem(CODE_KEY) || "";
  } catch {
    return "";
  }
}

export function setSyncCode(code) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch {}
}

async function parseError(res) {
  try {
    const data = await res.json();
    if (data.error) return data.error;
  } catch {}
  return `Sync failed (${res.status}).`;
}

export async function pullRemote(code) {
  const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()).state;
}

export async function pushRemote(code, state) {
  const res = await fetch("/api/sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

// Load local state, reconcile with the cloud copy (newer updatedAt wins),
// and return what the app should use plus a sync status.
export async function syncLoad() {
  const local = loadState();
  const code = getSyncCode();
  if (!code) return { state: local, status: "off" };
  try {
    const remote = await pullRemote(code);
    if (remote && (remote.updatedAt || 0) > (local.updatedAt || 0)) {
      rawSaveState(remote);
      return { state: remote, status: "synced" };
    }
    if ((local.updatedAt || 0) > (remote?.updatedAt || 0)) {
      await pushRemote(code, local);
    }
    return { state: local, status: "synced" };
  } catch (e) {
    return { state: local, status: "error", message: e.message };
  }
}
