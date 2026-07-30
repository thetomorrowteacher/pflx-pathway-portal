/**
 * PFLX Slack relay — Vercel Serverless Function.
 *
 * Posts PFLX broadcasts / project events to Slack channels. Fire-and-forget
 * from the client; credentials live ONLY in Vercel env vars.
 *
 * === POST /api/pflx-slack ===
 *   Body: { channels: ["#software-upgrades", ...], message: "...", from: "Host" }
 *   → 200 { ok, sent }
 *   → 503 { error: "no-config" }
 *
 * === Env (Vercel → Settings → Environment Variables) — use EITHER approach ===
 *   Incoming webhooks (simplest):
 *     SLACK_WEBHOOKS      — JSON map of channel → webhook URL, e.g.
 *                           {"#software-upgrades":"https://hooks.slack.com/services/AAA/BBB/CCC"}
 *     SLACK_WEBHOOK_URL   — optional single fallback webhook.
 *   Bot token (posts by channel id/name via chat.postMessage):
 *     SLACK_BOT_TOKEN     — xoxb-… (needs chat:write). Channels are used as-is
 *                           (id like C0123, or #name — Slack resolves names if
 *                           the bot is a member).
 */
export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };

function loadMap() {
  try { return JSON.parse(process.env.SLACK_WEBHOOKS || '{}') || {}; } catch (e) { return {}; }
}
function norm(s) { return String(s || '').trim().replace(/^#/, '').toLowerCase(); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const map = loadMap();
  const fallback = process.env.SLACK_WEBHOOK_URL || '';
  const token = process.env.SLACK_BOT_TOKEN || '';
  const configured = Object.keys(map).length > 0 || !!fallback || !!token;

  if (req.method === 'GET') return res.status(200).json({ ok: true, configured });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!configured) return res.status(503).json({ error: 'no-config' });

  try {
    const body = req.body || {};
    const message = String(body.message || '').slice(0, 2800);
    const from = String(body.from || 'PFLX').slice(0, 80);
    if (!message) return res.status(400).json({ error: 'missing message' });
    const channels = Array.isArray(body.channels) && body.channels.length ? body.channels : ['default'];
    const text = `*${from}*: ${message}`;
    let sent = 0;

    // Prefer a bot token (posts to each channel by id/name).
    if (token) {
      await Promise.all(channels.map((c) =>
        fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { 'content-type': 'application/json; charset=utf-8', authorization: `Bearer ${token}` },
          body: JSON.stringify({ channel: c, text })
        }).then((r) => r.json()).then((d) => { if (d && d.ok) sent++; }).catch(() => {})
      ));
      return res.status(200).json({ ok: true, sent, via: 'bot' });
    }

    // Otherwise resolve channel → incoming webhook (map, else fallback), dedupe.
    const byName = {};
    Object.keys(map).forEach((k) => { byName[norm(k)] = map[k]; });
    const urls = [];
    channels.forEach((c) => { const u = byName[norm(c)] || fallback; if (u && urls.indexOf(u) < 0) urls.push(u); });
    if (!urls.length) return res.status(503).json({ error: 'no-config' });
    await Promise.all(urls.map((url) =>
      fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) })
        .then((r) => { if (r.ok) sent++; }).catch(() => {})
    ));
    return res.status(200).json({ ok: true, sent, via: 'webhook' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server' });
  }
}
