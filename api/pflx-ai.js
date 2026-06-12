/**
 * PFLX AI — Vercel Serverless Function (multi-provider)
 *
 * One server-side AI door for the whole platform: the Module Builder,
 * the Console's X-Bot, and any sub-app. Keys live in Vercel env vars —
 * they never ship to a browser and they "follow" every device.
 *
 * === Health check ===
 *   GET /api/pflx-ai
 *   → { ok, hasKey, providers: { anthropic, openai, gemini }, model }
 *
 * === Generate ===
 *   POST /api/pflx-ai
 *     Body (JSON):
 *       provider?: 'anthropic' | 'openai' | 'gemini'   (default anthropic)
 *       system?:   string
 *       prompt?:   string                    — single-turn convenience
 *       messages?: [{ role, content }]       — multi-turn (wins over prompt)
 *       maxTokens?: number
 *   → 200 { text }
 *   → 503 { error: 'no-key' }   when that provider's key isn't configured
 *
 * === Env (Vercel → Project → Settings → Environment Variables) ===
 *   ANTHROPIC_API_KEY    — console.anthropic.com
 *   OPENAI_API_KEY       — platform.openai.com
 *   GEMINI_API_KEY       — aistudio.google.com
 * === Optional env ===
 *   PFLX_AI_MODEL         — Anthropic model override (default claude-sonnet-4-6)
 *   PFLX_AI_MODEL_OPENAI  — default gpt-4o-mini
 *   PFLX_AI_MODEL_GEMINI  — default gemini-2.0-flash
 */

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      hasKey: !!KEYS.anthropic,   // back-compat for the Module Builder probe
      providers: { anthropic: !!KEYS.anthropic, openai: !!KEYS.openai, gemini: !!KEYS.gemini, deepseek: !!KEYS.deepseek },
      model: MODELS.anthropic,
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  try {
    const body = req.body || {};
    const provider = ['anthropic', 'openai', 'gemini', 'deepseek'].includes(body.provider) ? body.provider : 'anthropic';
    if (!KEYS[provider]) return res.status(503).json({ error: 'no-key' });

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
        headers: { 'content-type': 'application/json', 'x-api-key': KEYS.anthropic, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODELS.anthropic, max_tokens: maxTokens, system, messages }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'anthropic upstream' });
      text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    } else if (provider === 'openai' || provider === 'deepseek') {
      // both speak the OpenAI chat-completions protocol
      const base = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : 'https://api.openai.com/v1';
      const r = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${KEYS[provider]}` },
        body: JSON.stringify({ model: MODELS[provider], max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, ...messages] }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || provider + ' upstream' });
      text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    } else {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${KEYS.gemini}`, {
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
