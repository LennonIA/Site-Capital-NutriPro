/**
 * Lógica compartilhada entre o servidor local (server.js) e as funções da Vercel (api/).
 * Sem dependências externas.
 */
'use strict';

const crypto = require('crypto');

const SEGMENTS = ['Padaria e confeitaria', 'Restaurante / food service', 'Lanchonete / hamburgueria', 'Pastelaria', 'Supermercado', 'Indústria alimentícia', 'Outro'];
const NEEDS = ['Boas práticas', 'Gestão da produção', 'Redução de perdas', 'Regularização sanitária', 'Fichas técnicas', 'Rotulagem', 'Treinamento de equipes', 'Abertura de negócio', 'Tecnologia e sistemas', 'Ainda não sei exatamente'];
const MOMENTS = { imediata: 'Solução imediata', meses: 'Contratar nos próximos meses', pesquisando: 'Pesquisando possibilidades', avaliacao: 'Avaliação inicial' };
const URGENCY = { imediata: 'alta', meses: 'media', avaliacao: 'media', pesquisando: 'baixa' };
const EMPLOYEES = ['1 a 5', '6 a 15', '16 a 50', '51 a 200', 'Mais de 200'];
const PERIODS = ['Manhã', 'Tarde', 'Noite', 'Qualquer horário'];
const STATUSES = ['novo', 'em contato', 'proposta enviada', 'ganho', 'perdido', 'sem perfil'];

function securityHeaders(siteUrl) {
  const h = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "script-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  };
  if (String(siteUrl).startsWith('https://')) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function str(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }

/* ---------------- leads ---------------- */

/** Anti-spam: honeypot preenchido ou envio rápido demais (< 4 s desde que o formulário abriu). */
function isSpam(body) {
  return Boolean(body.website) || (Number(body.elapsedMs) > 0 && Number(body.elapsedMs) < 4000);
}

function validateLead(b) {
  const errors = {};
  const ctx = b.contexto || {};
  const lead = {
    empresa: str(b.empresa, 120),
    segmento: str(b.segmento, 60),
    cidade: str(b.cidade, 80),
    uf: str(b.uf, 2).toUpperCase(),
    unidades: str(b.unidades, 20),
    colaboradores: str(b.colaboradores, 20),
    necessidades: Array.isArray(b.necessidades) ? b.necessidades.filter((n) => NEEDS.includes(n)) : [],
    momento: str(b.momento, 20),
    desafio: str(b.desafio, 1000),
    nome: str(b.nome, 100),
    whatsapp: str(b.whatsapp, 20).replace(/\D/g, ''),
    email: str(b.email, 160).toLowerCase(),
    periodo: str(b.periodo, 30),
    origem: str(b.origem, 60),
    contexto: {
      servicoInicial: str(ctx.servicoInicial, 80),
      diagnostico: str(ctx.diagnostico, 600),
      simulacao: str(ctx.simulacao, 600),
    },
    consentimento: b.consentimento === true,
  };
  if (lead.empresa.length < 2) errors.empresa = 'Informe o nome da empresa.';
  if (!SEGMENTS.includes(lead.segmento)) errors.segmento = 'Selecione o segmento.';
  if (lead.cidade.length < 2) errors.cidade = 'Informe a cidade.';
  if (!/^[A-Z]{2}$/.test(lead.uf)) errors.uf = 'Selecione o estado.';
  if (lead.colaboradores && !EMPLOYEES.includes(lead.colaboradores)) errors.colaboradores = 'Faixa inválida.';
  if (!lead.necessidades.length) errors.necessidades = 'Selecione ao menos uma opção.';
  if (!MOMENTS[lead.momento]) errors.momento = 'Selecione o momento atual.';
  if (lead.nome.length < 2) errors.nome = 'Informe seu nome.';
  if (!/^\d{10,11}$/.test(lead.whatsapp)) errors.whatsapp = 'WhatsApp com DDD (10 ou 11 dígitos).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) errors.email = 'E-mail inválido.';
  if (lead.periodo && !PERIODS.includes(lead.periodo)) errors.periodo = 'Período inválido.';
  if (!lead.consentimento) errors.consentimento = 'É necessário autorizar o contato.';
  return { lead, errors };
}

function makeProtocol() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `CN-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Registro completo do lead, com classificação interna por segmento, necessidade e urgência. */
function buildRecord(lead) {
  return {
    id: makeProtocol(),
    criadoEm: new Date().toISOString(),
    status: 'novo',
    classificacao: {
      segmento: lead.segmento,
      necessidades: lead.necessidades,
      urgencia: URGENCY[lead.momento],
      momento: MOMENTS[lead.momento],
    },
    ...lead,
    notas: '',
  };
}

/** Identificador do IP sem guardar o IP em si (LGPD): usado só para limitar envios repetidos. */
function hashIp(ip, salt) {
  return crypto.createHash('sha256').update(`${salt || 'capital-nutri'}:${ip}`).digest('hex').slice(0, 32);
}

async function notifyTeam(webhookUrl, record) {
  if (!webhookUrl) return 'nao_configurado';
  try {
    const r = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento: 'novo_lead', lead: record }),
      signal: AbortSignal.timeout(5000),
    });
    return r.ok ? 'enviado' : `falhou_${r.status}`;
  } catch (e) {
    console.error('[webhook] falha ao notificar:', e.message);
    return 'falhou';
  }
}

/* ---------------- admin ---------------- */

function checkBasicAuth(header, user, pass) {
  if (!user || !pass) return false;
  const h = header || '';
  if (!h.startsWith('Basic ')) return false;
  const [u, ...p] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
  const a = crypto.createHash('sha256').update(`${u}:${p.join(':')}`).digest();
  const b = crypto.createHash('sha256').update(`${user}:${pass}`).digest();
  return crypto.timingSafeEqual(a, b);
}

/** Valida a alteração vinda do painel. Retorna { patch } ou { error }. */
function validatePatch(body) {
  const patch = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return { error: 'Status inválido.' };
    patch.status = body.status;
  }
  if (body.notas !== undefined) patch.notas = str(body.notas, 2000);
  patch.atualizadoEm = new Date().toISOString();
  return { patch };
}

function csvCell(v) {
  const s = Array.isArray(v) ? v.join('; ') : String(v ?? '');
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // evita injeção de fórmulas em planilhas
  return `"${safe.replace(/"/g, '""')}"`;
}
function leadsToCSV(leads) {
  const cols = ['id', 'criadoEm', 'status', 'empresa', 'segmento', 'cidade', 'uf', 'unidades', 'colaboradores', 'necessidades', 'momento', 'desafio', 'nome', 'whatsapp', 'email', 'periodo', 'origem', 'notas'];
  const rows = [cols.join(',')].concat(leads.map((l) => cols.map((c) => csvCell(c === 'momento' ? MOMENTS[l.momento] : l[c])).join(',')));
  return '﻿' + rows.join('\r\n');
}

