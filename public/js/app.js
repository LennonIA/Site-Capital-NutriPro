/* Capital Nutri — interações do site (JavaScript puro, sem dependências). */
(function () {
  'use strict';

  const CFG = window.CN_CONFIG || {};
  const EMP = CFG.empresa || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const brl = (v, digits = 0) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: digits, minimumFractionDigits: digits });
  const brlShort = (v) => (v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi` : v >= 1e3 ? `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : brl(v));
  const parseNum = (s) => Number(String(s).replace(/\D/g, '')) || 0;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id) => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  document.documentElement.classList.remove('no-js');

  /* ======================= Toast ======================= */
  let toastTimer;
  function toast(msg, ms = 4200) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ======================= Efeitos temáticos (dinheiro, moedas, checks) ======================= */
  const FX_SVG = {
    bill: '<svg viewBox="0 0 64 34"><rect x="1" y="1" width="62" height="32" rx="5" fill="#5BBE2E" stroke="#2E8A1E" stroke-width="2"/><rect x="6" y="6" width="52" height="22" rx="3" fill="none" stroke="#A6E38A" stroke-width="1.5"/><circle cx="32" cy="17" r="8.5" fill="#A6E38A"/><text x="32" y="21" font-size="10" font-weight="800" text-anchor="middle" fill="#1F6B12" font-family="sans-serif">R$</text></svg>',
    coin: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14.5" fill="#F2C14E" stroke="#C9921A" stroke-width="2"/><circle cx="16" cy="16" r="10.5" fill="none" stroke="#E0A92E" stroke-width="1.5"/><text x="16" y="20.5" font-size="10.5" font-weight="800" text-anchor="middle" fill="#8A5B00" font-family="sans-serif">R$</text></svg>',
    check: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#5BBE2E"/><path d="M9 16.5l4.5 4.5L23 11.5" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shield: '<svg viewBox="0 0 32 36"><path d="M16 2l13 5v9c0 8-5.5 14-13 17C8.5 30 3 24 3 16V7z" fill="#1E63E0"/><path d="M16 2l13 5v9c0 8-5.5 14-13 17z" fill="#3FA02A"/><path d="M10 17l4 4 8-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bread: '<svg viewBox="0 0 40 28"><path d="M3 20C3 10 11 4 20 4s17 6 17 16v4H3z" fill="#E8A317"/><path d="M12 9l3 6M20 7v7M28 9l-3 6" stroke="#B87A0E" stroke-width="2.5" stroke-linecap="round"/></svg>',
    chart: '<svg viewBox="0 0 32 32"><rect x="3" y="18" width="6" height="11" rx="1.5" fill="#1E63E0"/><rect x="13" y="11" width="6" height="18" rx="1.5" fill="#5BBE2E"/><rect x="23" y="4" width="6" height="25" rx="1.5" fill="#A6E38A"/></svg>',
    warn: '<svg viewBox="0 0 32 30"><path d="M16 2l14 26H2z" fill="#E8A317"/><path d="M16 11v8M16 23v.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
  };
  const FX_SIZE = { bill: 54, coin: 28, check: 28, shield: 30, bread: 36, chart: 28, warn: 28 };
  const fxLayer = document.createElement('div');
  fxLayer.className = 'fx-layer';
  fxLayer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(fxLayer);
  /** Explosão de ícones a partir de um ponto. fall=true faz os itens caírem (representa perda). */
  function burst(x, y, { kinds = ['bill', 'coin'], count = 14, spread = 260, rise = 260, fall = false, duration = 1500 } = {}) {
    if (reduced || !fxLayer.animate) return;
    const n = Math.min(count, 28);
    for (let i = 0; i < n; i++) {
      const kind = kinds[i % kinds.length];
      const el = document.createElement('div');
      el.className = 'fx-item';
      const s = FX_SIZE[kind] * (0.8 + Math.random() * 0.5);
      el.style.width = `${s}px`;
      el.style.height = `${s}px`;
      el.innerHTML = FX_SVG[kind];
      fxLayer.appendChild(el);
      const dx = (Math.random() - 0.5) * spread;
      const dy = fall ? 140 + Math.random() * rise : -(rise * (0.5 + Math.random() * 0.6));
      const rot = (Math.random() - 0.5) * 540;
      const x0 = x - s / 2, y0 = y - s / 2;
      el.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.3) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${x0 + dx * 0.35}px, ${y0 + (fall ? -40 : dy * 0.55)}px) scale(1) rotate(${rot * 0.4}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${x0 + dx}px, ${y0 + dy}px) scale(.9) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: duration * (0.75 + Math.random() * 0.5), delay: Math.random() * 180, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).onfinish = () => el.remove();
    }
  }
  function burstFrom(el, opts) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  /* ======================= Serviços ======================= */
  const SERVICES = [
    { id: 'gestao', titulo: 'Gestão e inteligência da produção', icone: 'chart',
      texto: 'Produza o que vende, na quantidade certa. Planejamos a produção, acompanhamos indicadores e atacamos as perdas para sua operação ganhar eficiência.',
      tags: ['Planejamento da produção', 'Indicadores', 'Controle de perdas', 'Análise da demanda', 'Melhoria de processos'],
      ganhos: ['Produção alinhada às vendas', 'Perdas medidas e atacadas na causa', 'Decisões baseadas em indicadores'],
      needs: ['Gestão da produção', 'Redução de perdas'] },
    { id: 'bpf', titulo: 'Boas Práticas de Fabricação', icone: 'shield',
      texto: 'Segurança dos alimentos no dia a dia, não só no papel. Implantação, acompanhamento e melhoria das condições higiênico-sanitárias.',
      tags: ['Implantação', 'Monitoramento', 'Treinamentos', 'Adequação de processos'],
      ganhos: ['Rotina segura na manipulação', 'Equipe consciente do porquê de cada cuidado', 'Operação preparada no dia a dia'], needs: ['Boas práticas'] },
    { id: 'regularizacao', titulo: 'Regularização e documentação sanitária', icone: 'doc',
      texto: 'Documentos, procedimentos, manuais e registros aplicáveis ao seu estabelecimento, com suporte para atender às exigências da Vigilância Sanitária.',
      tags: ['Procedimentos', 'Manuais', 'Registros', 'Suporte à fiscalização'],
      ganhos: ['Documentação organizada e aplicável', 'Procedimentos que refletem a prática', 'Mais segurança diante da fiscalização'], needs: ['Regularização sanitária'] },
    { id: 'fichas', titulo: 'Fichas técnicas, rotulagem e padronização', icone: 'tag',
      texto: 'Cada produto sempre igual, com custo conhecido. Fichas técnicas, informações nutricionais e rotulagem conforme os requisitos aplicáveis.',
      tags: ['Fichas técnicas', 'Padronização', 'Informação nutricional', 'Rotulagem'],
      ganhos: ['Produtos sempre iguais', 'Custo de cada receita conhecido', 'Rótulos conforme os requisitos aplicáveis'], needs: ['Fichas técnicas', 'Rotulagem'] },
    { id: 'abertura', titulo: 'Abertura e estruturação de negócios', icone: 'store',
      texto: 'Comece certo. Suporte técnico e operacional para abrir padarias, restaurantes, indústrias e outros estabelecimentos alimentícios.',
      tags: ['Planejamento', 'Fluxos', 'Estruturação'],
      ganhos: ['Estrutura pensada desde o início', 'Fluxos de produção organizados', 'Menos retrabalho e surpresas'], needs: ['Abertura de negócio'] },
    { id: 'treinamentos', titulo: 'Treinamentos e desenvolvimento de equipes', icone: 'users',
      texto: 'Menos dependência do dono, mais autonomia da equipe. Capacitação de manipuladores, gestores e líderes de produção.',
      tags: ['Manipuladores', 'Gestores', 'Líderes de produção'],
      ganhos: ['Equipe com mais autonomia', 'Padrão mantido sem depender do dono', 'Líderes preparados para conduzir'], needs: ['Treinamento de equipes'] },
    { id: 'tecnologia', titulo: 'Tecnologia e soluções digitais', icone: 'cpu', badge: 'Aplicadas em cada projeto',
      texto: 'Desenvolvemos e aplicamos ferramentas de gestão, controle e análise de dados conforme a necessidade da sua operação, para decisões baseadas em informação.',
      tags: ['Controles', 'Análise de dados', 'Indicadores de produção'],
      ganhos: ['Controles da produção mais práticos', 'Dados organizados para decidir', 'Ferramentas ajustadas à sua operação'], needs: ['Tecnologia e sistemas'] },
  ];
  const svcById = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
  const NEEDS = ['Boas práticas', 'Gestão da produção', 'Redução de perdas', 'Regularização sanitária', 'Fichas técnicas', 'Rotulagem', 'Treinamento de equipes', 'Abertura de negócio', 'Tecnologia e sistemas', 'Ainda não sei exatamente'];

  /* ======================= Avisos de demonstração ======================= */
  if (CFG.mostrarAvisosDeDemonstracao) $$('[data-demo]').forEach((el) => (el.hidden = false));

  /* ======================= Header / navegação ======================= */
  const header = $('.site-header');
  const progressBar = $('.scroll-progress');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 20);
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    updateTimeline();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const menuBtn = $('.menu-toggle');
  const nav = $('#main-nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuBtn.innerHTML = icon(open ? 'close' : 'menu');
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setMenu(false); setFab(false); } });

  // Seção atual (para o WhatsApp contextual)
  let currentSection = 'Início';
  const navLinks = $$('.main-nav a[data-nav]');
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) currentSection = en.target.dataset.section || currentSection; });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-section]').forEach((s) => secObs.observe(s));

  /* ======================= Abas do site (views) e abas das ferramentas ======================= */
  const views = $$('.view');
  const toolTabs = $$('.tool-tabs [role=tab]');
  const toolsHead = $('.tools-head');
  function activateView(view) {
    const changed = view.hidden;
    views.forEach((v) => (v.hidden = v !== view));
    navLinks.forEach((a) => {
      const on = a.dataset.nav === view.dataset.view;
      a.classList.toggle('active', on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    if (changed) observeReveal(view);
    return changed;
  }
  function moveInk() {
    const sel = toolTabs.find((t) => t.getAttribute('aria-selected') === 'true');
    const ink = $('.tab-ink');
    if (!sel || !ink || !sel.offsetWidth) return;
    ink.style.width = `${sel.offsetWidth}px`;
    ink.style.transform = `translateX(${sel.offsetLeft - 5}px)`;
  }
  function activateTab(panel) {
    toolTabs.forEach((t) => {
      const on = t.getAttribute('aria-controls') === panel.id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    moveInk();
    observeReveal(panel);
  }
  /** Leva o visitante a qualquer id do site, abrindo a aba (e a sub-aba) que o contém. */
  function goTo(id, { push = true } = {}) {
    const el = id && document.getElementById(id);
    const view = el && (el.classList.contains('view') ? el : el.closest('.view'));
    if (!view) return false;
    const viewChanged = activateView(view);
    const panel = el.closest('.tool-panel');
    if (panel) activateTab(panel);
    moveInk();
    if (push && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    setMenu(false);
    const smooth = reduced || viewChanged ? 'auto' : 'smooth';
    if (el === view.firstElementChild || (panel && viewChanged)) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else if (panel) {
      const wrap = $('.tool-tabs-wrap');
      const limit = toolsHead.offsetTop + toolsHead.offsetHeight - wrap.offsetHeight - 62;
      if (scrollY > limit) window.scrollTo({ top: limit, behavior: smooth });
    } else {
      el.scrollIntoView({ behavior: smooth });
    }
    document.dispatchEvent(new CustomEvent('cn:view'));
    return true;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    if (goTo(a.getAttribute('href').slice(1))) {
      e.preventDefault();
      if (a.dataset.svc) selectService(a.dataset.svc);
    }
  });
  toolTabs.forEach((t, i) => {
    t.addEventListener('click', () => goTo(t.getAttribute('aria-controls')));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = toolTabs[(i + d + toolTabs.length) % toolTabs.length];
      next.focus();
      next.click();
    });
  });
  window.addEventListener('popstate', () => goTo(location.hash.slice(1) || 'inicio', { push: false }));
  window.addEventListener('resize', moveInk);

  /* ======================= Reveal ======================= */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  function observeReveal(root = document) {
    $$('.reveal:not(.in)', root).forEach((el) => revealObs.observe(el));
  }

  /* ======================= Fotos reais (carregam se existirem) ======================= */
  function loadPhotos(root = document) {
    $$('.photo-frame[data-photo]', root).forEach((f) => {
      const img = new Image();
      img.alt = f.dataset.alt || '';
      img.decoding = 'async';
      img.onload = () => { f.classList.add('has-photo'); f.prepend(img); };
      img.src = f.dataset.photo;
    });
  }

  /* ======================= Cursor: parallax e brilho ======================= */
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    const hv = $('[data-parallax]');
    if (hv) {
      const layers = $$('[data-depth]', hv);
      hv.closest('.hero').addEventListener('mousemove', (e) => {
        const x = e.clientX / innerWidth - 0.5;
        const y = e.clientY / innerHeight - 0.5;
        layers.forEach((l) => { const d = Number(l.dataset.depth); l.style.transform = `translate(${x * d * 22}px, ${y * d * 18}px)`; });
      });
    }
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest && e.target.closest('.sol-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }

  /* ======================= WhatsApp contextual ======================= */
  function whatsappMessage({ servico, secao, texto } = {}) {
    const m = CFG.mensagensWhatsApp || {};
    if (texto) return texto;
    if (servico) return (m.servico || '').replace('{servico}', servico);
    if (secao && secao !== 'Início') return (m.secao || '').replace('{secao}', secao);
    return m.padrao || 'Olá! Conheci a Capital Nutri pelo site.';
  }
  function openWhatsApp(opts = {}) {
    const msg = whatsappMessage(opts);
    const num = String(EMP.whatsapp || '').replace(/\D/g, '');
    if (!num) {
      toast('O WhatsApp comercial ainda não foi configurado. Use o formulário de contato para falar com a equipe.');
      console.info('[Capital Nutri] Configure empresa.whatsapp em js/config.js. Mensagem que seria enviada:\n' + msg);
      return false;
    }
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    return true;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-whatsapp]');
    if (!b) return;
    e.preventDefault();
    const origin = b.dataset.origin === 'fab' ? currentSection : b.dataset.origin;
    openWhatsApp({ servico: b.dataset.service ? svcById[b.dataset.service]?.titulo : '', secao: origin });
    setFab(false);
  });

  /* ======================= Botão flutuante ======================= */
  const fabBtn = $('#fab-btn');
  const fabMenu = $('#fab-menu');
  function setFab(open) {
    fabMenu.hidden = !open;
    fabBtn.setAttribute('aria-expanded', String(open));
    fabBtn.innerHTML = open ? `${icon('close')}<span class="fab-label">Fechar</span>` : `${icon('chat')}<span class="fab-label">Fale com um de nossos atendentes</span>`;
    if (open) fabMenu.querySelector('button, a').focus();
  }
  fabBtn.addEventListener('click', () => setFab(fabMenu.hidden));
  fabMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setFab(false); });
  document.addEventListener('click', (e) => { if (!fabMenu.hidden && !e.target.closest('#fab')) setFab(false); });

  /* ======================= Contexto do lead ======================= */
  const leadCtx = { origem: 'Site', servicoInicial: '', diagnostico: '', simulacao: '', needs: [] };
  function renderLeadContext() {
    const box = $('#lead-context');
    const parts = [];
    if (leadCtx.servicoInicial) parts.push(`<strong>Solução de interesse</strong>${esc(leadCtx.servicoInicial)}`);
    if (leadCtx.diagnostico) parts.push(`<strong>Seu diagnóstico</strong>${esc(leadCtx.diagnostico)}`);
    if (leadCtx.simulacao) parts.push(`<strong>Sua simulação</strong>${esc(leadCtx.simulacao)}`);
    box.hidden = !parts.length;
    box.innerHTML = parts.length ? `${parts.map((p) => `<p>${p}</p>`).join('')}<small>Essas informações serão enviadas junto com sua solicitação.</small>` : '';
  }
  function openTriage({ servico, needs = [], origem, diagnostico, simulacao } = {}) {
    if (origem) leadCtx.origem = origem;
    if (servico) leadCtx.servicoInicial = servico;
    if (diagnostico) leadCtx.diagnostico = diagnostico;
    if (simulacao) leadCtx.simulacao = simulacao;
    needs.forEach((n) => { const cb = $(`#needs input[value="${n}"]`); if (cb) cb.checked = true; });
    renderLeadContext();
    goTo('contato');
    setTimeout(() => { const f = $('#triage .t-step:not([hidden]) input, #triage .t-step:not([hidden]) select'); f && f.focus({ preventScroll: true }); }, 300);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#contato"][data-origin]');
    if (a) leadCtx.origem = a.dataset.origin;
  });

  /* ======================= 2. Dores ======================= */
  const PAINS = [
    { t: 'Produção maior que a demanda', i: 'box', c: 'Sobras diárias viram descarte ou promoção forçada, e o custo da matéria-prima, energia e mão de obra vai junto.', h: 'Planejamento da produção baseado no histórico de vendas e acompanhamento de indicadores.' },
    { t: 'Desperdício de matéria-prima', i: 'trash', c: 'Perdas pequenas e diárias somam valores relevantes no mês, quase sempre sem que ninguém perceba.', h: 'Registro e análise das perdas para atacar as causas: armazenamento, preparo, porcionamento e validade.' },
    { t: 'Falta de organização e padronização', i: 'clipboard', c: 'O mesmo produto sai diferente a cada dia, gerando retrabalho, reclamações e custo imprevisível.', h: 'Procedimentos claros, fichas técnicas e treinamento para que a equipe trabalhe sempre do mesmo jeito.' },
    { t: 'Estoque descontrolado', i: 'box', c: 'Compras em excesso, produtos vencendo e falta do que é essencial na hora errada.', h: 'Rotinas de controle de estoque, organização por validade e compras alinhadas à produção.' },
    { t: 'Dificuldades com exigências sanitárias', i: 'shield', c: 'Insegurança na fiscalização, risco de autuações e, principalmente, risco à saúde do consumidor.', h: 'Implantação de boas práticas, documentação aplicável e preparação da equipe para a rotina.' },
    { t: 'Produtos sem fichas técnicas', i: 'tag', c: 'Sem ficha, não há custo real nem padrão. O preço de venda vira um palpite.', h: 'Elaboração de fichas técnicas com ingredientes, rendimento, modo de preparo e base para custo.' },
    { t: 'Falta de informações para decidir', i: 'chart', c: 'Decisões tomadas pela intuição: o que produzir, o que cortar, onde investir.', h: 'Indicadores simples e ferramentas de controle para enxergar o negócio com clareza.' },
    { t: 'Dependência excessiva do proprietário', i: 'user', c: 'Tudo para quando o dono não está. Crescer fica difícil e o desgaste é constante.', h: 'Processos documentados e equipe treinada para operar com autonomia e responsabilidade.' },
  ];
  const painGrid = $('#pain-grid');
  painGrid.innerHTML = PAINS.map((p, i) => `
    <button type="button" class="pain-card reveal" style="--d:${(i % 4) * 0.07}s" aria-expanded="false">
      <span class="pain-check" aria-hidden="true">${icon('check')}</span>
      <span class="pain-inner">
        <span class="pain-face pain-front">
          <span class="p-ico">${icon(p.i)}</span>
          <h3>${p.t}</h3>
          <span class="tap">${icon('plus')} Toque para ver o impacto</span>
        </span>
        <span class="pain-face pain-back">
          <b>Consequência</b><p>${p.c}</p>
          <b class="g">Como a Capital Nutri ajuda</b><p>${p.h}</p>
        </span>
      </span>
    </button>`).join('');
  painGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.pain-card');
    if (!card) return;
    const open = !card.classList.contains('open');
    // Moedas "escapando" do cartão: o dinheiro que o problema leva embora.
    if (open) burstFrom(card, { kinds: ['coin', 'coin', 'bill'], count: 7, fall: true, spread: 180, rise: 180, duration: 1300 });
    card.classList.toggle('open', open);
    card.classList.add('seen');
    card.setAttribute('aria-expanded', String(open));
    $('#pain-count').textContent = $$('.pain-card.seen').length;
  });

  /* ======================= 3. Soluções ======================= */
  const solList = $('#sol-list');
  const solPanel = $('#sol-panel');
  solList.innerHTML = SERVICES.map((s, i) => `
    <button type="button" class="sol-tab" role="tab" id="soltab-${s.id}" aria-controls="sol-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-svc-tab="${s.id}">
      <span class="s-ico">${icon(s.icone)}</span><span>${s.titulo}</span>
    </button>`).join('');
  function selectService(id, focusTab) {
    const s = svcById[id] || SERVICES[0];
    $$('.sol-tab', solList).forEach((t) => {
      const on = t.dataset.svcTab === s.id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus({ preventScroll: true });
    });
    scrollSolTab();
    solPanel.setAttribute('aria-labelledby', `soltab-${s.id}`);
    solPanel.classList.remove('sol-anim');
    solPanel.innerHTML = `
      <div class="sol-ico">${icon(s.icone)}</div>
      ${s.badge ? `<span class="sol-badge">${s.badge}</span>` : ''}
      <h3>${s.titulo}</h3>
      <p class="sol-text">${s.texto}</p>
      <ul class="sol-tags">${s.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      <p class="kicker" style="margin-bottom:.6em">O que muda na prática</p>
      <ul class="sol-gains">${s.ganhos.map((g) => `<li>${icon('check')}${g}</li>`).join('')}</ul>
      <div class="sol-actions">
        <button type="button" class="btn btn-primary" data-solution="${s.id}">Quero essa solução ${icon('arrow')}</button>
        <button type="button" class="btn btn-ghost" data-whatsapp data-service="${s.id}">${icon('chat')} Tirar dúvidas no WhatsApp</button>
      </div>`;
    void solPanel.offsetWidth;
    solPanel.classList.add('sol-anim');
  }
  // No celular, a lista vira uma faixa horizontal: mantém a aba ativa visível.
  function scrollSolTab() {
    const sel = $('.sol-tab[aria-selected="true"]', solList);
    if (sel && solList.scrollWidth > solList.clientWidth) solList.scrollTo({ left: sel.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' });
  }
  document.addEventListener('cn:view', scrollSolTab);
  solList.addEventListener('click', (e) => {
    const t = e.target.closest('[data-svc-tab]');
    if (!t) return;
    selectService(t.dataset.svcTab);
    burstFrom($('.sol-ico', solPanel), { kinds: ['check', 'shield', 'chart'], count: 6, spread: 160, rise: 140, duration: 1000 });
  });
  solList.addEventListener('keydown', (e) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const i = SERVICES.findIndex((s) => s.id === document.activeElement.dataset.svcTab);
    selectService(SERVICES[(i + d + SERVICES.length) % SERVICES.length].id, true);
  });
  solPanel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-solution]');
    if (!b) return;
    const s = svcById[b.dataset.solution];
    openTriage({ servico: s.titulo, needs: s.needs, origem: `Soluções: ${s.titulo}` });
  });
  selectService(SERVICES[0].id);
  $('#footer-services').innerHTML = SERVICES.map((s) => `<a href="#solucoes" data-svc="${s.id}">${s.titulo}</a>`).join('');

  /* ======================= 4. Diagnóstico ======================= */
  const D = CFG.diagnostico;
  const diag = { i: -1, answers: {} };
  const diagEl = $('#diag-app');
  const scored = D.perguntas.filter((q) => q.area);

  function renderDiag() {
    if (diag.i < 0) {
      diagEl.innerHTML = `
        <div class="diag-start slide-in">
          <div class="big-ico">${icon('search')}</div>
          <h3>${D.perguntas.length} perguntas rápidas</h3>
          <p>Ao final, você vê na hora um panorama da sua operação, com pontos de atenção e orientações iniciais.</p>
          <button type="button" class="btn btn-primary btn-lg" data-diag="start">Começar diagnóstico ${icon('arrow')}</button>
        </div>`;
      return;
    }
    if (diag.i >= D.perguntas.length) return renderDiagResult();
    const q = D.perguntas[diag.i];
    const pct = (diag.i / D.perguntas.length) * 100;
    const sel = diag.answers[q.id];
    diagEl.innerHTML = `
      <div class="q-top"><span>Pergunta ${diag.i + 1} de ${D.perguntas.length}</span><span>${Math.round(pct)}%</span></div>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="Progresso do diagnóstico"><span style="width:${pct}%"></span></div>
      <div class="slide-in">
        <h3 class="q-title" id="q-title" tabindex="-1">${q.titulo}</h3>
        <div class="options ${q.opcoes.length > 4 ? 'two' : ''}" role="radiogroup" aria-labelledby="q-title">
          ${q.opcoes.map((o, k) => `<button type="button" role="radio" aria-checked="${sel === k}" class="opt ${sel === k ? 'selected' : ''}" data-opt="${k}"><span class="radio"></span>${o.texto}</button>`).join('')}
        </div>
      </div>
      <div class="q-nav"><button type="button" class="link-btn" data-diag="back" ${diag.i === 0 ? 'disabled' : ''}>← Voltar</button></div>`;
  }

  function computeDiag() {
    const max = scored.length * 3;
    let total = 0;
    const areas = {};
    scored.forEach((q) => {
      const k = diag.answers[q.id];
      const pts = k === undefined ? 0 : q.opcoes[k].pontos;
      total += pts;
      areas[q.area] = Math.round((pts / 3) * 100);
    });
    const score = Math.round((total / max) * 100);
    const band = D.faixas.find((f) => score >= f.min);
    const focoQ = D.perguntas.find((q) => q.tipo === 'foco');
    const foco = focoQ && diag.answers[focoQ.id] !== undefined ? focoQ.opcoes[diag.answers[focoQ.id]].foco : null;
    const segQ = D.perguntas.find((q) => q.tipo === 'perfil');
    const segmento = segQ && diag.answers[segQ.id] !== undefined ? segQ.opcoes[diag.answers[segQ.id]].texto : '';
    // Prioridade: menores notas primeiro; a área de foco declarada sobe na lista.
    const ranked = Object.entries(areas).sort((a, b) => (a[0] === foco ? -1 : 0) - (b[0] === foco ? -1 : 0) || a[1] - b[1]);
    const attention = ranked.filter(([, v]) => v < 100).slice(0, 3);
    const svcIds = [];
    if (foco === 'abertura') svcIds.push('abertura');
    attention.forEach(([a]) => { const s = D.areas[a].servico; if (!svcIds.includes(s)) svcIds.push(s); });
    if (areas.sanitario < 100 && !svcIds.includes('bpf')) svcIds.push('bpf');
    if (!svcIds.length) svcIds.push('gestao');
    return { score, band, areas, attention, svcIds: svcIds.slice(0, 4), segmento, foco };
  }

  function renderDiagResult() {
    const r = computeDiag();
    const color = { green: 'var(--green-500)', amber: 'var(--amber)', red: 'var(--red)' }[r.band.cor];
    const C = 2 * Math.PI * 64;
    diagEl.innerHTML = `
      <div class="slide-in">
        <div class="result-head">
          <div class="gauge" role="img" aria-label="Índice geral ${r.score} de 100">
            <svg viewBox="0 0 150 150"><circle class="g-bg" cx="75" cy="75" r="64"/><circle class="g-fg" cx="75" cy="75" r="64" stroke="${color}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
            <div class="gauge-val"><div><strong data-count="${r.score}">0</strong><small>de 100</small></div></div>
          </div>
          <div style="flex:1;min-width:220px">
            <span class="level ${r.band.cor}">${r.band.rotulo}</span>
            <h3 id="diag-result-title" tabindex="-1">Seu índice de saúde operacional${r.segmento ? ` · ${esc(r.segmento)}` : ''}</h3>
            <p style="margin:0">${r.band.texto}</p>
          </div>
        </div>
        <div class="area-bars">
          ${Object.entries(r.areas).map(([a, v]) => {
            const c = v >= 75 ? 'var(--green-500)' : v >= 45 ? 'var(--amber)' : 'var(--red)';
            return `<div class="area-bar"><span>${D.areas[a].nome}</span><span class="track"><span class="fill" data-w="${v}" style="background:${c}"></span></span><span class="val">${v}%</span></div>`;
          }).join('')}
        </div>
        ${r.attention.length ? `
        <div class="result-block">
          <h4>Principais pontos de atenção e orientações iniciais</h4>
          <ul class="tips">${r.attention.map(([a]) => `<li><strong>${D.areas[a].nome}:</strong> ${D.areas[a].dica}</li>`).join('')}</ul>
        </div>` : ''}
        <div class="result-block">
          <h4>Soluções Capital Nutri relacionadas às suas respostas</h4>
          <div class="rec-services">${r.svcIds.map((id) => `<a href="#solucoes" data-svc="${id}">${svcById[id].titulo}</a>`).join('')}</div>
        </div>
        <p class="disclaimer">Esta é uma análise preliminar automatizada, baseada apenas nas suas respostas. Ela não substitui uma avaliação técnica presencial ou documental.</p>
        <div class="result-actions">
          <button type="button" class="btn btn-primary" data-diag="lead">Quero receber uma avaliação personalizada ${icon('arrow')}</button>
          <button type="button" class="btn btn-ghost" data-diag="wa">${icon('chat')} Enviar resumo pelo WhatsApp</button>
          <button type="button" class="link-btn" data-diag="restart">${icon('refresh')} Refazer</button>
        </div>
      </div>`;
    diag.result = r;
    // setTimeout (e não rAF) garante que o resultado apareça mesmo com a aba em segundo plano.
    setTimeout(() => {
      $('.g-fg', diagEl).style.strokeDashoffset = C * (1 - r.score / 100);
      $$('.fill', diagEl).forEach((f) => (f.style.width = `${f.dataset.w}%`));
      countUp($('[data-count]', diagEl));
      $('#diag-result-title').focus({ preventScroll: true });
      // Escudos e checks proporcionais ao índice; alerta quando a prioridade é alta.
      const kinds = r.score >= 45 ? ['check', 'shield', 'chart'] : ['warn', 'check', 'shield'];
      burstFrom($('.gauge', diagEl), { kinds, count: 6 + Math.round(r.score / 8), spread: 320, rise: 240 });
    }, 40);
  }
  function diagSummary(r) {
    const att = r.attention.map(([a]) => D.areas[a].nome).join(', ');
    return `Índice ${r.score}/100 (${r.band.rotulo})${r.segmento ? ` · ${r.segmento}` : ''}${att ? ` · Atenção: ${att}` : ''}`;
  }
  diagEl.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const q = D.perguntas[diag.i];
      diag.answers[q.id] = Number(opt.dataset.opt);
      $$('.opt', diagEl).forEach((o) => { o.classList.toggle('selected', o === opt); o.setAttribute('aria-checked', String(o === opt)); });
      $('.progress span', diagEl).style.width = `${((diag.i + 1) / D.perguntas.length) * 100}%`;
      setTimeout(() => { diag.i++; renderDiag(); const t = $('#q-title'); t && t.focus({ preventScroll: true }); }, reduced ? 0 : 380);
      return;
    }
    const act = e.target.closest('[data-diag]');
    if (!act) return;
    const a = act.dataset.diag;
    if (a === 'start') { diag.i = 0; renderDiag(); $('#q-title').focus({ preventScroll: true }); }
    if (a === 'back') { diag.i = Math.max(0, diag.i - 1); renderDiag(); }
    if (a === 'restart') { diag.i = 0; diag.answers = {}; renderDiag(); }
    if (a === 'lead') {
      const r = diag.result;
      const needs = [...new Set(r.svcIds.flatMap((id) => svcById[id].needs))];
      openTriage({ origem: 'Diagnóstico', diagnostico: diagSummary(r), needs });
      const seg = $('#triage [name=segmento]');
      if (r.segmento && !seg.value) seg.value = r.segmento;
    }
    if (a === 'wa') {
      openWhatsApp({ texto: `Olá! Fiz o diagnóstico no site da Capital Nutri. ${diagSummary(diag.result)}. Gostaria de uma avaliação personalizada.` });
    }
  });
  renderDiag();

  function countUp(el, dur = 1200) {
    if (!el) return;
    const target = Number(el.dataset.count);
    if (reduced) { el.textContent = target.toLocaleString('pt-BR'); return; }
    const t0 = performance.now();
    const step = () => {
      const p = Math.max(0, Math.min(1, (performance.now() - t0) / dur));
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => (el.textContent = target.toLocaleString('pt-BR')), dur + 100); // valor final garantido
  }

  /* ======================= 5. Simulador ======================= */
  const sim = {
    form: $('#sim-form'), fat: $('#sim-fat'), pct: $('#sim-pct'), valor: $('#sim-valor'), red: $('#sim-red'),
  };
  function fillRange(r) { r.style.setProperty('--fill', `${((r.value - r.min) / (r.max - r.min)) * 100}%`); }
  function fmtMoneyInput(inp) {
    const n = parseNum(inp.value);
    inp.value = n ? n.toLocaleString('pt-BR') : '';
  }
  function simData() {
    const modo = $('input[name=modo]:checked', sim.form).value;
    const fat = parseNum(sim.fat.value);
    const pct = Number(sim.pct.value);
    const mensal = modo === 'valor' ? parseNum(sim.valor.value) : fat * (pct / 100);
    const red = Number(sim.red.value);
    const anual = mensal * 12;
    return { modo, fat, pct, mensal, anual, red, ganho: anual * (red / 100) };
  }
  function renderSim() {
    const d = simData();
    $('.mode-percentual', sim.form).hidden = d.modo !== 'percentual';
    $('.mode-valor', sim.form).hidden = d.modo !== 'valor';
    $('#sim-pct-out').textContent = `${d.pct.toLocaleString('pt-BR')}%`;
    $('#sim-red-out').textContent = `${d.red}%`;
    [sim.pct, sim.red].forEach(fillRange);
    $('#sim-mensal').textContent = brl(d.mensal);
    $('#sim-anual').textContent = brl(d.anual);
    $('#sim-ganho').textContent = brl(d.ganho);
    $('#sim-formula').innerHTML = d.modo === 'percentual'
      ? `Perdas mensais = faturamento (${brl(d.fat)}) × ${d.pct.toLocaleString('pt-BR')}% = <b>${brl(d.mensal)}</b>. Projeção anual = perdas mensais × 12. Cenário simulado = projeção anual × (1 − ${d.red}%). Observação: percentuais sobre faturamento usam preço de venda; o custo real das perdas tende a ser menor. Para mais precisão, informe o valor das perdas diretamente.`
      : `Perdas mensais informadas = <b>${brl(d.mensal)}</b>. Projeção anual = perdas mensais × 12. Cenário simulado = projeção anual × (1 − ${d.red}%).`;
    renderSimChart(d);
  }
  function renderSimChart(d) {
    const scen = [
      { l: 'Situação atual', v: d.anual, c: '#D9473A' },
      { l: 'Redução de 10%', v: d.anual * 0.9, c: '#1E63E0' },
      { l: 'Redução de 25%', v: d.anual * 0.75, c: '#1450C2' },
      { l: `Sua simulação (−${d.red}%)`, v: d.anual * (1 - d.red / 100), c: '#3FA02A' },
    ];
    const W = 560, H = 230, top = 28, bottom = 40, bw = 88, gap = (W - bw * scen.length) / (scen.length + 1);
    const max = Math.max(d.anual, 1);
    const bars = scen.map((s, i) => {
      const h = Math.max(2, ((H - top - bottom) * s.v) / max);
      const x = gap + i * (bw + gap);
      const y = H - bottom - h;
      return `<g><rect class="bar" tabindex="0" x="${x}" y="${y}" width="${bw}" height="${h}" rx="10" fill="${s.c}" data-tip="${esc(s.l)}: ${brl(s.v)} por ano (${brl(s.v / 12)}/mês)"><title>${esc(s.l)}: ${brl(s.v)}</title></rect>
        <text x="${x + bw / 2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="#0E1A33">${brlShort(s.v)}</text>
        <text x="${x + bw / 2}" y="${H - bottom + 20}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#6B7590">${esc(s.l)}</text></g>`;
    }).join('');
    $('#sim-chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><line x1="0" x2="${W}" y1="${H - bottom}" y2="${H - bottom}" stroke="#E3E8F1"/>${bars}</svg><p class="sim-tip" id="sim-tip">Perdas projetadas em 12 meses por cenário. Passe o cursor ou toque nas barras.</p>`;
  }
  $('#sim-chart').addEventListener('pointerover', (e) => { const b = e.target.closest('.bar'); if (b) $('#sim-tip').textContent = b.dataset.tip; });
  $('#sim-chart').addEventListener('focusin', (e) => { const b = e.target.closest('.bar'); if (b) $('#sim-tip').textContent = b.dataset.tip; });
  sim.form.addEventListener('input', (e) => { if (e.target === sim.fat || e.target === sim.valor) fmtMoneyInput(e.target); renderSim(); });
  sim.form.addEventListener('submit', (e) => e.preventDefault());
  // Dinheiro "voando de volta" proporcional à redução simulada (ao soltar o controle).
  let lastRed = Number(sim.red.value);
  sim.red.addEventListener('change', () => {
    const red = Number(sim.red.value);
    const ganho = $('#sim-ganho');
    ganho.classList.remove('coin-pop'); void ganho.offsetWidth; ganho.classList.add('coin-pop');
    if (red > lastRed) burstFrom(ganho, { kinds: ['bill', 'coin', 'bill'], count: 4 + Math.round(red / 6), spread: 340, rise: 300 });
    else if (red < lastRed) burstFrom(ganho, { kinds: ['coin', 'bill'], count: 5, fall: true, spread: 200 });
    lastRed = red;
  });
  $('#sim-cta').addEventListener('click', () => {
    const d = simData();
    burstFrom($('#sim-cta'), { kinds: ['bill', 'coin'], count: 14, spread: 360, rise: 320 });
    const base = d.modo === 'percentual' ? `faturamento ${brl(d.fat)}/mês e perdas estimadas de ${d.pct.toLocaleString('pt-BR')}%` : 'valor de perdas informado';
    openTriage({
      origem: 'Simulador de desperdício',
      needs: ['Redução de perdas', 'Gestão da produção'],
      simulacao: `Perdas estimadas de ${brl(d.mensal)}/mês (${brl(d.anual)}/ano), com ${base}. Cenário simulado: redução de ${d.red}%.`,
    });
  });
  renderSim();

  /* ======================= 6. Jogo ======================= */
  const GAME_TIME = 60;
  const CHALLENGES = [
    { tag: 'Desafio 1 · Produção', titulo: 'A previsão de vendas caiu.',
      situ: 'Hoje é dia de chuva e o histórico mostra vendas de cerca de 120 pães franceses nesse tipo de dia. A programação está para 200 unidades. O que você faz?',
      opcoes: [
        { t: 'Ajusto a produção ao histórico de vendas e programo fornadas extras só se a demanda aumentar.', d: { e: 20, p: 25, s: 0 }, tipo: 'good',
          fb: 'Decisão de gestor! Produzir com base em dados reduz sobras sem deixar faltar produto. Fornadas escalonadas mantêm o pão fresco o dia todo.' },
        { t: 'Produzo as 200 unidades e faço promoção no fim do dia para escoar.', d: { e: -5, p: -10, s: 0 }, tipo: 'mid',
          fb: 'Ajuda a reduzir o descarte, mas você gastou insumos, energia e mão de obra para vender com margem menor. Planejar antes costuma ser mais eficiente.' },
        { t: 'Produzo tudo e guardo o que sobrar para vender amanhã como pão do dia.', d: { e: -10, p: -15, s: -25 }, tipo: 'bad',
          fb: 'Arriscado. Vender sobras como produto do dia compromete a qualidade, a transparência com o cliente e pode envolver riscos sanitários. O problema real é a produção acima da demanda.' },
      ] },
    { tag: 'Desafio 2 · Controle de estoque', titulo: 'Matéria-prima perto do vencimento.',
      situ: 'No estoque refrigerado há creme de leite que vence em 2 dias, em embalagens fechadas e armazenadas corretamente. Como você age?',
      opcoes: [
        { t: 'Verifico as condições do produto e priorizo o uso em preparações planejadas dentro da validade, aplicando "primeiro que vence, primeiro que sai".', d: { e: 15, p: 25, s: 15 }, tipo: 'good',
          fb: 'Excelente! Organizar o estoque por validade e planejar o uso evita perdas com segurança. E vale revisar as compras para não repetir o excesso.' },
        { t: 'Deixo no estoque e decido depois, conforme a demanda.', d: { e: -10, p: -20, s: -5 }, tipo: 'mid',
          fb: 'Sem um plano, a chance de o produto vencer é grande, virando perda. Controle de estoque exige decisão antecipada.' },
        { t: 'Se vencer, uso mesmo assim, desde que a aparência e o cheiro estejam bons.', d: { e: 0, p: 5, s: -35 }, tipo: 'bad',
          fb: 'Não faça isso. Produtos com prazo de validade vencido não devem ser utilizados: aparência e cheiro não garantem segurança. Esse tipo de decisão expõe clientes e o negócio a riscos sérios.' },
      ] },
    { tag: 'Desafio 3 · Segurança dos alimentos', titulo: 'Falha em um procedimento.',
      situ: 'Um colaborador percebe que a temperatura da câmara de refrigeração está acima da faixa definida no procedimento, e o registro da manhã não foi feito. O que fazer?',
      opcoes: [
        { t: 'Registro a ocorrência, avalio os produtos armazenados conforme o procedimento, aciono o responsável e providencio a correção do equipamento.', d: { e: 10, p: 10, s: 30 }, tipo: 'good',
          fb: 'Perfeito. Registrar, avaliar os produtos, corrigir a causa e orientar a equipe é o que garante segurança e aprendizado. Monitorar é tão importante quanto agir.' },
        { t: 'Ajusto o termostato e sigo a rotina, sem registrar para não gerar burocracia.', d: { e: 5, p: 0, s: -15 }, tipo: 'mid',
          fb: 'Corrigir o equipamento é necessário, mas sem registro e sem avaliar os produtos armazenados, um risco pode passar despercebido e o problema se repetir.' },
        { t: 'Não faço nada: os produtos parecem estar bons.', d: { e: 0, p: -5, s: -35 }, tipo: 'bad',
          fb: 'Arriscado. Alterações de temperatura podem favorecer a multiplicação de microrganismos sem mudar a aparência dos alimentos. Ignorar a falha coloca consumidores e o negócio em risco.' },
      ] },
  ];
  const game = { el: $('#game'), stage: 'intro', idx: 0, m: { e: 50, p: 50, s: 50 }, time: GAME_TIME, timer: null, timedOut: false };
  const METERS = [['e', 'Eficiência'], ['p', 'Controle de perdas'], ['s', 'Segurança dos alimentos']];
  const BAKERY_SVG = `<svg viewBox="0 0 300 300" role="img" aria-label="Ilustração de uma pequena padaria">
    <circle cx="150" cy="150" r="140" fill="rgba(255,255,255,.06)"/>
    <rect x="55" y="110" width="190" height="140" rx="10" fill="#fff"/>
    <path d="M45 110 L60 70 H240 L255 110 Z" fill="#5BBE2E"/>
    <path d="M60 110 a16 14 0 0 0 32 0 a16 14 0 0 0 32 0 a16 14 0 0 0 32 0 a16 14 0 0 0 32 0 a16 14 0 0 0 32 0 a16 14 0 0 0 32 0" fill="#3FA02A"/>
    <rect x="80" y="45" width="140" height="28" rx="8" fill="#0B3A8C"/>
    <text x="150" y="65" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" font-family="Plus Jakarta Sans, sans-serif">PADARIA</text>
    <rect x="72" y="140" width="80" height="60" rx="6" fill="#DCE7FB"/>
    <rect x="168" y="150" width="60" height="100" rx="6" fill="#1E63E0"/>
    <circle cx="216" cy="200" r="4" fill="#fff"/>
    <ellipse cx="94" cy="186" rx="16" ry="9" fill="#E8A317"/><ellipse cx="126" cy="186" rx="16" ry="9" fill="#D99410"/><ellipse cx="110" cy="172" rx="16" ry="9" fill="#F0B43A"/>
    <rect x="72" y="208" width="80" height="8" rx="3" fill="#E3E8F1"/>
    <g class="steam" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"><path d="M200 38c-6-8 6-12 0-20"/><path d="M215 40c-6-8 6-12 0-20"/></g>
  </svg>`;

  function metersHTML(deltas) {
    return `<div class="meters">${METERS.map(([k, l]) => {
      const v = game.m[k];
      const d = deltas && deltas[k] ? `<span class="delta" style="color:${deltas[k] > 0 ? '#A6E38A' : '#FFB4A9'}">${deltas[k] > 0 ? '+' : ''}${deltas[k]}</span>` : '';
      return `<div class="meter">${l}<b>${v}${d}</b><div class="mbar" role="meter" aria-label="${l}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}"><i class="${v < 40 ? 'lowv' : ''}" style="width:${v}%"></i></div></div>`;
    }).join('')}</div>`;
  }
  function timerHTML() {
    const C = 2 * Math.PI * 18;
    return `<div class="timer ${game.time <= 10 ? 'low' : ''}" aria-label="Tempo restante">
      <span class="ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,.15)"/><circle cx="22" cy="22" r="18" stroke="${game.time <= 10 ? '#FF8A7A' : '#7FD45A'}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - game.time / GAME_TIME)}"/></svg></span>
      <span id="game-time">${game.time}s</span></div>`;
  }
  function renderGame(deltas) {
    const g = game;
    if (g.stage === 'intro') {
      g.el.innerHTML = `
        <div class="game-intro">
          <div>
            <p class="kicker">Experiência gamificada</p>
            <h2>Você é o gerente!</h2>
            <p class="sub">60 segundos para salvar sua produção.</p>
            <ul class="game-rules">
              <li>${icon('store')}<span>Você assume uma pequena padaria em um dia de operação.</span></li>
              <li>${icon('clipboard')}<span>3 decisões: produção, estoque e segurança dos alimentos.</span></li>
              <li>${icon('chart')}<span>Cada escolha afeta eficiência, controle de perdas e segurança.</span></li>
            </ul>
            <button type="button" class="btn btn-white btn-lg" data-game="start">${icon('game')} Começar o jogo</button>
            <p style="margin-top:14px;font-size:.85rem;color:#9FB4E6">Sem cadastro. Os indicadores do jogo são demonstrativos.</p>
          </div>
          <div class="bakery">${BAKERY_SVG}</div>
        </div>`;
      return;
    }
    if (g.stage === 'result') return renderGameResult();
    const c = CHALLENGES[g.idx];
    const answered = g.stage === 'feedback';
    g.el.innerHTML = `
      <div class="game-hud">${timerHTML()}${metersHTML(deltas)}</div>
      <div class="challenge slide-in">
        <span class="challenge-tag">${c.tag} · ${g.idx + 1}/3</span>
        <h3 id="ch-title" tabindex="-1">${c.titulo}</h3>
        <p class="situ">${c.situ}</p>
        <div class="choices">${c.opcoes.map((o, k) => `<button type="button" class="choice ${g.picked === k ? 'picked' : ''}" data-choice="${k}" ${answered ? 'disabled' : ''}><span class="letter">${'ABC'[k]}</span>${o.t}</button>`).join('')}</div>
        ${answered ? (() => { const o = c.opcoes[g.picked]; const ic = { good: 'check', mid: 'alert', bad: 'close' }[o.tipo]; const tt = { good: 'Boa decisão', mid: 'Dá para melhorar', bad: 'Atenção' }[o.tipo];
          return `<div class="feedback ${o.tipo}" role="status"><span class="f-ico">${icon(ic)}</span><div><strong>${tt}</strong><p>${o.fb}</p><button type="button" class="btn btn-primary btn-sm" data-game="next">${g.idx < 2 ? 'Próximo desafio' : 'Ver resultado'} ${icon('arrow')}</button></div></div>`; })() : ''}
      </div>`;
  }
  function tick() {
    game.time--;
    const t = $('#game-time');
    if (t) {
      const hud = $('.game-hud', game.el);
      hud.firstElementChild.outerHTML = timerHTML();
    }
    if (game.time <= 0) { stopTimer(); game.timedOut = true; game.stage = 'result'; renderGame(); }
  }
  function startTimer() { stopTimer(); game.timer = setInterval(tick, 1000); }
  function stopTimer() { clearInterval(game.timer); game.timer = null; }
  function renderGameResult() {
    const avg = Math.round((game.m.e + game.m.p + game.m.s) / 3);
    const good = avg >= 70 && game.m.s >= 60 && !game.timedOut;
    const title = good ? 'Você toma boas decisões!' : 'Sua operação tem oportunidades de melhoria.';
    const lesson = good
      ? 'Mas administrar uma produção exige informação, processos e acompanhamento todos os dias, não só em 60 segundos.'
      : 'Imagine contar com uma equipe especializada ajudando você a tomar essas decisões com dados e processos claros.';
    game.lastResult = { avg, title };
    game.el.innerHTML = `
      ${good && !reduced ? `<div class="confetti" aria-hidden="true">${Array.from({ length: 40 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${['#7FD45A', '#fff', '#1E63E0', '#E8A317'][i % 4]};animation-delay:${Math.random() * 0.8}s"></i>`).join('')}</div>` : ''}
      <div class="game-result slide-in">
        <div class="medal">${icon(good ? 'check' : 'chart')}</div>
        ${game.timedOut ? '<p style="color:#FFB4A9;font-weight:700">O tempo acabou! Na produção real, decisões também têm prazo.</p>' : ''}
        <h2 id="game-result-title" tabindex="-1">${title}</h2>
        <p class="lesson">${lesson}</p>
        ${metersHTML()}
        <p class="disclaimer">Indicadores demonstrativos do jogo. Não representam resultados financeiros nem garantias.</p>
        <p style="color:#fff;font-weight:700;font-size:1.1rem">Quer melhorar os resultados da sua empresa na vida real? Converse com a Capital Nutri.</p>
        <div class="game-actions">
          <a href="#contato" class="btn btn-white" data-origin="Jogo Você é o gerente">Conversar com a Capital Nutri ${icon('arrow')}</a>
          <button type="button" class="btn btn-ghost" data-game="share">${icon('share')} Compartilhar</button>
          <button type="button" class="btn btn-ghost" data-game="restart">${icon('refresh')} Jogar de novo</button>
        </div>
      </div>`;
    $('#game-result-title').focus({ preventScroll: true });
    if (good) burstFrom($('.medal', game.el), { kinds: ['bill', 'coin', 'check', 'bill'], count: 22, spread: 520, rise: 340, duration: 1800 });
  }
  // Pausa o cronômetro se o visitante sair da aba do jogo; retoma ao voltar.
  document.addEventListener('cn:view', () => {
    const visible = !$('#jogo').hidden && !$('#jogo').closest('.view').hidden;
    if (game.stage === 'play') { if (!visible) stopTimer(); else if (!game.timer) startTimer(); }
    updateTimeline();
  });
  game.el.addEventListener('click', async (e) => {
    const ch = e.target.closest('[data-choice]');
    if (ch && game.stage === 'play') {
      const k = Number(ch.dataset.choice);
      const o = CHALLENGES[game.idx].opcoes[k];
      game.picked = k;
      Object.entries(o.d).forEach(([m, v]) => (game.m[m] = Math.max(0, Math.min(100, game.m[m] + v))));
      game.stage = 'feedback';
      stopTimer(); // pausa enquanto o jogador lê o feedback
      const r = ch.getBoundingClientRect();
      renderGame(o.d);
      $('.feedback .btn', game.el).focus({ preventScroll: true });
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (o.tipo === 'good') burst(cx, cy, { kinds: ['coin', 'check', 'bread', 'coin'], count: 14, spread: 300, rise: 260 });
      else if (o.tipo === 'mid') burst(cx, cy, { kinds: ['coin'], count: 6, fall: true, spread: 180 });
      else { burst(cx, cy, { kinds: ['warn', 'coin', 'bill'], count: 10, fall: true, spread: 260 }); game.el.classList.remove('shake'); void game.el.offsetWidth; game.el.classList.add('shake'); }
      return;
    }
    const act = e.target.closest('[data-game]');
    if (!act) return;
    const a = act.dataset.game;
    if (a === 'start' || a === 'restart') {
      Object.assign(game, { stage: 'play', idx: 0, m: { e: 50, p: 50, s: 50 }, time: GAME_TIME, timedOut: false, picked: undefined });
      renderGame(); startTimer();
      $('#ch-title').focus({ preventScroll: true });
      if (a === 'restart') game.el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
    if (a === 'next') {
      if (game.idx < CHALLENGES.length - 1) { game.idx++; game.picked = undefined; game.stage = 'play'; renderGame(); startTimer(); $('#ch-title').focus({ preventScroll: true }); }
      else { game.stage = 'result'; renderGame(); }
    }
    if (a === 'share') {
      const text = `Joguei "Você é o gerente!" da Capital Nutri: ${game.lastResult.title} Teste suas decisões de gestão:`;
      const url = location.origin + location.pathname + '#jogo';
      try {
        if (navigator.share) await navigator.share({ title: 'Você é o gerente! · Capital Nutri', text, url });
        else { await navigator.clipboard.writeText(`${text} ${url}`); toast('Texto copiado! Cole onde quiser compartilhar.'); }
      } catch (err) { if (err && err.name !== 'AbortError') toast('Não foi possível compartilhar agora.'); }
    }
  });
  renderGame();

  /* ======================= 7. Linha do tempo ======================= */
  const tl = $('#timeline');
  const tlItems = $$('.tl-item', tl);
  function updateTimeline() {
    const r = tl.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.1)));
    tl.style.setProperty('--tl', p.toFixed(3));
    tlItems.forEach((it, i) => it.classList.toggle('on', p >= i / tlItems.length + 0.02 || (reduced && r.top < innerHeight)));
  }

  /* ======================= 8. Credibilidade (somente dados configurados) ======================= */
  const cred = CFG.credibilidade || {};
  if (cred.indicadores && cred.indicadores.length) {
    const box = $('#cred-stats');
    box.hidden = false;
    box.innerHTML = cred.indicadores.map((s) => `<div class="stat reveal"><strong><span data-count="${Number(s.valor)}">0</span>${esc(s.sufixo || '')}</strong>${esc(s.rotulo)}</div>`).join('');
    const so = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { $$('[data-count]', box).forEach((c) => countUp(c)); so.disconnect(); } }), { threshold: 0.4 });
    so.observe(box);
  }
  const deps = (cred.depoimentos || []).filter((d) => d.autorizado);
  if (deps.length) {
    const box = $('#cred-testimonials');
    box.hidden = false;
    box.innerHTML = deps.map((d) => `<figure class="testimonial reveal"><blockquote>“${esc(d.texto)}”</blockquote><figcaption><strong>${esc(d.nome)}</strong>${d.cargo ? ` · ${esc(d.cargo)}` : ''}${d.empresa ? `, ${esc(d.empresa)}` : ''}</figcaption></figure>`).join('');
  }
  if (cred.equipe && cred.equipe.length) {
    $('#team').innerHTML = cred.equipe.map((p) => `<figure class="team-card reveal"><div class="photo-frame" data-photo="${esc(p.foto)}" data-alt="${esc(p.alt || 'Retrato profissional')}"><div class="photo-fallback">${icon('user')}</div></div><figcaption><strong>${esc(p.nome || 'Equipe Capital Nutri')}</strong><span>${esc(p.cargo || 'Soluções em alimentação')}</span></figcaption></figure>`).join('');
  }
  if (cred.fotos && cred.fotos.length) {
    $('#photo-mosaic').innerHTML = cred.fotos.slice(0, 3).map((f) => `<div class="photo-frame" data-photo="${esc(f.src)}" data-alt="${esc(f.alt)}"><div class="photo-fallback">${icon('camera')}</div></div>`).join('');
  }

  /* ======================= 9. Triagem ======================= */
  const form = $('#triage');
  const STEP_NAMES = ['Sobre a empresa', 'O que sua empresa precisa?', 'Momento atual', 'Contato'];
  let step = 1;
  const formOpenedAt = Date.now();
  $('#needs').innerHTML = NEEDS.map((n) => `<label><input type="checkbox" name="necessidades" value="${n}"><span>${n}</span></label>`).join('');
  const ufSel = $('[name=uf]', form);
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').forEach((u) => ufSel.add(new Option(u, u)));
  const phone = $('[name=whatsapp]', form);
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
  });

  function setFieldError(name, msg) {
    const el = form.elements[name];
    const field = el && el.closest && el.closest('.field');
    if (field) {
      field.classList.toggle('invalid', Boolean(msg));
      let err = $('.err', field);
      if (msg && !err) { err = document.createElement('span'); err.className = 'err'; field.appendChild(err); }
      if (err) err.textContent = msg || '';
      if (el.setAttribute) msg ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid');
    }
    const slot = $(`[data-error="${name}"]`, form);
    if (slot) slot.textContent = msg || '';
  }
  function collect() {
    const f = form.elements;
    return {
      empresa: f.empresa.value.trim(), segmento: f.segmento.value, cidade: f.cidade.value.trim(), uf: f.uf.value,
      unidades: f.unidades.value, colaboradores: f.colaboradores.value,
      necessidades: $$('#needs input:checked').map((c) => c.value),
      momento: (form.querySelector('[name=momento]:checked') || {}).value || '',
      desafio: f.desafio.value.trim(),
      nome: f.nome.value.trim(), whatsapp: f.whatsapp.value.replace(/\D/g, ''), email: f.email.value.trim(), periodo: f.periodo.value,
      consentimento: f.consentimento.checked,
    };
  }
  const STEP_FIELDS = { 1: ['empresa', 'segmento', 'cidade', 'uf'], 2: ['necessidades'], 3: ['momento'], 4: ['nome', 'whatsapp', 'email', 'consentimento'] };
  function validateStep(n) {
    const d = collect();
    const errs = {};
    if (n === 1) {
      if (d.empresa.length < 2) errs.empresa = 'Informe o nome da empresa.';
      if (!d.segmento) errs.segmento = 'Selecione o segmento.';
      if (d.cidade.length < 2) errs.cidade = 'Informe a cidade.';
      if (!d.uf) errs.uf = 'Selecione.';
    }
    if (n === 2 && !d.necessidades.length) errs.necessidades = 'Selecione ao menos uma opção.';
    if (n === 3 && !d.momento) errs.momento = 'Selecione o momento atual da empresa.';
    if (n === 4) {
      if (d.nome.length < 2) errs.nome = 'Informe seu nome.';
      if (!/^\d{10,11}$/.test(d.whatsapp)) errs.whatsapp = 'Informe o WhatsApp com DDD.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errs.email = 'Informe um e-mail válido.';
      if (!d.consentimento) errs.consentimento = 'Precisamos da sua autorização para entrar em contato.';
    }
    STEP_FIELDS[n].forEach((k) => setFieldError(k, errs[k]));
    const first = Object.keys(errs)[0];
    if (first) {
      const el = form.elements[first];
      const target = el && (el.focus ? el : el[0]);
      if (target) target.focus();
    }
    return !first;
  }
  function showStep(n) {
    step = n;
    $$('.t-step', form).forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    $('#triage-bar').style.width = `${(n / 4) * 100}%`;
    $('#triage-label').textContent = `Etapa ${n} de 4 · ${STEP_NAMES[n - 1]}`;
    $('#t-back').hidden = n === 1;
    $('#t-next').hidden = n === 4;
    $('#t-submit').hidden = n !== 4;
    $('#triage-error').hidden = true;
  }
  $('#t-next').addEventListener('click', () => { if (validateStep(step)) { showStep(step + 1); const f = $('.t-step:not([hidden]) input, .t-step:not([hidden]) select', form); f && f.focus(); } });
  $('#t-back').addEventListener('click', () => showStep(step - 1));
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && step < 4) { e.preventDefault(); $('#t-next').click(); }
  });
  form.addEventListener('change', (e) => { if (e.target.name) setFieldError(e.target.name, ''); });

  function leadWhatsAppText(d, id) {
    return [
      'Olá! Acabei de enviar uma solicitação pelo site da Capital Nutri.',
      id ? `Protocolo: ${id}` : '',
      `Empresa: ${d.empresa} (${d.segmento}) · ${d.cidade}/${d.uf}`,
      `Necessidades: ${d.necessidades.join(', ')}`,
      `Momento: ${{ imediata: 'busco solução imediata', meses: 'pretendo contratar nos próximos meses', pesquisando: 'pesquisando possibilidades', avaliacao: 'desejo uma avaliação inicial' }[d.momento]}`,
    ].filter(Boolean).join('\n');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    const d = collect();
    const btn = $('#t-submit');
    const errBox = $('#triage-error');
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    errBox.hidden = true;
    let res, body;
    try {
      res = await fetch(CFG.api.leads, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...d, origem: leadCtx.origem, contexto: { servicoInicial: leadCtx.servicoInicial, diagnostico: leadCtx.diagnostico, simulacao: leadCtx.simulacao }, website: form.elements.website.value, elapsedMs: Date.now() - formOpenedAt }),
      });
      body = await res.json().catch(() => ({}));
    } catch (err) { res = null; }
    btn.disabled = false;
    btn.textContent = 'Enviar solicitação';

    if (res && res.ok && body.ok && body.id) {
      form.innerHTML = `
        <div class="success" role="status">
          <div class="s-ico">${icon('check')}</div>
          <h3 tabindex="-1" id="ok-title">Solicitação recebida!</h3>
          <p>Registramos seu pedido. Guarde o número do seu atendimento:</p>
          <span class="protocol">${esc(body.id)}</span>
          <p>Nossa equipe vai analisar as informações e retornar pelo período que você indicou.</p>
          <button type="button" class="btn btn-primary" id="ok-wa">${icon('chat')} Conversar agora pelo WhatsApp</button>
        </div>`;
      $('#ok-wa').addEventListener('click', () => openWhatsApp({ texto: leadWhatsAppText(d, body.id) }));
      $('#ok-title').focus();
      burstFrom($('.s-ico', form), { kinds: ['check', 'shield', 'check'], count: 16, spread: 420, rise: 280 });
      return;
    }
    if (res && res.status === 422 && body.fields) {
      const firstStep = [1, 2, 3, 4].find((n) => STEP_FIELDS[n].some((k) => body.fields[k]));
      showStep(firstStep || 4);
      Object.entries(body.fields).forEach(([k, v]) => setFieldError(k, v));
    }
    errBox.hidden = false;
    errBox.innerHTML = `<strong>${res ? esc(body.error || 'Não conseguimos registrar sua solicitação.') : 'Não foi possível conectar ao servidor.'}</strong><br>Seus dados <u>não</u> foram enviados. Tente novamente em instantes${EMP.whatsapp ? ' ou fale conosco diretamente pelo WhatsApp' : ''}.${EMP.whatsapp ? `<br><button type="button" class="btn btn-primary btn-sm" id="err-wa">${icon('chat')} Falar pelo WhatsApp</button>` : ''}`;
    const ew = $('#err-wa');
    ew && ew.addEventListener('click', () => openWhatsApp({ texto: leadWhatsAppText(d) }));
  });
  showStep(1);

  /* ======================= 11. Insights ======================= */
  const CAT_ICON = { 'Gestão e lucratividade': 'chart', 'Boas práticas e segurança dos alimentos': 'shield', 'Produção inteligente': 'box', 'Legislação e regularização': 'doc', 'Rotulagem e fichas técnicas': 'tag', 'Tecnologia para negócios alimentícios': 'cpu' };
  const CATS = Object.keys(CAT_ICON);
  window.CN_renderInsights = function (gridSel, catsSel, limit) {
    const grid = $(gridSel), cats = $(catsSel);
    fetch('/insights/articles.json').then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((all) => {
      const list = all.filter((a) => a.publicado !== false);
      let active = 'Todos';
      cats.innerHTML = ['Todos', ...CATS].map((c) => `<button type="button" role="tab" aria-selected="${c === active}">${c}</button>`).join('');
      const draw = () => {
        const items = list.filter((a) => active === 'Todos' || a.categoria === active).slice(0, limit || 99);
        grid.innerHTML = items.length ? items.map((a) => `
          <a class="insight-card" href="/insights/${esc(a.slug)}">
            <div class="insight-cover">${a.imagem ? `<img src="${esc(a.imagem)}" alt="" loading="lazy">` : icon(CAT_ICON[a.categoria] || 'book')}</div>
            <div class="insight-body">
              <div class="insight-meta"><span>${esc(a.categoria)}</span><span>${icon('clock')} ${esc(a.leitura)}</span></div>
              <h3>${esc(a.titulo)}</h3><p>${esc(a.resumo)}</p>
            </div>
          </a>`).join('') : '<p class="empty">Em breve, novos conteúdos nesta categoria.</p>';
      };
      cats.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; active = b.textContent; $$('button', cats).forEach((x) => x.setAttribute('aria-selected', String(x === b))); draw(); });
      draw();
    }).catch(() => { grid.innerHTML = '<p class="empty">Não foi possível carregar os artigos agora.</p>'; });
  };
  if ($('#insight-grid')) window.CN_renderInsights('#insight-grid', '#insight-cats', 6);

  /* ======================= 12. FAQ ======================= */
  const FAQ = [
    ['A Capital Nutri atende pequenas empresas?', 'Sim. Atendemos negócios de diferentes portes, de pequenas padarias e lanchonetes a operações maiores. O trabalho é dimensionado de acordo com a realidade e as prioridades de cada empresa.'],
    ['Quais tipos de estabelecimentos são atendidos?', 'Padarias e confeitarias, restaurantes e operações de food service, lanchonetes, hamburguerias, pastelarias, supermercados, indústrias alimentícias e outros empreendimentos que produzem, manipulam ou comercializam alimentos.'],
    ['É possível contratar apenas um serviço?', 'Sim. Você pode contratar uma solução específica, como fichas técnicas ou boas práticas, ou combinar frentes de trabalho conforme a necessidade da operação.'],
    ['Como funciona a consultoria?', 'Começamos entendendo o seu negócio e avaliando as necessidades. Em seguida, estruturamos um plano de trabalho com ações e prioridades conforme o serviço contratado, e acompanhamos a evolução.'],
    ['Vocês ajudam na preparação para fiscalização sanitária?', 'Sim. Apoiamos a organização de documentos, procedimentos e registros aplicáveis ao estabelecimento e a adequação das práticas da equipe, para que a operação esteja preparada no dia a dia, e não apenas no dia da visita.'],
    ['Vocês elaboram fichas técnicas e rotulagem?', 'Sim. Elaboramos fichas técnicas, padronização de produtos, informações nutricionais e rotulagem conforme os requisitos aplicáveis a cada produto.'],
    ['A Capital Nutri atende presencialmente e remotamente?', 'As modalidades de atendimento e a região atendida dependem do serviço e da localização da empresa. Essas condições são confirmadas no primeiro contato com nossa equipe.'],
    ['Como solicitar um orçamento?', 'Preencha a solicitação de avaliação nesta página ou fale conosco pelos canais de atendimento. Com as informações do seu negócio, nossa equipe retorna com a proposta adequada.'],
  ];
  $('#faq-list').innerHTML = FAQ.map(([q, a], i) => `
    <div class="acc-item">
      <h3><button type="button" class="acc-btn" aria-expanded="false" aria-controls="faq-${i}" id="faq-b-${i}">${q}${icon('plus')}</button></h3>
      <div class="acc-panel" id="faq-${i}" role="region" aria-labelledby="faq-b-${i}"><div><p>${a}</p></div></div>
    </div>`).join('');
  $('#faq-list').addEventListener('click', (e) => {
    const b = e.target.closest('.acc-btn');
    if (!b) return;
    const item = b.closest('.acc-item');
    const open = !item.classList.contains('open');
    item.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
  });
  const faqLd = document.createElement('script');
  faqLd.type = 'application/ld+json';
  faqLd.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  document.head.appendChild(faqLd);

  /* ======================= Rodapé ======================= */
  const fc = $('#footer-contact');
  const items = [];
  if (EMP.whatsapp) items.push(`<a href="#" data-whatsapp data-origin="Rodapé">${icon('chat')} WhatsApp comercial</a>`);
  if (EMP.email) items.push(`<a href="mailto:${esc(EMP.email)}">${icon('mail')} ${esc(EMP.email)}</a>`);
  if (EMP.instagram) items.push(`<a href="${esc(EMP.instagram)}" target="_blank" rel="noopener">${icon('insta')} Instagram</a>`);
  if (EMP.endereco) items.push(`<span>${esc(EMP.endereco)}</span>`);
  if (!items.length && CFG.mostrarAvisosDeDemonstracao) items.push('<span class="pending">WhatsApp, e-mail e Instagram: a configurar</span>');
  fc.innerHTML = items.join('');
  // Canais diretos na página de contato (só os que estiverem configurados).
  const direct = [];
  if (EMP.whatsapp) direct.push(`<a href="#" data-whatsapp data-origin="Contato">${icon('chat')} WhatsApp</a>`);
  if (EMP.email) direct.push(`<a href="mailto:${esc(EMP.email)}">${icon('mail')} ${esc(EMP.email)}</a>`);
  if (direct.length) {
    const dc = $('#direct-contact');
    dc.innerHTML = `<strong>Prefere falar direto?</strong>${direct.join('')}`;
    dc.hidden = false;
  }
  $('#year').textContent = new Date().getFullYear();
  if (EMP.cnpj) $('#footer-legal').textContent = ` · CNPJ ${EMP.cnpj}`;
  if (EMP.razaoSocial) {
    const fr = $('#footer-razao');
    fr.textContent = `Razão social: ${EMP.razaoSocial}`;
    fr.hidden = false;
  }

  /* ======================= Partículas do topo (moedas, pães, escudos, gráficos) ======================= */
  if (!reduced) {
    const kinds = ['coin', 'bread', 'shield', 'chart', 'check', 'coin', 'bill'];
    const isMobile = innerWidth < 640;
    $('#hero-particles').innerHTML = Array.from({ length: isMobile ? 9 : 16 }, (_, i) => {
      const k = kinds[i % kinds.length];
      const s = FX_SIZE[k] * (0.6 + Math.random() * 0.6);
      return `<span style="left:${Math.random() * 100}%;width:${s}px;height:${s}px;--o:${(0.18 + Math.random() * 0.3).toFixed(2)};--r:${Math.round((Math.random() - 0.5) * 360)}deg;animation-duration:${14 + Math.random() * 14}s;animation-delay:${-Math.random() * 24}s">${FX_SVG[k]}</span>`;
    }).join('');
  }
  // Clique no fundo do topo: uma chuva rápida de moedas e checks.
  $('.hero').addEventListener('click', (e) => {
    if (e.target.closest('a, button, .float-card, .dash-card')) return;
    burst(e.clientX, e.clientY, { kinds: ['coin', 'check', 'bill'], count: 8, spread: 220, rise: 200, duration: 1100 });
  });

  /* ======================= Inicialização ======================= */
  loadPhotos();
  observeReveal();
  goTo(location.hash.slice(1) || 'inicio', { push: false });
  if (!location.hash) window.scrollTo(0, 0);
  setTimeout(moveInk, 300);
  onScroll();
})();
