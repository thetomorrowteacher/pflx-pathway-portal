/**
 * mcBridge — Core Pathways ↔ Mission Control bidirectional bridge.
 *
 * Two communication channels:
 *
 *   A. postMessage contracts (when embedded in Platform iframe)
 *      1. Course → Task linking (MC requests course list, marks complete)
 *      2. Project → Node publishing (MC publishes project as pathway node)
 *      3. Live data push (MC broadcasts pflx_mc_* events on data change)
 *
 *   B. Supabase direct reads (always available — same shared backend)
 *      Reads checkpoints, tasks, projects, jobs, pitches, cohort groups,
 *      seasons, and users from the shared app_data table.
 *
 * This file lives on the Core Pathways side.
 */

import { createClient } from "@supabase/supabase-js";

// ─── Supabase client (shared with X-Coin) ───────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hyxiagexyptzvetqjmnj.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eGlhZ2V4eXB0enZldHFqbW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODM4MTYsImV4cCI6MjA4OTY1OTgxNn0.hqHVlRu775dZfJrKxSFMNEPhANu5EFm7gJpaJ3RnbnY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ──────────────────────────────────────────────────────────────────

export type Course = {
  id: string;
  pathwayId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  checkpointIds: string[];
};

export type ProjectPublishPayload = {
  projectId: string;
  title: string;
  description: string;
  ownerUserId: string | null;
  requiredSkills: string[];
  rewardXC: number;
  rewardBadges: string[];
};

/** MC data collections available via Supabase */
export interface MCData {
  checkpoints: MCCheckpoint[];
  tasks: MCTask[];
  projects: MCProject[];
  jobs: MCJob[];
  pitches: MCPitch[];
  cohortGroups: MCCohortGroup[];
  seasons: MCSeason[];
  users: MCUser[];
  badges: MCBadge[];
}

export interface MCCheckpoint {
  id: string;
  title: string;
  description?: string;
  seasonId?: string;
  order?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  [key: string]: unknown;
}

export interface MCTask {
  id: string;
  title: string;
  description?: string;
  checkpointId?: string;
  projectId?: string;
  assignedTo?: string[];
  status?: string;
  xcReward?: number;
  badgeReward?: string;
  dueDate?: string;
  courseId?: string;
  [key: string]: unknown;
}

export interface MCProject {
  id: string;
  title: string;
  description?: string;
  ownerId?: string;
  status?: string;
  pathway?: string;
  tasks?: string[];
  xcBudget?: number;
  [key: string]: unknown;
}

export interface MCJob {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  assignedTo?: string;
  status?: string;
  xcReward?: number;
  [key: string]: unknown;
}

export interface MCPitch {
  id: string;
  title: string;
  description?: string;
  creatorId?: string;
  pathway?: string;
  pathwayNodeId?: string;
  status?: string;
  xcValue?: number;
  residualPercent?: number;
  courseUrl?: string;
  [key: string]: unknown;
}

export interface MCCohortGroup {
  id: string;
  name: string;
  members?: string[];
  studioId?: string;
  [key: string]: unknown;
}

export interface MCSeason {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  checkpoints?: string[];
  [key: string]: unknown;
}

export interface MCUser {
  id: string;
  name: string;
  email?: string;
  brandName?: string;
  image?: string;
  role?: string;
  isHost?: boolean;
  xcoin?: number;
  totalXcoin?: number;
  digitalBadges?: number;
  level?: number;
  rank?: number;
  cohort?: string;
  pathway?: string;
  studioId?: string;
  [key: string]: unknown;
}

export interface MCBadge {
  id: string;
  name: string;
  category?: string;
  icon?: string;
  description?: string;
  xcValue?: number;
  [key: string]: unknown;
}

// ─── postMessage types ──────────────────────────────────────────────────────

type MCBridgeMessage =
  | { type: "pflx_course_list_request" }
  | { type: "pflx_course_list_response"; courses: Course[] }
  | { type: "pflx_course_mark_complete"; courseId: string; playerId: string }
  | {
      type: "pflx_project_publish_node";
      pathwayId: string;
      project: ProjectPublishPayload;
      position?: { x: number; y: number };
    }
  | {
      type: "pflx_project_node_created";
      projectId: string;
      nodeId: string;
      pathwayId: string;
    };

// ─── Live data change event (MC broadcasts pflx_mc_* messages) ──────────────

export type MCDataChangeCallback = (key: string, data: unknown[]) => void;

/**
 * Install the MC Bridge listener inside Core Pathways.
 * Handles:
 *   - Course list requests from MC
 *   - Course completion marks from MC
 *   - Project → node publish from MC
 *   - Live data change events (pflx_mc_* broadcasts)
 */
