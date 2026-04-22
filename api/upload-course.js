/**
 * PFLX Course Package Upload — Vercel Serverless Function
 *
 * Per-file upload to Vercel Blob (each POST = one file, so we never hit the
 * 4.5 MB function body limit). Files land at courses/{slug}/{path} in Blob.
 *
 * === Health check ===
 *   GET /api/upload-course → returns function status + env diagnostics
 *
 * === Upload one file ===
 *   POST /api/upload-course
 *     Headers:
 *       Content-Type:          the file's content type (e.g. text/html)
 *       x-pflx-course-slug:    the course slug (from course.json courseId)
 *       x-pflx-file-path:      URI-encoded relative path within the course folder
 *       x-pflx-upload-token:   (optional) required if UPLOAD_TOKEN env is set
 *     Body: raw file bytes
 *   → 200 { success: true, url, path }
 *
 * === Required env ===
 *   BLOB_READ_WRITE_TOKEN — auto-created when you connect a Vercel Blob store
 * === Optional env ===
 *   UPLOAD_TOKEN — shared secret for basic auth
 */

import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  maxDuration: 30,
};

const CONTENT_TYPE_FALLBACKS = {
  html: 'text/html; charset=utf-8',
  json: 'application/json; charset=utf-8',
  js:   'application/javascript; charset=utf-8',
  css:  'text/css; charset=utf-8',
  svg:  'image/svg+xml',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  mp4:  'video/mp4',
  webm: 'video/webm',
  mp3:  'audio/mpeg',
  wav:  'audio/wav',
  woff: 'font/woff',
  woff2:'font/woff2',
  ttf:  'font/ttf',
  otf:  'font/otf',
  txt:  'text/plain; charset=utf-8',
  md:   'text/markdown; charset=utf-8',
};

function contentTypeFallback(path) {
  const ext = (path.split('.').pop() || '').toLowerCase();
  return CONTENT_TYPE_FALLBACKS[ext] || 'application/octet-stream';
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, x-pflx-upload-token, x-pflx-course-slug, x-pflx-file-path, x-pflx-content-type');
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function safeSlug(raw) {
  return (raw || '').toString().trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function safePath(raw) {
  // Strip leading slashes, block traversal, collapse duplicate slashes
  const cleaned = (raw || '').replace(/^\/+/, '').replace(/\/+/g, '/');
  if (cleaned.includes('..')) throw new Error('Path traversal not allowed');
  if (!cleaned) throw new Error('Missing file path');
  return cleaned;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  // --- Health check ---
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      function: 'upload-course',
      version: '3-per-file',
      env: {
        BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'MISSING',
        UPLOAD_TOKEN: process.env.UPLOAD_TOKEN ? 'set' : 'unset (optional)',
      },
      node: process.version,
      time: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST to upload a file, or GET for health check.' });
  }

  // --- Optional shared-secret auth ---
  const expectedToken = process.env.UPLOAD_TOKEN;
  if (expectedToken) {
    const got = req.headers['x-pflx-upload-token'];
    if (!got || got !== expectedToken) {
      return res.status(401).json({ error: 'Invalid or missing upload token.' });
    }
  }

  // --- Require Blob to be wired ---
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN not configured. Connect a Vercel Blob store to this project.'
    });
  }

  try {
    // --- Parse headers ---
    const slug = safeSlug(req.headers['x-pflx-course-slug']);
    if (!slug) return res.status(400).json({ error: 'Missing x-pflx-course-slug header.' });

    const rawPath = req.headers['x-pflx-file-path'] || '';
    const relativePath = safePath(decodeURIComponent(rawPath));

    const contentType = req.headers['content-type'] || contentTypeFallback(relativePath);

    // --- Read body ---
    const body = await readRawBody(req);
    if (!body.length) {
      return res.status(400).json({ error: 'Empty body — POST the file bytes as the raw request body.' });
    }

    // --- Upload to Blob ---
    const blobPath = `courses/${slug}/${relativePath}`;
    const result = await put(blobPath, body, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return res.status(200).json({
      success: true,
      slug,
      path: relativePath,
      url: result.url,
      bytes: body.length,
      contentType,
    });
  } catch (err) {
    console.error('[upload-course] Error:', err);
    return res.status(500).json({
      error: 'Upload failed: ' + (err && err.message ? err.message : String(err))
    });
  }
}
