/**
 * PFLX Discord relay — Vercel Serverless Function.
 *
 * Posts PFLX broadcasts / project events to Discord channels via incoming
 * webhooks. Fire-and-forget from the client; credentials live ONLY in Vercel
 * env vars (never in the browser).
 *
 * === POST /api/pflx-discord ===
 *   Body: { channels: ["#software-upgrades", ...], message: "...", from: "Host" }
 *   → 200 { ok, sent }        number of channels delivered
 *   → 503 { error: "no-webhook" }   when nothing is configured
 *
 * === Env (Vercel → Settings → Environment Variables) ===
 *   DISCORD_WEBHOOKS   — JSON map of channel → webhook URL, e.g.
 *                        {"#software-upgrades":"https://discord.com/api/webhooks/AAA/BBB",
 *                         "#general":"https://discord.com/api/webhooks/CCC/DDD"}
 *   DISCORD_WEBHOOK_URL — optional single fallback webhook for any channel not
 *                         found in the map (or when no map is set).
 * Channel names are matched case-insensitively, with/without a leading '#'.
 */
export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };

function loadMap() {
  try { return JSON.parse(process.env.DISCORD_WEBHOOKS || '{}') || {}; } catch (e) { return {}; }
}
function norm(s) { return String(s || '').trim().replace(/^#/, '').toLowerCase(); }

// Fallback config from Supabase app_data key `pflx_integrations`
// ({ discord: { webhooks: {"#x":"url"}, default: "url" } }). Lets the relay be
// configured without a redeploy; env vars (above) always take precedence. Note:
// app_data is anon-readable, so a Vercel env var is the more private home.
async function loadSupabaseConfig() {
  const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { map: {}, fallback: '' };
  try {
    const r = await fetch(`${url}/rest/v1/app_data?key=eq.pflx_integrations&select=data`, {
      headers: { apikey: anon, authorization: `Bearer ${anon}` },
    });
    if (!r.ok) return { map: {}, fallback: '' };
    const rows = await r.json();
    const d = (rows && rows[0] && rows[0].data && rows[0].data.discord) || {};
    return { map: d.webhooks || {}, fallback: d.default || '' };
  } catch (e) { return { map: {}, fallback: '' }; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // env first, then Supabase config fallback (env wins on conflicts)
  const envMap = loadMap();
  const sb = await loadSupabaseConfig();
  const map = Object.assign({}, sb.map, envMap);
  const fallback = process.env.DISCORD_WEBHOOK_URL || sb.fallback || '';
  const configured = Object.keys(map).length > 0 || !!fallback;

  if (req.method === 'GET') return res.status(200).json({ ok: true, configured });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!configured) return res.status(503).json({ error: 'no-webhook' });

  try {
    const body = req.body || {};
    const message = String(body.message || '').slice(0, 1800);
    const from = String(body.from || 'PFLX').slice(0, 80);
    if (!message) return res.status(400).json({ error: 'missing message' });
    const channels = Array.isArray(body.channels) && body.channels.length ? body.channels : ['default'];

    // Resolve each channel → webhook (map by normalized name, else fallback), dedupe.
    const byName = {};
    Object.keys(map).forEach((k) => { byName[norm(k)] = map[k]; });
    const urls = [];
    channels.forEach((c) => {
      const url = byName[norm(c)] || fallback;
      if (url && urls.indexOf(url) < 0) urls.push(url);
    });
    if (!urls.length) return res.status(503).json({ error: 'no-webhook' });

    const content = `**${from}**: ${message}`;
    let sent = 0;
    await Promise.all(urls.map((url) =>
      fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content }) })
        .then((r) => { if (r.ok) sent++; }).catch(() => {})
    ));
    return res.status(200).json({ ok: true, sent });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server' });
  }
}
