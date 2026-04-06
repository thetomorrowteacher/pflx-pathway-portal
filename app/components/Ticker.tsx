"use client";
import { useEffect, useState } from "react";
import { pathways } from "../lib/pathways";

const TICKER_DATE_KEY = "pflx_pathway_ticker_date";

/** Returns "YYYY-MM-DD" for today in local time. */
function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Milliseconds until the next local midnight. */
function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

interface TickerEvent {
  text: string;
  color: string;
  icon: string;
}

function buildTickerEvents(): TickerEvent[] {
  const events: TickerEvent[] = [];

  // ── Pathway highlights ────────────────────────────────────────
  pathways.forEach((pw) => {
    const totalNodes = pw.nodes.length;
    const unlocked = pw.nodes.filter(
      (n) => n.status === "unlocked" || n.status === "in_progress" || n.status === "completed"
    ).length;
    const completed = pw.nodes.filter((n) => n.status === "completed").length;
    const inProgress = pw.nodes.filter((n) => n.status === "in_progress").length;

    if (inProgress > 0) {
      events.push({
        icon: "🔥",
        color: "#f59e0b",
        text: `IN PROGRESS — ${pw.icon} ${pw.title}: ${inProgress} node${inProgress > 1 ? "s" : ""} active · ${completed}/${totalNodes} completed`,
      });
    }

    if (completed > 0 && completed === totalNodes) {
      events.push({
        icon: "🏆",
        color: "#f5c842",
        text: `PATHWAY MASTERED — ${pw.icon} ${pw.title} fully completed! All ${totalNodes} nodes done`,
      });
    } else if (completed > 0) {
      events.push({
        icon: "✅",
        color: "#4ade80",
        text: `PROGRESS — ${pw.icon} ${pw.title}: ${completed}/${totalNodes} nodes completed`,
      });
    }

    if (unlocked > 0 && completed === 0 && inProgress === 0) {
      events.push({
        icon: "🔓",
        color: "#00d4ff",
        text: `AVAILABLE — ${pw.icon} ${pw.title}: ${unlocked} node${unlocked > 1 ? "s" : ""} ready to start`,
      });
    }
  });

  // ── Live PFLX ecosystem events ────────────────────────────────
  events.push({
    icon: "⚡",
    color: "#00d4ff",
    text: `PFLX NETWORK — ${pathways.length} Core Pathways active · ${pathways.reduce((sum, pw) => sum + pw.nodes.length, 0)} total skill nodes`,
  });

  events.push({
    icon: "🎯",
    color: "#a78bfa",
    text: `SKILL TREE — Complete pathway nodes to earn XC and Digital Badges in the PFLX X-Coin Economy`,
  });

  // ── Coming soon nodes ─────────────────────────────────────────
  const comingSoonNodes = pathways.flatMap((pw) =>
    pw.nodes
      .filter((n) => n.comingSoon)
      .map((n) => ({ ...n, pathwayTitle: pw.title, pathwayIcon: pw.icon }))
  );
  if (comingSoonNodes.length > 0) {
    events.push({
      icon: "🚀",
      color: "#f472b6",
      text: `COMING SOON — ${comingSoonNodes.map((n) => `${n.pathwayIcon} ${n.title}`).join(" · ")}`,
    });
  }

  // ── Pathway spotlight (rotates based on time) ─────────────────
  const spotlightIndex = new Date().getHours() % pathways.length;
  const spotlight = pathways[spotlightIndex];
  events.push({
    icon: spotlight.icon,
    color: spotlight.accentColor,
    text: `SPOTLIGHT — ${spotlight.title}: "${spotlight.subtitle}" · ${spotlight.nodes.length} nodes to master`,
  });

  return events;
}

export default function Ticker() {
  const [events, setEvents] = useState<TickerEvent[]>([]);

  useEffect(() => {
    // ── Initial load ──────────────────────────────────────────────
    const today = todayString();
    const stored = localStorage.getItem(TICKER_DATE_KEY);
    if (stored !== today) {
      localStorage.setItem(TICKER_DATE_KEY, today);
    }
    setEvents(buildTickerEvents());

    // ── Refresh every 60 s to pick up new activity ────────────────
    const refreshInterval = setInterval(() => {
      setEvents(buildTickerEvents());
    }, 60_000);

    // ── Schedule a reset exactly at midnight ──────────────────────
    const midnightTimeout = setTimeout(() => {
      localStorage.setItem(TICKER_DATE_KEY, todayString());
      setEvents(buildTickerEvents());
    }, msUntilMidnight());

    return () => {
      clearInterval(refreshInterval);
      clearTimeout(midnightTimeout);
    };
  }, []);

  if (events.length === 0) {
    return (
      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%",
        background: "rgba(8,8,14,0.97)",
        borderTop: "1px solid rgba(0,212,255,0.15)",
        zIndex: 99999, height: "28px", display: "flex", alignItems: "center",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          flexShrink: 0, padding: "0 10px", height: "100%",
          display: "flex", alignItems: "center",
          background: "rgba(0,212,255,0.08)",
          borderRight: "1px solid rgba(0,212,255,0.15)",
          fontSize: "8px", fontWeight: 900, letterSpacing: "0.14em", color: "#00d4ff",
        }}>⚡ LIVE</div>
        <span style={{ fontSize: "11px", color: "rgba(0,212,255,0.3)", marginLeft: "16px", letterSpacing: "0.06em" }}>
          No activity yet today · Resets daily at midnight
        </span>
      </div>
    );
  }

  const separator = "      ◆      ";

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, width: "100%",
      background: "rgba(8,8,14,0.97)",
      borderTop: "1px solid rgba(0,212,255,0.3)",
      zIndex: 99999, overflow: "hidden", whiteSpace: "nowrap",
      backdropFilter: "blur(12px)",
      height: "28px", display: "flex", alignItems: "center",
    }}>
      <style>{`
        @keyframes pflx-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .pflx-ticker-track {
          display: inline-flex;
          align-items: center;
          animation: pflx-ticker ${Math.max(40, events.length * 6)}s linear infinite;
        }
        .pflx-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Live badge */}
      <div style={{
        flexShrink: 0, padding: "0 10px", height: "100%",
        display: "flex", alignItems: "center",
        background: "rgba(0,212,255,0.12)",
        borderRight: "1px solid rgba(0,212,255,0.25)",
        fontSize: "8px", fontWeight: 900, letterSpacing: "0.14em",
        color: "#00d4ff",
      }}>
        ⚡ LIVE
      </div>

      <div style={{ overflow: "hidden", flex: 1 }}>
        <div className="pflx-ticker-track">
          {/* Render items twice so the loop is seamless */}
          {[...events, ...events].map((ev, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "11px" }}>{ev.icon}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: ev.color, letterSpacing: "0.02em" }}>
                {ev.text}
              </span>
              <span style={{ color: "rgba(0,212,255,0.3)", fontSize: "10px", margin: "0 4px" }}>{separator}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
