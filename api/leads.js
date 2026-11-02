/** Vercel: POST /api/leads — valida, classifica e salva o lead no Supabase. */
'use strict';

const core = require('../lib/core');
const db = require('../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  if (!db.configured()) {
    console.error('[leads] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados.');
    return res.status(503).json({ ok: false, error: 'Recebimento de solicitações ainda não configurado.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'Requisição inválida.' });
  if (core.isSpam(body)) return res.status(400).json({ ok: false, error: 'Não foi possível validar o envio.' });

  const { lead, errors } = core.validateLead(body);
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, error: 'Verifique os campos.', fields: errors });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
  const ipHash = core.hashIp(ip, process.env.IP_HASH_SALT);
  try {
    if ((await db.countRecentByIp(ipHash, 10)) >= 5) {
      return res.status(429).json({ ok: false, error: 'Muitas solicitações. Tente novamente em alguns minutos.' });
    }
    const record = core.buildRecord(lead);
    await db.insertLead(record, ipHash);
    // A notificação não pode impedir o registro: falhas só vão para o log.
    const n = await core.notifyTeam(process.env.NOTIFY_WEBHOOK_URL, record);
    console.log(`[lead] ${record.id} salvo; notificação: ${n}`);
    return res.status(201).json({ ok: true, id: record.id });
  } catch (e) {
    console.error('[leads] falha ao salvar:', e.message);
    return res.status(500).json({ ok: false, error: 'Não conseguimos registrar sua solicitação agora.' });
  }
};
