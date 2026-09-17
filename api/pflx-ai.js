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
 *       messages?: [{ role, content, images? }] — multi-turn (wins over prompt)
 *                  images (user turns): [{ mimeType: image/jpeg|png|webp, data: base64 }]
 *                  → Gemini inline_data · Claude image blocks · OpenAI image_url (DeepSeek: text only)
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
 *   PFLX_ALLOWED_ORIGINS — OPTIONAL; extra comma-separated origins allowed to POST (v228)
 *   PFLX_RATE_PER_MIN / PFLX_RATE_PER_HOUR — OPTIONAL per-IP limits (default 60 / 600) (v228)
 *   PFLX_AI_MODEL_GEMINI_FALLBACK — OPTIONAL model tried when Gemini is out of quota (default gemini-2.5-flash-lite)
 *   ELEVENLABS_API_KEY — OPTIONAL; enables X-Bot's ElevenLabs voice for everyone (v230)
 *   ELEVENLABS_VOICE_ID / ELEVENLABS_MODEL — OPTIONAL (default EXAVITQu4vr4xnSDxMaL / eleven_flash_v2_5)
 *   PFLX_TTS_PER_MIN / PFLX_TTS_PER_HOUR — OPTIONAL per-IP voice limits (default 12 / 120) (v230)
 *
 * === Speak (v230) ===
 *   POST /api/pflx-ai  { action: 'tts', text, voiceId? }   (same origin gate + limits)
 *   → 200 audio/mpeg
 *   → 503 { error: 'no-key' } · 429 { error: 'busy' } · 402 { error: 'billing' } · 502 { error: 'tts' }
 *   The ElevenLabs key never reaches a browser (it used to be hard-coded in preview.html).
 *
 * === Protection (v228) ===
 *   POST is accepted only from PFLX sites (Origin allowlist); anything else → 403 { error: 'origin' }.
 *   Per-IP limits per warm instance → 429 { error: 'busy', message, retryAfter }.
 *   Upstream quota / rate-limit / overload → 429 { error: 'busy', ... } after one Gemini fallback try.
 *   Upstream billing problems (prepaid credits empty, billing off) → 402 { error: 'billing', message }.
 */

import crypto from 'node:crypto';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };   // X-Gems send instructions + knowledge; v226: + pictures (Vercel caps bodies at 4.5 MB)

const MODELS = {
  anthropic: process.env.PFLX_AI_MODEL || 'claude-sonnet-4-6',
  openai: process.env.PFLX_AI_MODEL_OPENAI || 'gpt-4o-mini',
  gemini: process.env.PFLX_AI_MODEL_GEMINI || 'gemini-2.5-flash',   // gemini-2.0-flash was shut down 2026-06-01
  deepseek: process.env.PFLX_AI_MODEL_DEEPSEEK || 'deepseek-chat',
};
const KEYS = {
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || '',
  deepseek: process.env.DEEPSEEK_API_KEY || '',
};
// v226: pictures on user turns (validated; max 3 per turn, 3.4 MB of base64 per request)
const IMG_MIME = /^image\/(jpeg|png|webp)$/;
const IMG_B64 = /^[A-Za-z0-9+/]+={0,2}$/;
function cleanImages(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 8)
    .filter(i => i && IMG_MIME.test(String(i.mimeType || '')) && typeof i.data === 'string' && i.data.length > 0 && i.data.length <= 2600000 && IMG_B64.test(i.data))
    .slice(0, 3)
    .map(i => ({ mimeType: String(i.mimeType), data: i.data }));
}
function capImages(messages, budget) {
  // newest pictures win; older ones are dropped (the text says a picture was shared)
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m.images || !m.images.length) continue;
    const size = m.images.reduce((s, im) => s + im.data.length, 0);
    if (size > budget) { m.content = '(' + m.images.length + ' picture(s) shared earlier)\n' + m.content; m.images = []; }
    else budget -= size;
  }
  return messages;
}

