/**
 * Vercel: painel comercial protegido por usuário e senha (ADMIN_USER / ADMIN_PASS).
 * Rotas (via rewrites do vercel.json):
 *   /admin                  -> página do painel
 *   /api/admin/leads        -> GET lista
 *   /api/admin/leads.csv    -> GET exportação
 *   /api/admin/leads/:id    -> PATCH status/notas
 */
'use strict';

const fs = require('fs');
const path = require('path');
const core = require('../lib/core');
const db = require('../lib/supabase');

// Fora de /public de propósito: a página só é entregue depois do login.
const PAGE = path.join(process.cwd(), 'admin', 'index.html');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const { ADMIN_USER, ADMIN_PASS } = process.env;
  if (!ADMIN_USER || !ADMIN_PASS) return res.status(503).send('Painel desativado: configure ADMIN_USER e ADMIN_PASS na Vercel.');
  if (!core.checkBasicAuth(req.headers.authorization, ADMIN_USER, ADMIN_PASS)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Capital Nutri Admin", charset="UTF-8"');
    return res.status(401).send('Autenticação necessária.');
  }

  const route = req.query.route;
  try {
    if (route === 'page') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fs.readFileSync(PAGE, 'utf8'));
    }
    if (!db.configured()) return res.status(503).json({ ok: false, error: 'Supabase não configurado.' });
    if (route === 'list' && req.method === 'GET') {
      return res.status(200).json({ ok: true, leads: await db.listLeads(core.MOMENTS), statuses: core.STATUSES });
    }
    if (route === 'csv' && req.method === 'GET') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="leads-capital-nutri-${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.status(200).send(core.leadsToCSV(await db.listLeads(core.MOMENTS)));
    }
    if (route === 'update' && req.method === 'PATCH') {
      const id = String(req.query.id || '');
      if (!/^CN-[\w-]+$/.test(id)) return res.status(400).json({ ok: false, error: 'Protocolo inválido.' });
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { patch, error } = core.validatePatch(body || {});
      if (error) return res.status(422).json({ ok: false, error });
      const lead = await db.updateLead(id, patch, core.MOMENTS);
      return lead ? res.status(200).json({ ok: true, lead }) : res.status(404).json({ ok: false, error: 'Lead não encontrado.' });
    }
    return res.status(404).json({ ok: false, error: 'Rota não encontrada.' });
  } catch (e) {
    console.error('[admin]', e.message);
    return res.status(500).json({ ok: false, error: 'Erro ao acessar os dados.' });
  }
};
