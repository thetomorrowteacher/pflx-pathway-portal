// ─── X-Coin Bridge Client ───────────────────────────────────────────────────
// Connects Core Pathway app to X-Coin (the PFLX data hub).
// All user data, XC balances, and cross-app events flow through X-Coin's
// /api/pflx-bridge endpoint.
//
// The bridge URL defaults to localhost:3000 for local dev.
// In production, set NEXT_PUBLIC_XCOIN_URL env var to the Vercel URL.

const XCOIN_URL =
  process.env.NEXT_PUBLIC_XCOIN_URL ||
  (typeof window !== "undefined"
    ? window.location.origin.replace(":3001", ":3000") // Core Pathway runs on :3001
    : "http://localhost:3000");

const BRIDGE = `${XCOIN_URL}/api/pflx-bridge`;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PflxPlayer {
  id: string;
  name: string;
  brandName?: string;
  avatar?: string;
  xcoin: number;
  totalXcoin: number;
  digitalBadges: number;
  level: number;
  rank: number;
  cohort: string;
  pathway: string;
  badgeCounts?: { signature: number; executive: number; premium: number; primary: number };
  studioId?: string;
}

export interface PflxEvent {
  id: string;
  app: string;
  type: string;
  playerId?: string;
  playerName?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// ─── GET helpers ────────────────────────────────────────────────────────────

/** Fetch all players from X-Coin */
export async function fetchPlayers(): Promise<PflxPlayer[]> {
  try {
    const res = await fetch(`${BRIDGE}?action=users`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`Bridge error ${res.status}`);
    const { players } = await res.json();
    return players || [];
  } catch (err) {
    console.error("[xcoin-bridge] fetchPlayers error:", err);
    return [];
  }
}

/** Fetch a single player by ID */
export async function fetchPlayer(id: string): Promise<PflxPlayer | null> {
  try {
    const res = await fetch(`${BRIDGE}?action=user&id=${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const { player } = await res.json();
    return player || null;
  } catch (err) {
    console.error("[xcoin-bridge] fetchPlayer error:", err);
    return null;
  }
}

/** Fetch recent cross-app events */
export async function fetchEvents(filters?: {
  app?: string;
  type?: string;
  playerId?: string;
  limit?: number;
}): Promise<PflxEvent[]> {
  try {
    const params = new URLSearchParams({ action: "events" });
    if (filters?.app) params.set("app", filters.app);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.playerId) params.set("playerId", filters.playerId);
    if (filters?.limit) params.set("limit", String(filters.limit));

    const res = await fetch(`${BRIDGE}?${params}`);
    if (!res.ok) return [];
    const { events } = await res.json();
    return events || [];
  } catch (err) {
    console.error("[xcoin-bridge] fetchEvents error:", err);
    return [];
  }
}

// ─── POST helpers ───────────────────────────────────────────────────────────

/** Publish a cross-app event from Core Pathway */
export async function publishEvent(
  type: string,
  data: Record<string, unknown>,
  playerId?: string,
  playerName?: string,
): Promise<boolean> {
  try {
    const res = await fetch(BRIDGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "event",
        app: "core-pathway",
        type,
        data,
        playerId,
        playerName,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[xcoin-bridge] publishEvent error:", err);
    return false;
  }
}

/** Award or deduct XC for a player via X-Coin hub */
export async function updatePlayerXC(
  playerId: string,
  delta: number,
  reason: string,
): Promise<{ success: boolean; newXC?: number }> {
  try {
    const res = await fetch(BRIDGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "xc_update",
        playerId,
        delta,
        reason,
        app: "core-pathway",
      }),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (err) {
    console.error("[xcoin-bridge] updatePlayerXC error:", err);
    return { success: false };
  }
}