// ── v228: who may POST (browser Origin allowlist) ──
const ORIGINS = new Set([
  'https://prototypeflx.com', 'https://www.prototypeflx.com',
  'https://pflx-platform.vercel.app', 'https://pflx-pathway-portal.vercel.app',
  'https://pflx-battle-arena.vercel.app', 'https://pflx-xcoin-app.vercel.app',
  'https://pflx-darkcampus.vercel.app', 'https://thetomorrowteacher.github.io',
  ...String(process.env.PFLX_ALLOWED_ORIGINS || '').split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean),
]);
const ORIGIN_PATTERNS = [
  /^https:\/\/pflx-[a-z0-9-]+-thetomorrowteachers-projects\.vercel\.app$/,   // team preview deploys
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/,                          // local testing
];
function originAllowed(origin) {
  const o = String(origin || '').trim();
  if (!o || o === 'null') return false;
  return ORIGINS.has(o) || ORIGIN_PATTERNS.some(re => re.test(o));
}

// ── v228: per-IP limits (best effort: counts live in each warm instance) ──
const RATE_MIN = Math.max(1, parseInt(process.env.PFLX_RATE_PER_MIN, 10) || 60);
const RATE_HOUR = Math.max(RATE_MIN, parseInt(process.env.PFLX_RATE_PER_HOUR, 10) || 600);
const HITS = new Map();   // ip -> [timestamps in the last hour]
function rateCheck(ip, now = Date.now(), map = HITS, perMin = RATE_MIN, perHour = RATE_HOUR) {
  const key = String(ip || 'unknown');
  const list = (map.get(key) || []).filter(t => now - t < 3600000);
  const lastMin = list.filter(t => now - t < 60000);
  if (lastMin.length >= perMin) { map.set(key, list); return { ok: false, retryAfter: Math.max(1, Math.ceil((lastMin[0] + 60000 - now) / 1000)) }; }
  if (list.length >= perHour) { map.set(key, list); return { ok: false, retryAfter: Math.max(1, Math.ceil((list[0] + 3600000 - now) / 1000)) }; }
  list.push(now);
  map.set(key, list);
  if (map.size > 5000) { for (const [k, v] of map) { if (!v.length || now - v[v.length - 1] > 3600000) map.delete(k); } }
  return { ok: true };
}
function clientIp(req) {
  const h = req.headers || {};
  return String(h['x-forwarded-for'] || '').split(',')[0].trim() || String(h['x-real-ip'] || '') || (req.socket && req.socket.remoteAddress) || 'unknown';
}

// ── v228: turn upstream failures into messages students can act on ──
const GEMINI_FALLBACK = process.env.PFLX_AI_MODEL_GEMINI_FALLBACK || 'gemini-2.5-flash-lite';
const BUSY_MSG = 'X-Bot is busy right now. Try again in a minute.';
const BILLING_MSG = 'X-Bot is out of AI credits. Ask your host to top up the AI account.';
function upstreamMsg(data) { return String((data && data.error && (data.error.message || data.error.status)) || (data && typeof data.error === 'string' ? data.error : '') || ''); }
function classifyUpstream(status, data) {
  const msg = upstreamMsg(data);
  const e = (data && typeof data.error === 'object' && data.error) || {};
  const st = String(e.status || '');
  const code = String(e.code || '') + ' ' + String(e.type || '');
  if (/prepayment credits|credits are depleted|billing|credit balance|payment/i.test(msg) || /insufficient_quota|billing/i.test(code)) return 'billing';
  if (status === 429 || status === 529 || st === 'RESOURCE_EXHAUSTED' || /quota|rate.?limit|resource.?exhausted|overloaded/i.test(msg)) return 'busy';
  if (status === 503 && /overloaded|unavailable|try again/i.test(msg)) return 'busy';
  return 'error';
}
function retryAfterOf(data) {
  try {
    const d = (data && data.error && data.error.details) || [];
    for (const x of d) { const m = /^(\d+(?:\.\d+)?)s$/.exec(String(x && x.retryDelay || '')); if (m) return Math.min(3600, Math.ceil(Number(m[1]))); }
  } catch (e) {}
  return 60;
}
function sendBusy(res, retryAfter) {
  const n = Math.max(1, Math.min(3600, retryAfter || 60));
  res.setHeader('Retry-After', String(n));
  return res.status(429).json({ error: 'busy', message: BUSY_MSG, retryAfter: n });
}
function sendUpstream(res, provider, status, data) {
  const kind = classifyUpstream(status, data);
  if (kind === 'busy') return sendBusy(res, retryAfterOf(data));
  if (kind === 'billing') return res.status(402).json({ error: 'billing', message: BILLING_MSG, detail: upstreamMsg(data).slice(0, 200) });
  return res.status(502).json({ error: upstreamMsg(data) || provider + ' upstream' });
}
async function readJson(r) { try { return await r.json(); } catch (e) { return {}; } }

