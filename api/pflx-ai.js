/**
 * PFLX AI Assist — Vercel Serverless Function
 *
 * Proxies the Module Builder's writing-assistant calls to the Anthropic
 * API so the key never ships to the browser.
 *
 * === Health check ===
 *   GET /api/pflx-ai → { ok, hasKey, model }
 *
 * === Generate ===
 *   POST /api/pflx-ai
 *     Body (JSON): { system: string, prompt: string, maxTokens?: number }
 *   → 200 { text: "<model reply>" }
 *   → 503 { error: 'no-key' }   when ANTHROPIC_API_KEY isn't configured —
 *     the Builder then falls back to a browser-stored key.
 *
 * === Required env (set in Vercel → Project → Settings → Environment Variables) ===
 *   ANTHROPIC_API_KEY — an Anthropic API key (console.anthropic.com)
 * === Optional env ===
 *   PFLX_AI_MODEL — model override (default claude-sonnet-4-6)
 */

export const config = { api: { bodyParser: { sizeLimit: '256kb' } } };

const MODEL = process.env.PFLX_AI_MODEL || 'claude-sonnet-4-6';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.ANTHROPIC_API_KEY || '';

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, hasKey: !!key, model: MODEL });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!key) return res.status(503).json({ error: 'no-key' });

  try {
    const { system, prompt, maxTokens } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'missing prompt' });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(4000, parseInt(maxTokens, 10) || 1500),
        system: String(system || '').slice(0, 4000),
        messages: [{ role: 'user', content: String(prompt).slice(0, 24000) }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: (data && data.error && data.error.message) || 'upstream' });
    }
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server' });
  }
}
