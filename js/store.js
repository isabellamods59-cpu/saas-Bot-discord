/* ============================================================
   NexaBots — Store / Shop page
   ============================================================ */
(function (global) {
  'use strict';

  function init() {
    const user = Auth.currentUser();
    if (!user) return;
    const main = document.querySelector('.content');
    if (!main) return;

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Loja NexaBots</h1>
          <p class="subtitle">Bots premium prontos para entrar no seu servidor em minutos.</p>
        </div>
      </div>

      <div class="card glass mb-6" style="padding:20px;">
        <div class="toolbar" style="margin:0;">
          <div class="filters" data-cat-filters>
            <button class="pill active" data-cat="all">${Icons.svg('layers')} Todas</button>
            <button class="pill" data-cat="Música">${Icons.svg('music')} Música</button>
            <button class="pill" data-cat="Moderação">${Icons.svg('shield2')} Moderação</button>
            <button class="pill" data-cat="Economia">${Icons.svg('coin')} Economia</button>
            <button class="pill" data-cat="Tickets">${Icons.svg('tag')} Tickets</button>
            <button class="pill" data-cat="Níveis">${Icons.svg('trendingUp')} Níveis</button>
            <button class="pill" data-cat="Sorteios">${Icons.svg('gift')} Sorteios</button>
            <button class="pill" data-cat="Logs">${Icons.svg('activity')} Logs</button>
            <button class="pill" data-cat="Jogos">${Icons.svg('gamepad')} Jogos</button>
          </div>
          <div class="search-field">
            ${Icons.svg('search')}
            <input class="input" type="search" placeholder="Buscar bots..." data-store-search />
          </div>
        </div>
      </div>

      <div class="grid grid-cards" data-bots></div>
    `;

    let category = 'all';
    let q = '';

    function render() {
      const list = DB.bots.filter((b) => {
        const matchCat = category === 'all' || b.tag === category;
        const matchQ = !q || (b.name + ' ' + b.desc + ' ' + b.tag).toLowerCase().includes(q.toLowerCase());
        return matchCat && matchQ;
      });
      const wrap = main.querySelector('[data-bots]');
      if (list.length === 0) {
        wrap.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            ${Icons.svg('search')}
            <h3>Nenhum bot encontrado</h3>
            <p>Tente outro filtro ou termo de busca.</p>
          </div>
        `;
        Icons.hydrate(wrap);
        return;
      }
      wrap.innerHTML = list.map((b, idx) => `
        <div class="card bot-card animate-in" style="animation-delay:${idx * 30}ms" data-search-target>
          <div class="bot-thumb">${Icons.svg(b.icon)}</div>
          <div class="bot-name">${UI.escapeHtml(b.name)}</div>
          <div class="bot-meta">
            <span class="badge badge-purple no-dot">${UI.escapeHtml(b.tag)}</span>
            ${b.popularity ? `<span class="badge badge-pink no-dot">${Icons.svg('flame')} ${UI.escapeHtml(b.popularity)}</span>` : ''}
          </div>
          <div class="bot-desc">${UI.escapeHtml(b.desc)}</div>
          <div class="bot-foot">
            <div class="bot-price">${UI.formatBRL(b.price)} <small>/ mês</small></div>
            <button class="btn btn-primary btn-sm" data-buy="${b.id}">${Icons.svg('shoppingBag')} Comprar</button>
          </div>
        </div>
      `).join('');
      Icons.hydrate(wrap);
    }
    render();

    main.querySelectorAll('[data-cat-filters] .pill').forEach((p) => {
      p.addEventListener('click', () => {
        main.querySelectorAll('[data-cat-filters] .pill').forEach((x) => x.classList.remove('active'));
        p.classList.add('active');
        category = p.dataset.cat;
        render();
      });
    });
    main.querySelector('[data-store-search]').addEventListener('input', (e) => {
      q = e.target.value.trim();
      render();
    });
    main.addEventListener('click', (e) => {
      const buy = e.target.closest('[data-buy]');
      if (!buy) return;
      const bot = DB.bots.get(buy.dataset.buy);
      if (!bot) return;
      openBotCheckout(bot);
    });

    Icons.hydrate(main);
  }

  function openBotCheckout(bot) {
    const m = UI.openModal({
      title: 'Comprar ' + bot.name,
      body: `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="card" style="padding:18px;display:flex;gap:14px;align-items:center;">
            <div class="bot-thumb" style="width:80px;height:80px;flex-shrink:0;">${Icons.svg(bot.icon)}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:16px;">${UI.escapeHtml(bot.name)}</div>
              <div class="muted" style="font-size:13px;">${UI.escapeHtml(bot.desc)}</div>
              <div style="margin-top:6px;font-weight:800;font-size:18px;">${UI.formatBRL(bot.price)} <small style="font-size:12px;color:var(--text-3);font-weight:500;">/ mês</small></div>
            </div>
          </div>
          <div class="alert info">
            ${Icons.svg('info')}
            <div>
              <div class="alert-title">Pagamento manual via Discord</div>
              <div class="alert-body">Após confirmar, criaremos um pedido pendente. Abra um ticket no nosso Discord para finalizar o pagamento.</div>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" data-close>Cancelar</button>
        <button class="btn btn-primary" data-confirm>${Icons.svg('checkCircle')} Confirmar compra</button>
      `,
    });
    Icons.hydrate(m.root);
    m.root.querySelector('[data-confirm]').addEventListener('click', () => {
      const user = Auth.currentUser();
      const order = DB.orders.insert({
        userId: user.id,
        planId: bot.id,
        planName: bot.name,
        period: 'mês',
        price: bot.price,
        status: 'pendente',
        notes: 'Bot avulso da loja',
      });
      Activity.log({ userId: user.id, type: 'order', message: `Compra criada na loja: ${bot.name}.`, data: { orderId: order.id } });
      Notifications.push({ userId: user.id, title: 'Pedido criado', message: `Sua compra do bot ${bot.name} está pendente.`, type: 'info' });
      m.close();
      UI.toast.success('Compra registrada! Abra um ticket para finalizar.');
      setTimeout(() => window.location.assign('discord.html'), 600);
    });
  }

  global.Store = { init };
})(window);