// ── v230: ElevenLabs text-to-speech (key only in server env) ──
const TTS = {
  key: process.env.ELEVENLABS_API_KEY || '',
  voice: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  model: process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5',
  fallback: 'eleven_multilingual_v2',
  perMin: Math.max(1, parseInt(process.env.PFLX_TTS_PER_MIN, 10) || 12),
  perHour: 0,
  hits: new Map(),
};
TTS.perHour = Math.max(TTS.perMin, parseInt(process.env.PFLX_TTS_PER_HOUR, 10) || 120);
const TTS_BILLING_MSG = 'The voice account is out of credits. X-Bot will use the built-in voice.';
function ttsKind(status, data) {
  const d = (data && data.detail) || {};
  const s = String((d && d.status) || '') + ' ' + String((d && d.message) || (typeof d === 'string' ? d : ''));
  if (/quota_exceeded|payment|subscription|credits|billing/i.test(s)) return 'billing';
  if (status === 429 || /too_many|rate.?limit|busy|concurren|system_busy/i.test(s)) return 'busy';
  if ((status === 400 || status === 404 || status === 422) && /model/i.test(s)) return 'model';
  return 'error';
}
async function speak(res, body) {
  if (!TTS.key) return res.status(503).json({ error: 'no-key', provider: 'elevenlabs' });
  const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'missing-text' });
  const voice = /^[A-Za-z0-9]{10,40}$/.test(String(body.voiceId || '')) ? String(body.voiceId) : TTS.voice;
  const call = (model) => fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice, {
    method: 'POST',
    headers: { accept: 'audio/mpeg', 'content-type': 'application/json', 'xi-api-key': TTS.key },
    body: JSON.stringify({ text, model_id: model, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
  });
  let r = await call(TTS.model);
  if (!r.ok) {
    let data = await readJson(r);
    let kind = ttsKind(r.status, data);
    if (kind === 'model' && TTS.model !== TTS.fallback) {
      r = await call(TTS.fallback);
      if (!r.ok) { data = await readJson(r); kind = ttsKind(r.status, data); }
    }
    if (!r.ok) {
      if (kind === 'busy') return sendBusy(res, 30);
      if (kind === 'billing') return res.status(402).json({ error: 'billing', message: TTS_BILLING_MSG });
      return res.status(502).json({ error: 'tts', status: r.status });
    }
  }
  const buf = Buffer.from(await r.arrayBuffer());
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(buf);
}

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
  const origin = String((req.headers && req.headers.origin) || '');
  const allowed = originAllowed(origin);
  res.setHeader('Vary', 'Origin');
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(allowed ? 200 : 403).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      hasKey: !!KEYS.anthropic, // back-compat for the Module Builder probe
      providers: { anthropic: !!KEYS.anthropic, openai: !!KEYS.openai, gemini: !!KEYS.gemini, deepseek: !!KEYS.deepseek, elevenlabs: !!TTS.key },
      model: MODELS.anthropic,
      cohortKeys: !!(_secret() && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  // v228: only PFLX sites may spend the AI key, and each IP gets a fair share
  if (!allowed) return res.status(403).json({ error: 'origin', message: 'This AI service only answers PFLX sites.' });
  const rl = rateCheck(clientIp(req));
  if (!rl.ok) return sendBusy(res, rl.retryAfter);

  try {
    const body = req.body || {};

    // ── v230: X-Bot voice (ElevenLabs), its own tighter per-IP limit ──
    if (body.action === 'tts') {
      const tl = rateCheck(clientIp(req), Date.now(), TTS.hits, TTS.perMin, TTS.perHour);
      if (!tl.ok) return sendBusy(res, tl.retryAfter);
      return await speak(res, body);
    }

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

    // X-Gems (Gemini personas) carry their instructions + knowledge in the system prompt.
    const system = String(body.system || '').slice(0, provider === 'gemini' ? 200000 : 6000);
    const maxTokens = Math.min(4000, parseInt(body.maxTokens, 10) || 1500);
    let messages = Array.isArray(body.messages) && body.messages.length
      ? body.messages.map(m => {
          const role = m.role === 'assistant' ? 'assistant' : 'user';
          return { role, content: String(m.content || '').slice(0, 24000), images: role === 'user' ? cleanImages(m.images) : [] };
        }).slice(-24)
      : [{ role: 'user', content: String(body.prompt || '').slice(0, 24000), images: [] }];
    if (!messages[0].content && !messages[0].images.length) return res.status(400).json({ error: 'missing prompt/messages' });
    capImages(messages, 3400000);
    const hasImg = m => m.images && m.images.length;

    let text = '';
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODELS.anthropic, max_tokens: maxTokens, system,
          messages: messages.map(m => ({ role: m.role, content: hasImg(m)
            ? [...m.images.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.mimeType, data: im.data } })), { type: 'text', text: m.content || '.' }]
            : m.content })) }),
      });
      const data = await readJson(r);
      if (!r.ok) return sendUpstream(res, 'anthropic', r.status, data);
      text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    } else if (provider === 'openai' || provider === 'deepseek') {
      const base = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : 'https://api.openai.com/v1';
      const r = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: MODELS[provider], max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, ...messages.map(m => ({ role: m.role, content: (hasImg(m) && provider === 'openai')
            ? [{ type: 'text', text: m.content || '.' }, ...m.images.map(im => ({ type: 'image_url', image_url: { url: `data:${im.mimeType};base64,${im.data}` } }))]
            : m.content }))] }),
      });
      const data = await readJson(r);
      if (!r.ok) return sendUpstream(res, provider, r.status, data);
      text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    } else {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user',
        parts: [...(hasImg(m) ? m.images.map(im => ({ inline_data: { mime_type: im.mimeType, data: im.data } })) : []), { text: m.content || '.' }] }));
      // Client may pin a Gemini model (X-Gems); only gemini-* ids are accepted.
      const wanted = /^gemini-[a-z0-9.\-]{2,40}$/.test(String(body.model || '')) ? String(body.model) : MODELS.gemini;
      const gen = { maxOutputTokens: maxTokens };
      const t = Number(body.temperature);
      if (Number.isFinite(t)) gen.temperature = Math.max(0, Math.min(2, t));
      const payload = { system_instruction: { parts: [{ text: system }] }, contents, generationConfig: gen };
      if (body.grounding) payload.tools = [{ google_search: {} }];
      const call = (model) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
      });
      let used = wanted;
      let r = await call(used);
      let data = await readJson(r);
      // retired / unknown model -> the current Flash alias
      if (!r.ok && (r.status === 404 || /not found|not supported|no longer available/i.test(upstreamMsg(data))) && used !== 'gemini-flash-latest') {
        used = 'gemini-flash-latest';
        r = await call(used);
        data = await readJson(r);
      }
      // v228: out of quota / rate-limited -> one try on the lighter model (its own, larger quota)
      if (!r.ok && classifyUpstream(r.status, data) === 'busy' && used !== GEMINI_FALLBACK) {
        used = GEMINI_FALLBACK;
        r = await call(used);
        data = await readJson(r);
      }
      if (!r.ok) return sendUpstream(res, 'gemini', r.status, data);
      text = ((data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [])
        .map(pt => pt && pt.text || '').join('');
    }
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server' });
  }
}
// test hooks (pure helpers, no secrets)
handler._test = { originAllowed, rateCheck, classifyUpstream, HITS, ttsKind, TTS };
