// ─── X-Coin Bridge Client ───────────────────────────────────────────────────
// Connects Core Pathway app to X-Coin (the PFLX data hub).
// All user data, XC balances, badges, and cross-app events flow through
// the shared Supabase backend (direct reads) and X-Coin's /api/pflx-bridge
// endpoint (HTTP fallback).
//
// The bridge URL defaults to localhost:3000 for local dev.
// In production, set NEXT_PUBLIC_XCOIN_URL env var to the Vercel URL.

import { createClient } from "@supabase/supabase-js";

// ─── Supabase client (shared with X-Coin + MC) ─────────────────────────────
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://hyxiagexyptzvetqjmnj.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eGlhZ2V4eXB0enZldHFqbW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODM4MTYsImV4cCI6MjA4OTY1OTgxNn0.hqHVlRu775dZfJrKxSFMNEPhANu5EFm7gJpaJ3RnbnY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  image?: string;
  email?: string;
  xcoin: number;
  totalXcoin: number;
  digitalBadges: number;
  level: number;
  rank: number;
  cohort: string;
  pathway: string;
  role?: string;
  isHost?: boolean;
  studioId?: string;
  badgeCounts?: {
    signature: number;
    executive: number;
    premium: number;
    primary: number;
  };
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

export interface PflxBadge {
  id: string;
  name: string;
  category: string;
  icon?: string;
  description?: string;
  xcValue?: number;
  rarity?: string;
  [key: string]: unknown;
}

export interface PflxTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  [key: string]: unknown;
}

/** Full X-Coin economy snapshot */
export interface XCoinEconomy {
  players: PflxPlayer[];
  badges: PflxBadge[];
  transactions: PflxTransaction[];
  leaderboard: PflxPlayer[];
}

// ─── Supabase direct reads (preferred — no HTTP hop) ───────────────────────

/** Fetch a collection from the shared app_data table */
async function fetchFromSupabase<T>(key: string): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("data")
      .eq("key", key)
      .single();
    if (error || !data || !data.data) return [];
    return Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error(`[xcoin-bridge] Supabase fetch(${key}) error:`, err);
    return [];
  }
}

/** Fetch all players directly from Supabase */
export async function fetchPlayers(): Promise<PflxPlayer[]> {
  const players = await fetchFromSupabase<PflxPlayer>("users");
  if (players.length > 0) return players;
  // Fallback to HTTP bridge
  return fetchPlayersHTTP();
}

/** Fetch a single player by ID */
export async function fetchPlayer(
  id: string
): Promise<PflxPlayer | null> {
  const players = await fetchPlayers();
  return players.find((p) => p.id === id) || null;
}

/** Fetch all badges from X-Coin */
export async function fetchBadges(): Promise<PflxBadge[]> {
  return fetchFromSupabase<PflxBadge>("badges");
}

/** Fetch all transactions */
export async function fetchTransactions(): Promise<PflxTransaction[]> {
  return fetchFromSupabase<PflxTransaction>("transactions");
}

/** Fetch the full X-Coin economy snapshot (players, badges, transactions, leaderboard) */
export async function fetchXCoinEconomy(): Promise<XCoinEconomy> {
  const [players, badges, transactions] = await Promise.all([
    fetchPlayers(),
    fetchBadges(),
    fetchTransactions(),
  ]);

  // Build leaderboard: sort non-admin players by totalXcoin descending
  const leaderboard = players
    .filter((p) => p.role !== "admin")
    .sort((a, b) => (b.totalXcoin || 0) - (a.totalXcoin || 0));

  return { players, badges, transactions, leaderboard };
}

/** Fetch player transactions */
export async function fetchPlayerTransactions(
  playerId: string
): Promise<PflxTransaction[]> {
  const all = await fetchTransactions();
  return all.filter((tx) => tx.userId === playerId);
}

// ─── HTTP bridge helpers (fallback) ────────────────────────────────────────

async function fetchPlayersHTTP(): Promise<PflxPlayer[]> {
  try {
    const res = await fetch(`${BRIDGE}?action=users`, {
      next: { revalidate: 30 },
    } as RequestInit);
    if (!res.ok) throw new Error(`Bridge error ${res.status}`);
    const { players } = await res.json();
    return players || [];
  } catch (err) {
    console.error("[xcoin-bridge] fetchPlayersHTTP error:", err);
    return [];
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
  playerName?: string
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
  reason: string
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