export function installMCBridge(handlers: {
  getCourses: () => Course[];
  markCourseComplete: (courseId: string, playerId: string) => void;
  createNodeFromProject: (
    pathwayId: string,
    project: ProjectPublishPayload,
    position?: { x: number; y: number }
  ) => { nodeId: string };
  onDataChange?: MCDataChangeCallback;
}) {
  function handleMessage(ev: MessageEvent) {
    try {
      const msg =
        typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        case "pflx_course_list_request": {
          const courses = handlers.getCourses();
          replyTo(ev, { type: "pflx_course_list_response", courses });
          break;
        }
        case "pflx_course_mark_complete": {
          handlers.markCourseComplete(
            (msg as { courseId: string }).courseId,
            (msg as { playerId: string }).playerId
          );
          break;
        }
        case "pflx_project_publish_node": {
          const pmsg = msg as {
            pathwayId: string;
            project: ProjectPublishPayload;
            position?: { x: number; y: number };
          };
          const { nodeId } = handlers.createNodeFromProject(
            pmsg.pathwayId,
            pmsg.project,
            pmsg.position
          );
          replyTo(ev, {
            type: "pflx_project_node_created",
            projectId: pmsg.project.projectId,
            nodeId,
            pathwayId: pmsg.pathwayId,
          });
          break;
        }
      }

      // ── Live data change: MC broadcasts pflx_mc_<collection> on save ──
      if (
        msg.type &&
        typeof msg.type === "string" &&
        msg.type.startsWith("pflx_mc_") &&
        handlers.onDataChange
      ) {
        // Extract collection name from message type: pflx_mc_players_updated → players
        const eventKey = msg.type.replace("pflx_mc_", "").replace("_updated", "");
        const payload = msg.data || [];
        handlers.onDataChange(eventKey, Array.isArray(payload) ? payload : [payload]);
      }

      // ── Cloud data response from X-Coin PflxBridge ──
      if (msg.type === "pflx_cloud_data" && msg.key && msg.data && handlers.onDataChange) {
        handlers.onDataChange(msg.key, Array.isArray(msg.data) ? msg.data : []);
      }
    } catch {
      // ignore non-JSON
    }
  }

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}

function replyTo(ev: MessageEvent, msg: MCBridgeMessage) {
  const target = ev.source as Window | null;
  if (target && target.postMessage) {
    try {
      target.postMessage(JSON.stringify(msg), "*");
    } catch {}
  }
  if (window.parent !== window) {
    try {
      window.parent.postMessage(JSON.stringify(msg), "*");
    } catch {}
  }
}

// ─── Supabase direct reads ─────────────────────────────────────────────────

/** Fetch a single collection from the shared app_data table */
async function fetchCollection<T>(key: string): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("data")
      .eq("key", key)
      .single();
    if (error || !data || !data.data) return [];
    return Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error(`[mcBridge] fetchCollection(${key}) error:`, err);
    return [];
  }
}

/**
 * Fetch ALL MC data collections from Supabase in parallel.
 * Returns the full MCData object with all collections populated.
 */
export async function fetchAllMCData(): Promise<MCData> {
  const [
    checkpoints,
    tasks,
    projects,
    jobs,
    pitches,
    cohortGroups,
    seasons,
    users,
    badges,
  ] = await Promise.all([
    fetchCollection<MCCheckpoint>("checkpoints"),
    fetchCollection<MCTask>("tasks"),
    fetchCollection<MCProject>("projects"),
    fetchCollection<MCJob>("jobs"),
    fetchCollection<MCPitch>("projectPitches"),
    fetchCollection<MCCohortGroup>("cohortGroups"),
    fetchCollection<MCSeason>("seasons"),
    fetchCollection<MCUser>("users"),
    fetchCollection<MCBadge>("badges"),
  ]);

  return { checkpoints, tasks, projects, jobs, pitches, cohortGroups, seasons, users, badges };
}

/** Fetch a single collection by name */
export async function fetchMCCollection(key: string): Promise<unknown[]> {
  return fetchCollection(key);
}

// ─── Convenience helpers for the Mission Control side ───────────────────────

export const MCBridge = {
  requestCourses(target: Window) {
    target.postMessage(
      JSON.stringify({ type: "pflx_course_list_request" }),
      "*"
    );
  },
  publishProject(
    target: Window,
    pathwayId: string,
    project: ProjectPublishPayload,
    position?: { x: number; y: number }
  ) {
    target.postMessage(
      JSON.stringify({
        type: "pflx_project_publish_node",
        pathwayId,
        project,
        position,
      }),
      "*"
    );
  },
  /** Request fresh data from parent shell (Platform/MC) */
  requestData(key: string) {
    if (window.parent !== window) {
      window.parent.postMessage(
        JSON.stringify({ type: "pflx_data_request", key }),
        "*"
      );
    }
  },
};
