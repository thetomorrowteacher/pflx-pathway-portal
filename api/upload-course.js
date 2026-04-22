/**
 * PFLX Course Package Upload — Vercel Serverless Function
 *
 * POST /api/upload-course
 *   Body:    application/zip (raw bytes of a course zip)
 *   Headers: x-pflx-upload-token (optional — required if UPLOAD_TOKEN env is set)
 *
 * Extracts the zip, validates course.json, uploads every file to Vercel Blob
 * at courses/{slug}/..., and returns the public base URL.
 *
 * The client then stores that URL in the node's coursePackage field. The
 * pathway portal's launch logic detects a full URL and opens
 * {baseUrl}/viewer.html (player) or {baseUrl}/host.html (host) accordingly.
 *
 * Env vars (Vercel dashboard → project → settings → environment variables):
 *   BLOB_READ_WRITE_TOKEN  — auto-created when you enable Blob on the project
 *   UPLOAD_TOKEN           — (optional) shared secret to gate uploads; if
 *                            unset, any POST is accepted (prototype mode)
 */

import { put } from '@vercel/blob';
import JSZip from 'jszip';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  maxDuration: 60,
};

const CONTENT_TYPES = {
  html: 'text/html; charset=utf-8',
  json: 'application/json; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
};

function contentTypeFor(path) {
  const ext = (path.split('.').pop() || '').toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

function slugify(raw) {
  return (raw || '').toString().trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-pflx-upload-token');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  // --- Auth gate (optional, based on UPLOAD_TOKEN env var) ---
  const expected = process.env.UPLOAD_TOKEN;
  if (expected) {
    const got = req.headers['x-pflx-upload-token'];
    if (!got || got !== expected) {
      res.status(401).json({ error: 'Invalid or missing upload token.' });
      return;
    }
  }

  // --- Require Blob token to be configured ---
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN not configured. Enable Vercel Blob on this project.'
    });
    return;
  }

  try {
    const body = await readRawBody(req);
    if (!body.length) {
      res.status(400).json({ error: 'Empty body. POST the zip as the raw request body.' });
      return;
    }

    // --- Unzip ---
    const zip = await JSZip.loadAsync(body);
    const entries = Object.values(zip.files).filter(e => !e.dir);
    if (!entries.length) {
      res.status(400).json({ error: 'Zip is empty.' });
      return;
    }

    // Find course.json anywhere in the archive
    const courseJsonEntry = entries.find(e => /(^|\/)course\.json$/.test(e.name));
    if (!courseJsonEntry) {
      res.status(400).json({ error: 'No course.json found in the zip.' });
      return;
    }

    let manifest;
    try {
      manifest = JSON.parse(await courseJsonEntry.async('string'));
    } catch (err) {
      res.status(400).json({ error: 'course.json is not valid JSON: ' + err.message });
      return;
    }

    if (!manifest.courseId && !manifest.slug) {
      res.status(400).json({ error: 'course.json missing courseId (or slug).' });
      return;
    }
    if (!Array.isArray(manifest.slides)) {
      res.status(400).json({ error: 'course.json missing slides array.' });
      return;
    }

    const slug = slugify(manifest.courseId || manifest.slug);
    if (!slug) {
      res.status(400).json({ error: 'Unable to derive slug from courseId.' });
      return;
    }

    // --- Strip common root prefix (if zip has a single top-level folder) ---
    const firstSeg = entries[0].name.split('/')[0];
    const allShareRoot = firstSeg && entries.every(e => e.name.startsWith(firstSeg + '/'));
    const rootPrefix = allShareRoot ? firstSeg + '/' : '';

    // --- Upload each file to Blob ---
    const uploaded = [];
    for (const entry of entries) {
      const relativePath = entry.name.replace(rootPrefix, '');
      if (!relativePath || relativePath.endsWith('/')) continue;
      // Skip hidden files / macOS metadata
      if (relativePath.split('/').some(seg => seg.startsWith('.') || seg === '__MACOSX')) continue;

      const data = await entry.async('nodebuffer');
      const blobPath = `courses/${slug}/${relativePath}`;

      const { url } = await put(blobPath, data, {
        access: 'public',
        contentType: contentTypeFor(relativePath),
        allowOverwrite: true,
        addRandomSuffix: false,
      });

      uploaded.push({ path: relativePath, url, bytes: data.length });
    }

    // --- Derive base URL from the viewer.html file ---
    const viewer = uploaded.find(f => f.path === 'viewer.html');
    const host = uploaded.find(f => f.path === 'host.html');
    if (!viewer) {
      res.status(400).json({
        error: 'Uploaded, but no viewer.html found in the zip. Files are live in Blob storage but the node launcher will not be able to open them.',
        slug,
        uploaded
      });
      return;
    }

    const baseUrl = viewer.url.replace(/\/viewer\.html(\?.*)?$/, '');

    res.status(200).json({
      success: true,
      slug,
      title: manifest.title || slug,
      baseUrl,
      viewerUrl: viewer.url,
      hostUrl: host ? host.url : null,
      files: uploaded.length,
      totalBytes: uploaded.reduce((sum, f) => sum + f.bytes, 0),
      uploaded: uploaded.map(f => ({ path: f.path, bytes: f.bytes })),
    });
  } catch (err) {
    console.error('[upload-course] Error:', err);
    res.status(500).json({
      error: 'Upload failed: ' + (err && err.message ? err.message : String(err))
    });
  }
}
