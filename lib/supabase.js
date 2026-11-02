/**
 * Acesso mínimo à tabela "leads" do Supabase pela API REST (sem dependências).
 * Usa a chave service_role, que existe SOMENTE nas variáveis de ambiente do servidor (Vercel).
 * A tabela tem RLS ativado e nenhuma política pública: o navegador nunca acessa os dados diretamente.
 */
'use strict';

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function configured() { return Boolean(URL_BASE && KEY); }

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${URL_BASE}/rest/v1/${path}`, { method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(8000) });
  const text = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// Registro do site (camelCase, aninhado) <-> linha da tabela (snake_case, plana).
function toRow(rec, ipHash) {
  return {
    id: rec.id, criado_em: rec.criadoEm, status: rec.status,
    empresa: rec.empresa, segmento: rec.segmento, cidade: rec.cidade, uf: rec.uf,
    unidades: rec.unidades, colaboradores: rec.colaboradores, necessidades: rec.necessidades,
    momento: rec.momento, urgencia: rec.classificacao.urgencia, desafio: rec.desafio,
    nome: rec.nome, whatsapp: rec.whatsapp, email: rec.email, periodo: rec.periodo,
    origem: rec.origem, contexto: rec.contexto, consentimento: rec.consentimento,
    notas: rec.notas, ip_hash: ipHash,
  };
}
function fromRow(r, MOMENTS) {
  return {
    id: r.id, criadoEm: r.criado_em, atualizadoEm: r.atualizado_em, status: r.status,
    empresa: r.empresa, segmento: r.segmento, cidade: r.cidade, uf: r.uf,
    unidades: r.unidades, colaboradores: r.colaboradores, necessidades: r.necessidades || [],
    momento: r.momento, desafio: r.desafio, nome: r.nome, whatsapp: r.whatsapp, email: r.email,
    periodo: r.periodo, origem: r.origem, contexto: r.contexto || {}, notas: r.notas || '',
    classificacao: { segmento: r.segmento, necessidades: r.necessidades || [], urgencia: r.urgencia, momento: MOMENTS[r.momento] },
  };
}

async function insertLead(rec, ipHash) {
  await rest('leads', { method: 'POST', body: toRow(rec, ipHash), prefer: 'return=minimal' });
}
async function countRecentByIp(ipHash, minutes) {
  const since = new Date(Date.now() - minutes * 60000).toISOString();
  const rows = await rest(`leads?select=id&ip_hash=eq.${encodeURIComponent(ipHash)}&criado_em=gte.${encodeURIComponent(since)}`);
  return rows.length;
}
async function listLeads(MOMENTS) {
  const rows = await rest('leads?select=*&order=criado_em.desc&limit=5000');
  return rows.map((r) => fromRow(r, MOMENTS));
}
async function updateLead(id, patch, MOMENTS) {
  const row = { atualizado_em: patch.atualizadoEm };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notas !== undefined) row.notas = patch.notas;
  const rows = await rest(`leads?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: row, prefer: 'return=representation' });
  return rows && rows[0] ? fromRow(rows[0], MOMENTS) : null;
}

module.exports = { configured, insertLead, countRecentByIp, listLeads, updateLead };