/* ---------------- artigos e SEO ---------------- */

function renderArticle(tpl, articles, slug, siteUrl) {
  const a = articles.find((x) => x.slug === slug && x.publicado !== false);
  if (!a) return null;
  const others = articles.filter((x) => x.slug !== a.slug && x.publicado !== false);
  const related = others.filter((x) => x.categoria === a.categoria).concat(others.filter((x) => x.categoria !== a.categoria)).slice(0, 3);
  const body = a.conteudo.map((b) => (b.tipo === 'h2' ? `<h2>${escapeHTML(b.texto)}</h2>`
    : b.tipo === 'lista' ? `<ul>${b.itens.map((i) => `<li>${escapeHTML(i)}</li>`).join('')}</ul>`
    : `<p>${escapeHTML(b.texto)}</p>`)).join('\n');
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: a.titulo, description: a.resumo,
    datePublished: a.data, author: { '@type': 'Organization', name: 'Capital Nutri' },
    publisher: { '@type': 'Organization', name: 'Capital Nutri', logo: { '@type': 'ImageObject', url: `${siteUrl}/assets/img/logo-capital-nutri.jpg` } },
    mainEntityOfPage: `${siteUrl}/insights/${a.slug}`,
  };
  return tpl
    .replace(/{{TITLE}}/g, escapeHTML(a.titulo))
    .replace(/{{DESCRIPTION}}/g, escapeHTML(a.resumo))
    .replace(/{{CATEGORY}}/g, escapeHTML(a.categoria))
    .replace(/{{READ}}/g, escapeHTML(a.leitura))
    .replace(/{{CANONICAL}}/g, `${siteUrl}/insights/${a.slug}`)
    .replace('{{DRAFT}}', a.revisado ? '' : '<p class="draft-note">Conteúdo de demonstração aguardando revisão técnica da Capital Nutri antes da publicação.</p>')
    .replace('{{BODY}}', body)
    .replace('{{RELATED}}', related.map((r) => `<a class="related-card" href="/insights/${escapeHTML(r.slug)}"><span>${escapeHTML(r.categoria)}</span><strong>${escapeHTML(r.titulo)}</strong></a>`).join(''))
    .replace('{{JSONLD}}', JSON.stringify(ld).replace(/</g, '\\u003c'));
}

function sitemapXML(articles, siteUrl) {
  const urls = ['/', '/insights/', '/privacidade.html'].concat(articles.filter((a) => a.publicado !== false).map((a) => `/insights/${a.slug}`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${siteUrl}${u}</loc></url>`).join('\n')}\n</urlset>`;
}
function robotsTxt(siteUrl) {
  return `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

module.exports = {
  STATUSES, MOMENTS,
  securityHeaders, escapeHTML, isSpam, validateLead, buildRecord, hashIp, notifyTeam,
  checkBasicAuth, validatePatch, leadsToCSV, renderArticle, sitemapXML, robotsTxt,
};
