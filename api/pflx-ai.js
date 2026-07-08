/**
 * PFLX AI — Vercel Serverless Function (multi-provider)
 *
 * One server-side AI door for the whole platform: the Module Builder,
 * the Console's X-Bot, and any sub-app. Keys live in Vercel env vars —
 * they never ship to a browser and they "follow" every device.
 *
 * === Health check ===
 *   GET /api/pflx-ai
 *   → { ok, hasKey, providers: { anthropic, openai, gemini, deepseek }, model, cohortKeys }
 *
 * === Generate ===
 *   POST /api/pflx-ai
 *     Body (JSON):
 *       provider?: 'anthropic' | 'openai' | 'gemini'   (default anthropic)
 *       system?:   string
 *       prompt?:   string                    — single-turn convenience
 *       messages?: [{ role, content }]       — multi-turn (wins over prompt)
 *       maxTokens?: number
 *       cohort?:   string                    — if a per-cohort host key is set
 *                                              for this cohort, it is used
 *                                              (decrypted SERVER-SIDE) instead of
 *                                              the platform env key.
 *   → 200 { text }
 *   → 503 { error: 'no-key' }   when no key (env or cohort) is available
 *
 * === Encrypt a cohort key (host setup; raw key posted once over HTTPS) ===
 *   POST /api/pflx-ai  { action: 'encrypt', provider, key, adminSecret? }
 *   → 200 { enc }      — AES-256-GCM ciphertext (useless without PFLX_KEY_SECRET)
 *   The Console stores { [cohort]: { provider, enc } } in the app_data row
 *   `pflx_cohort_ai_keys`. The raw key is NEVER stored — only this ciphertext,
 *   and it is only ever decrypted inside this function at call time.
 *
 * === Env (Vercel → Project → Settings → Environment Variables) ===
 *   ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY / DEEPSEEK_API_KEY
 * === Optional env ===
 *   PFLX_AI_MODEL / PFLX_AI_MODEL_OPENAI / PFLX_AI_MODEL_GEMINI / PFLX_AI_MODEL_DEEPSEEK
 *   PFLX_KEY_SECRET   — REQUIRED to enable per-cohort host keys (encrypt/decrypt secret)
 *   SUPABASE_URL + SUPABASE_ANON_KEY  — REQUIRED for per-cohort key lookup (app_data is anon-readable)
 *   PFLX_ADMIN_SECRET — OPTIONAL; if set, the encrypt action requires a matching adminSecret
 */

import crypto from 'node:crypto';

export const config = { api: { bodyParser: { sizeLimit: '256kb' } } };

const MODELS = {
  anthropic: process.env.PFLX_AI_MODEL || 'claude-sonnet-4-6',
  openai: process.env.PFLX_AI_MODEL_OPENAI || 'gpt-4o-mini',
  gemini: process.env.PFLX_AI_MODEL_GEMINI || 'gemini-2.0-flash',
  deepseek: process.env.PFLX_AI_MODEL_DEEPSEEK || 'deepseek-chat',
};
const KEYS = {
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || '',
  deepseek: process.env.DEEPSEEK_API_KEY || '',
};
// client provider names → proxy provider names
const PROV_MAP = { claude: 'anthropic', anthropic: 'anthropic', openai: 'openai', gemini: 'gemini', deepseek: 'deepseek' };

// ── per-cohort key crypto (AES-256-GCM, secret only lives in server env) ──
function _secret() { return process.env.PFLX_KEY_SECRET || ''; }
function _aesKey() { return crypto.createHash('sha256').update(_secret()).digest(); } // 32 bytes
function encryptKey(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', _aesKey(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64'); // iv(12) | tag(16) | ct
}
function decryptKey(enc) {
  const raw = Buffer.from(String(enc), 'base64');
  const iv = raw.subarray(0, 12), tag = raw.subarray(12, 28), ct = raw.subarray(28);
  const d = crypto.createDecipheriv('aes-256-gcm', _aesKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

// Look up + decrypt a per-cohort host key (returns { provider, key } or null).
async function fetchCohortKey(cohort) {
  const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon || !_secret() || !cohort) return null;
  try {
    const r = await fetch(`${url}/rest/v1/app_data?key=eq.pflx_cohort_ai_keys&select=data`, {
      headers: { apikey: anon, authorization: `Bearer ${anon}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    const map = (rows && rows[0] && rows[0].data) || {};
    let entry = map[cohort];
    if (!entry) {
      const lc = String(cohort).toLowerCase().trim();
      for (const k of Object.keys(map)) { if (k.toLowerCase().trim() === lc) { entry = map[k]; break; } }
    }
    if (!entry || !entry.enc || !entry.provider) return null;
    const provider = PROV_MAP[entry.provider];
    if (!provider) return null;
    let key;
    try { key = decryptKey(entry.enc); } catch (e) { return null; }
    return key ? { provider, key } : null;
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      hasKey: !!KEYS.anthropic, // back-compat for the Module Builder probe
      providers: { anthropic: !!KEYS.anthropic, openai: !!KEYS.openai, gemini: !!KEYS.gemini, deepseek: !!KEYS.deepseek },
      model: MODELS.anthropic,
      cohortKeys: !!(_secret() && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  try {
    const body = req.body || {};

    // ── Host setup: encrypt a raw cohort key and hand back ciphertext ──
    if (body.action === 'encrypt') {
      if (!_secret()) return res.status(503).json({ error: 'cohort-keys-disabled' });
      if (process.env.PFLX_ADMIN_SECRET && body.adminSecret !== process.env.PFLX_ADMIN_SECRET) {
        return res.status(403).json({ error: 'admin-secret' });
      }
      const prov = PROV_MAP[body.provider];
      const key = String(body.key || '').trim();
      if (!prov) return res.status(400).json({ error: 'bad-provider' });
      if (!key) return res.status(400).json({ error: 'missing-key' });
      return res.status(200).json({ enc: encryptKey(key) });
    }

    // ── Generate ──
    let provider = PROV_MAP[body.provider] || 'anthropic';
    let apiKey = KEYS[provider];

    // Per-cohort host key overrides the platform env key when configured.
    if (body.cohort) {
      const ck = await fetchCohortKey(String(body.cohort));
      if (ck) { provider = ck.provider; apiKey = ck.key; }
    }
    if (!apiKey) return res.status(503).json({ error: 'no-key' });

    const system = String(body.system || '').slice(0, 6000);
    const maxTokens = Math.min(4000, parseInt(body.maxTokens, 10) || 1500);
    let messages = Array.isArray(body.messages) && body.messages.length
      ? body.messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 24000) })).slice(-24)
      : [{ role: 'user', content: String(body.prompt || '').slice(0, 24000) }];
    if (!messages[0].content) return res.status(400).json({ error: 'missing prompt/messages' });

    let text = '';
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODELS.anthropic, max_tokens: maxTokens, system, messages }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'anthropic upstream' });
      text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    } else if (provider === 'openai' || provider === 'deepseek') {
      const base = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : 'https://api.openai.com/v1';
      const r = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: MODELS[provider], max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, ...messages] }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || provider + ' upstream' });
      text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    } else {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents,
          generationConfig: { maxOutputTokens: maxTokens } }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'gemini upstream' });
      text = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || '';
    }
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server' });
  }
}
