/**
 * Capital Nutri — servidor LOCAL (Node.js >= 18, sem dependências).
 * Em produção o site roda na Vercel (pasta api/ + vercel.json) com os leads no Supabase.
 * Este servidor usa a mesma lógica (lib/core.js) e grava os leads em data/leads.json,
 * para testar tudo no computador sem precisar de contas externas.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const core = require('./lib/core');

const PORT = Number(process.env.PORT || 3000);
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const { ADMIN_USER = '', ADMIN_PASS = '', NOTIFY_WEBHOOK_URL = '' } = process.env;

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const ARTICLES_FILE = path.join(PUBLIC_DIR, 'insights', 'articles.json');
const ADMIN_PAGE = path.join(ROOT, 'admin', 'index.html');
const HEADERS = core.securityHeaders(SITE_URL);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2',
};

function send(res, status, body, headers = {}) { res.writeHead(status, { ...HEADERS, ...headers }); res.end(body); }
function sendJSON(res, status, obj) { send(res, status, JSON.stringify(obj), { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' }); }
function readBody(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('payload too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function readJSONFile(file, fallback) { try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch { return fallback; } }
// Escrita atômica + fila para evitar corrupção com envios simultâneos.
let writeQueue = Promise.resolve();
function writeJSONFile(file, data) {
  writeQueue = writeQueue.then(async () => {
    const tmp = `${file}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await fsp.rename(tmp, file);
  });
  return writeQueue;
}

/* ---------------- rate limit simples por IP ---------------- */
const hits = new Map();
function rateLimited(ip, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}
setInterval(() => { const now = Date.now(); for (const [ip, l] of hits) if (!l.some((t) => now - t < 600000)) hits.delete(ip); }, 600000).unref();

/* ---------------- leads ---------------- */
async function handleCreateLead(req, res) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (rateLimited(ip)) return sendJSON(res, 429, { ok: false, error: 'Muitas solicitações. Tente novamente em alguns minutos.' });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch (e) { return sendJSON(res, e.status || 400, { ok: false, error: 'Requisição inválida.' }); }
  if (core.isSpam(body)) return sendJSON(res, 400, { ok: false, error: 'Não foi possível validar o envio.' });
  const { lead, errors } = core.validateLead(body);
  if (Object.keys(errors).length) return sendJSON(res, 422, { ok: false, error: 'Verifique os campos.', fields: errors });
  const record = core.buildRecord(lead);
  const leads = await readJSONFile(LEADS_FILE, []);
  leads.push(record);
  try { await writeJSONFile(LEADS_FILE, leads); } catch (e) {
    console.error('[leads] falha ao salvar:', e);
    return sendJSON(res, 500, { ok: false, error: 'Não conseguimos registrar sua solicitação agora.' });
  }
  core.notifyTeam(NOTIFY_WEBHOOK_URL, record).then((s) => console.log(`[lead] ${record.id} salvo; notificação: ${s}`));
  sendJSON(res, 201, { ok: true, id: record.id });
}

/* ---------------- admin ---------------- */
function requireAdmin(req, res) {
  if (!ADMIN_USER || !ADMIN_PASS) { send(res, 503, 'Painel desativado: configure ADMIN_USER e ADMIN_PASS (veja README.md).', { 'Content-Type': MIME['.txt'] }); return false; }
  if (!core.checkBasicAuth(req.headers.authorization, ADMIN_USER, ADMIN_PASS)) {
    send(res, 401, 'Autenticação necessária.', { 'WWW-Authenticate': 'Basic realm="Capital Nutri Admin", charset="UTF-8"', 'Content-Type': MIME['.txt'] });
    return false;
  }
  return true;
}
async function handleAdmin(req, res, url) {
  if (!requireAdmin(req, res)) return;
  if (url.pathname === '/admin' || url.pathname === '/admin/') return send(res, 200, await fsp.readFile(ADMIN_PAGE), { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
  const leads = await readJSONFile(LEADS_FILE, []);
  if (req.method === 'GET' && url.pathname === '/api/admin/leads') return sendJSON(res, 200, { ok: true, leads: leads.slice().reverse(), statuses: core.STATUSES });
  if (req.method === 'GET' && url.pathname === '/api/admin/leads.csv') {
    return send(res, 200, core.leadsToCSV(leads), {
      'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="leads-capital-nutri-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
  }
  const m = url.pathname.match(/^\/api\/admin\/leads\/(CN-[\w-]+)$/);
  if (req.method === 'PATCH' && m) {
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return sendJSON(res, 400, { ok: false, error: 'JSON inválido.' }); }
    const { patch, error } = core.validatePatch(body);
    if (error) return sendJSON(res, 422, { ok: false, error });
    const lead = leads.find((l) => l.id === m[1]);
    if (!lead) return sendJSON(res, 404, { ok: false, error: 'Lead não encontrado.' });
    Object.assign(lead, patch);
    await writeJSONFile(LEADS_FILE, leads);
    return sendJSON(res, 200, { ok: true, lead });
  }
  sendJSON(res, 404, { ok: false, error: 'Rota não encontrada.' });
}

/* ---------------- estáticos ---------------- */
async function serveNotFound(res) {
  try { send(res, 404, await fsp.readFile(path.join(PUBLIC_DIR, '404.html')), { 'Content-Type': MIME['.html'] }); }
  catch { send(res, 404, 'Página não encontrada', { 'Content-Type': MIME['.txt'] }); }
}
async function serveStatic(res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return serveNotFound(res);
  try {
    const stat = await fsp.stat(file);
    if (!stat.isFile()) return serveNotFound(res);
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { ...HEADERS, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400', 'Content-Length': stat.size });
    fs.createReadStream(file).pipe(res);
  } catch { serveNotFound(res); }
}

/* ---------------- roteador ---------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/health') return sendJSON(res, 200, { ok: true, webhook: Boolean(NOTIFY_WEBHOOK_URL) });
    if (url.pathname === '/api/leads' && req.method === 'POST') return await handleCreateLead(req, res);
    if (url.pathname === '/admin' || url.pathname === '/admin/' || url.pathname.startsWith('/api/admin/')) return await handleAdmin(req, res, url);
    if (url.pathname === '/sitemap.xml') return send(res, 200, core.sitemapXML(await readJSONFile(ARTICLES_FILE, []), SITE_URL), { 'Content-Type': MIME['.xml'] });
    if (url.pathname === '/robots.txt') return send(res, 200, core.robotsTxt(SITE_URL), { 'Content-Type': MIME['.txt'] });
    if (url.pathname === '/insights/artigo.html') return serveNotFound(res);
    const art = url.pathname.match(/^\/insights\/([a-z0-9-]+)\/?$/);
    if (art) {
      const tpl = await fsp.readFile(path.join(PUBLIC_DIR, 'insights', 'artigo.html'), 'utf8');
      const html = core.renderArticle(tpl, await readJSONFile(ARTICLES_FILE, []), art[1], SITE_URL);
      return html ? send(res, 200, html, { 'Content-Type': MIME['.html'] }) : serveNotFound(res);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJSON(res, 405, { ok: false, error: 'Método não permitido.' });
    return await serveStatic(res, url.pathname);
  } catch (e) {
    console.error(e);
    sendJSON(res, 500, { ok: false, error: 'Erro interno.' });
  }
});

fs.mkdirSync(DATA_DIR, { recursive: true });
server.listen(PORT, () => {
  console.log(`Capital Nutri (local) em http://localhost:${PORT}`);
  if (!ADMIN_USER || !ADMIN_PASS) console.warn('Aviso: ADMIN_USER/ADMIN_PASS não configurados — painel /admin desativado.');
});
