/* Capital Nutri — listagem de artigos (/insights/). */
(function () {
  'use strict';
  const CAT_ICON = { 'Gestão e lucratividade': 'chart', 'Boas práticas e segurança dos alimentos': 'shield', 'Produção inteligente': 'box', 'Legislação e regularização': 'doc', 'Rotulagem e fichas técnicas': 'tag', 'Tecnologia para negócios alimentícios': 'cpu' };
  const PATHS = { chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>', box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>', doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>', tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/>', cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/>' };
  const ico = (k) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${PATHS[k] || PATHS.book}</svg>`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const grid = document.getElementById('insight-grid');
  const cats = document.getElementById('insight-cats');
  fetch('/insights/articles.json').then((r) => r.json()).then((all) => {
    const list = all.filter((a) => a.publicado !== false);
    let active = 'Todos';
    cats.innerHTML = ['Todos', ...Object.keys(CAT_ICON)].map((c) => `<button type="button" role="tab" aria-selected="${c === active}">${c}</button>`).join('');
    const draw = () => {
      const items = list.filter((a) => active === 'Todos' || a.categoria === active);
      grid.innerHTML = items.length ? items.map((a) => `
        <a class="insight-card" href="/insights/${esc(a.slug)}">
          <div class="insight-cover">${a.imagem ? `<img src="${esc(a.imagem)}" alt="" loading="lazy">` : ico(CAT_ICON[a.categoria])}</div>
          <div class="insight-body"><div class="insight-meta"><span>${esc(a.categoria)}</span><span>${esc(a.leitura)}</span></div><h2 style="font-size:1.05rem">${esc(a.titulo)}</h2><p>${esc(a.resumo)}</p></div>
        </a>`).join('') : '<p class="empty">Em breve, novos conteúdos nesta categoria.</p>';
    };
    cats.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; active = b.textContent; cats.querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', String(x === b))); draw(); });
    draw();
  }).catch(() => { grid.innerHTML = '<p class="empty">Não foi possível carregar os artigos agora.</p>'; });
})();
