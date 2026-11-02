/* Capital Nutri — painel comercial (requer autenticação no servidor). */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let leads = [], statuses = [];
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); };

  function fillSelect(sel, values) { values.forEach((v) => sel.add(new Option(v, v))); }

  function render() {
    const q = $('#f-q').value.toLowerCase(), seg = $('#f-seg').value, need = $('#f-need').value, st = $('#f-status').value, urg = $('#f-urg').value;
    const list = leads.filter((l) =>
      (!q || [l.empresa, l.nome, l.cidade, l.id, l.email].join(' ').toLowerCase().includes(q)) &&
      (!seg || l.segmento === seg) && (!need || l.necessidades.includes(need)) && (!st || l.status === st) && (!urg || l.classificacao.urgencia === urg)
    ).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    const count = (f) => leads.filter(f).length;
    $('#kpis').innerHTML = [
      ['Total de leads', leads.length], ['Novos', count((l) => l.status === 'novo')], ['Urgência alta', count((l) => l.classificacao.urgencia === 'alta')], ['Exibidos', list.length],
    ].map(([k, v]) => `<div class="kpi"><span>${k}</span><strong>${v}</strong></div>`).join('');
    $('#rows').innerHTML = list.length ? list.map((l) => `
      <tr>
        <td><strong>${esc(l.id)}</strong><small>${new Date(l.criadoEm).toLocaleString('pt-BR')}</small></td>
        <td><strong>${esc(l.empresa)}</strong><small>${esc(l.segmento)} · ${esc(l.cidade)}/${esc(l.uf)}</small><small>${esc(l.unidades)} unid. · ${esc(l.colaboradores || '—')} colab.</small></td>
        <td>${esc(l.nome)}<small><a href="https://wa.me/55${esc(l.whatsapp)}" target="_blank" rel="noopener">${esc(l.whatsapp)}</a></small><small><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></small><small>${esc(l.periodo)}</small></td>
        <td>${l.necessidades.map(esc).join('<br>')}</td>
        <td><span class="urg ${esc(l.classificacao.urgencia)}">${esc(l.classificacao.urgencia)}</span><small>${esc(l.classificacao.momento)}</small></td>
        <td>${esc(l.origem)}</td>
        <td><select class="status" data-id="${esc(l.id)}">${statuses.map((s) => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
        <td><details><summary>Ver</summary>
          ${l.desafio ? `<p><b>Desafio:</b> ${esc(l.desafio)}</p>` : ''}
          ${l.contexto.servicoInicial ? `<p><b>Serviço:</b> ${esc(l.contexto.servicoInicial)}</p>` : ''}
          ${l.contexto.diagnostico ? `<p><b>Diagnóstico:</b> ${esc(l.contexto.diagnostico)}</p>` : ''}
          ${l.contexto.simulacao ? `<p><b>Simulação:</b> ${esc(l.contexto.simulacao)}</p>` : ''}
          <label class="field"><span>Notas internas</span><textarea rows="3" data-notes="${esc(l.id)}">${esc(l.notas)}</textarea></label>
        </details></td>
      </tr>`).join('') : '<tr><td colspan="8">Nenhum lead encontrado.</td></tr>';
  }

  async function patch(id, data) {
    const r = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const b = await r.json().catch(() => ({}));
    if (!r.ok || !b.ok) throw new Error(b.error || 'Falha ao salvar');
    const i = leads.findIndex((l) => l.id === id);
    leads[i] = b.lead;
  }
  document.addEventListener('change', async (e) => {
    const s = e.target.closest('select.status');
    if (s) { try { await patch(s.dataset.id, { status: s.value }); toast('Status atualizado.'); render(); } catch (err) { toast(err.message); } }
  });
  document.addEventListener('focusout', async (e) => {
    const t = e.target.closest('[data-notes]');
    if (t) { try { await patch(t.dataset.notes, { notas: t.value }); toast('Notas salvas.'); } catch (err) { toast(err.message); } }
  });
  ['#f-q', '#f-seg', '#f-need', '#f-status', '#f-urg'].forEach((s) => $(s).addEventListener('input', render));

  fetch('/api/admin/leads').then((r) => { if (!r.ok) throw new Error(`Erro ${r.status}`); return r.json(); }).then((d) => {
    leads = d.leads; statuses = d.statuses;
    fillSelect($('#f-seg'), [...new Set(leads.map((l) => l.segmento))]);
    fillSelect($('#f-need'), [...new Set(leads.flatMap((l) => l.necessidades))]);
    fillSelect($('#f-status'), statuses);
    render();
  }).catch((e) => { $('#rows').innerHTML = `<tr><td colspan="8">Não foi possível carregar os leads (${esc(e.message)}).</td></tr>`; });
})();
