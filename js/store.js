/* ============================================================
   Nexa Serviços — Loja de bots (single category)
   ============================================================ */
(function (global) {
  'use strict';

  let allProducts = [];
  let currentSearch = '';
  let currentSort = 'relevance';
  let user = null;

  const Store = {
    async init(ctx) {
      if (!ctx) return;
      user = ctx.user;
      const { content } = ctx;
      const focusProduct = UI.qs('product');

      content.innerHTML = `
        <div class="store-hero">
          <div class="store-hero-text">
            <span class="eyebrow">${Icons.svg('bot')} Bots Discord premium</span>
            <h1 class="page-title">Bots prontos para o seu servidor.</h1>
            <p class="page-sub">Quatro bots premium, configurados, com painel web, suporte humano e atualizações vitalícias. Pagamento manual via ticket no Discord — liberação rápida e segura.</p>
            <div class="hero-cta">
              <a class="btn btn-primary" href="discord.html">${Icons.svg('discord')} Falar no Discord</a>
              <a class="btn btn-ghost" href="purchases.html">${Icons.svg('purchases')} Minhas compras</a>
            </div>
            <div class="hero-trust">
              <span class="dot dot-green"></span>
              <span>Suporte 24/7 no Discord · Pagamento manual com ticket · Garantia de reposição</span>
            </div>
          </div>
          <div class="store-hero-art" aria-hidden="true">${heroArtSVG()}</div>
        </div>

        <div class="toolbar mb-4">
          <div class="search-field">
            ${Icons.svg('search')}
            <input class="input" id="search" type="search" placeholder="Buscar por nome ou recurso..." />
          </div>
          <div class="filters">
            <select class="input" id="sort" style="min-width:180px">
              <option value="relevance">Mais relevantes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </div>
        </div>

        <div class="product-grid" id="product-grid">
          ${UI.skeleton(4, 'card')}
        </div>
      `;
      Icons.hydrate(content);

      content.querySelector('#search').addEventListener('input', UI.debounce((e) => {
        currentSearch = e.target.value.trim().toLowerCase();
        render(content);
      }, 200));
      content.querySelector('#sort').addEventListener('change', (e) => {
        currentSort = e.target.value;
        render(content);
      });

      try {
        allProducts = await DB.products.all();
      } catch (err) {
        console.error('[Loja] erro ao buscar produtos:', err);
        allProducts = [];
        UI.toast.error('Não foi possível carregar os produtos.');
      }
      render(content);

      if (focusProduct) {
        const found = allProducts.find((p) => p.id === focusProduct || p.slug === focusProduct);
        if (found) openProductModal(found);
      }
    },
  };

  function heroArtSVG() {
    return `
      <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <linearGradient id="hg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#7c3aed"/>
            <stop offset="100%" stop-color="#22d3ee"/>
          </linearGradient>
          <linearGradient id="hg2" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#a855f7" stop-opacity=".25"/>
            <stop offset="100%" stop-color="#22d3ee" stop-opacity=".05"/>
          </linearGradient>
        </defs>
        <rect x="40" y="20" width="240" height="180" rx="20" fill="url(#hg2)" stroke="rgba(255,255,255,0.08)"/>
        <circle cx="160" cy="90" r="42" fill="url(#hg)"/>
        <rect x="148" y="80" width="6" height="20" rx="2" fill="#0f0f12"/>
        <rect x="166" y="80" width="6" height="20" rx="2" fill="#0f0f12"/>
        <path d="M148 110 q12 8 24 0" stroke="#0f0f12" stroke-width="3" fill="none" stroke-linecap="round"/>
        <rect x="60" y="150" width="60" height="34" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
        <rect x="130" y="150" width="60" height="34" rx="10" fill="rgba(124,58,237,0.18)" stroke="rgba(124,58,237,0.4)"/>
        <rect x="200" y="150" width="60" height="34" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
        <circle cx="90"  cy="167" r="5" fill="#7c3aed"/>
        <circle cx="160" cy="167" r="5" fill="#22d3ee"/>
        <circle cx="230" cy="167" r="5" fill="#f472b6"/>
      </svg>`;
  }

  function applyFilters() {
    let list = [...allProducts].filter((p) => p.active !== false);
    if (currentSearch) {
      list = list.filter((p) =>
        (p.name + ' ' + (p.description || '') + ' ' + (p.short_description || '') + ' ' + (p.features || []).join(' '))
          .toLowerCase().includes(currentSearch)
      );
    }
    if (currentSort === 'price-asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (currentSort === 'price-desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    else list.sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));
    return list;
  }

  function render(content) {
    const grid = content.querySelector('#product-grid');
    const list = applyFilters();
    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;padding:48px;">
          ${Icons.svg('compass')}
          <h3 style="font-size:18px;">Nenhum produto encontrado</h3>
          <p>Tente outra busca.</p>
        </div>`;
      Icons.hydrate(grid);
      return;
    }
    grid.innerHTML = list.map(renderCard).join('');
    Icons.hydrate(grid);
    grid.querySelectorAll('[data-product-id]').forEach((card) => {
      card.addEventListener('click', () => {
        const p = list.find((x) => x.id === card.dataset.productId);
        if (p) openProductModal(p);
      });
    });
  }

  function renderCard(p) {
    const features = Array.isArray(p.features) ? p.features.slice(0, 4) : [];
    return `
      <article class="product-card ${p.recommended ? 'recommended' : ''}" data-product-id="${UI.escapeHtml(p.id)}">
        <div class="thumb">
          ${p.image ? `<img src="${UI.escapeHtml(p.image)}" alt="${UI.escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover">` : Icons.svg(p.icon || 'bot')}
          ${p.badge ? `<span class="badge ${p.recommended ? 'badge-soft' : 'badge-info'}" style="position:absolute;top:12px;left:12px;">${UI.escapeHtml(p.badge)}</span>` : ''}
        </div>
        <div class="body">
          <div class="name">${UI.escapeHtml(p.name)}</div>
          <div class="desc">${UI.escapeHtml(p.short_description || p.description || '')}</div>
          ${features.length ? `<ul class="card-feat">${features.map((f) => `<li>${Icons.svg('check')} <span>${UI.escapeHtml(f)}</span></li>`).join('')}</ul>` : ''}
          <div class="footrow">
            <div class="price">${UI.formatBRL(p.price)}<small> /vitalício</small></div>
            <button class="btn btn-primary btn-sm" data-buy>${Icons.svg('shoppingBag')} Comprar</button>
          </div>
        </div>
      </article>
    `;
  }

  function openProductModal(product) {
    const features = Array.isArray(product.features) ? product.features : [];
    UI.openModal({
      title: product.name,
      size: 'lg',
      body: `
        <div class="product-detail">
          <div class="thumb-large">
            ${product.image ? `<img src="${UI.escapeHtml(product.image)}" alt="${UI.escapeHtml(product.name)}">` : Icons.svg(product.icon || 'bot')}
          </div>
          <div>
            <p style="color:var(--text-2);">${UI.escapeHtml(product.description || product.short_description || '')}</p>
            ${features.length ? `<ul class="feat-list">${features.map((f) => `<li>${Icons.svg('check')} ${UI.escapeHtml(f)}</li>`).join('')}</ul>` : ''}
            <div class="price-block">
              <div class="price">${UI.formatBRL(product.price)}<small> /vitalício</small></div>
              <p class="muted" style="font-size:12px;">Pagamento manual via ticket no Discord. A liberação é feita pelo time Nexa Serviços em até 30 minutos após a confirmação.</p>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" data-close>Fechar</button>
        <button class="btn btn-primary" id="confirm-buy">${Icons.svg('shoppingBag')} Comprar e abrir ticket</button>
      `,
    });
    Icons.hydrate(document.body);
    document.querySelector('#confirm-buy')?.addEventListener('click', () => createOrder(product));
  }

  function discordInviteUrl() {
    return (window.NEXA_CONFIG && window.NEXA_CONFIG.DISCORD_INVITE) || 'https://discord.gg/FtWhZEyne';
  }

  document.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('[data-buy]');
    if (!buyBtn) return;
    e.stopPropagation();
    const card = buyBtn.closest('[data-product-id]');
    if (!card) return;
    const p = allProducts.find((x) => x.id === card.dataset.productId);
    if (p) openProductModal(p);
  });

  async function createOrder(product) {
    if (!user) { UI.toast.error('Faça login para comprar.'); return; }
    const btn = document.querySelector('#confirm-buy');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Criando pedido...'; }
    // Abre o Discord IMEDIATAMENTE (sync, dentro do click) pra escapar de popup blockers.
    const discordWin = window.open(discordInviteUrl(), '_blank', 'noopener');
    try {
      const purchase = await DB.purchases.create({
        userId: user.id,
        product,
        period: product.period || 'vitalício',
      });
      await Activity.record({
        userId: user.id, type: 'purchase_created',
        message: `Pedido criado para ${product.name}.`,
        data: { purchase_id: purchase.id, product_id: product.id, price: product.price },
      });
      try {
        await Notifications.push({
          userId: user.id, type: 'success',
          title: 'Pedido criado',
          message: `Seu pedido para ${product.name} está pendente. Abra um ticket no Discord pra liberar.`,
        });
      } catch (_) { /* notificação é opcional */ }
      UI.toast.success('Pedido criado! Abra um ticket no Discord pra liberar.');
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) overlay.click();
      if (!discordWin) {
        UI.toast.warn('Abra o Discord manualmente: ' + discordInviteUrl());
      }
      setTimeout(() => location.assign('purchases.html'), 700);
      return purchase;
    } catch (err) {
      console.error('[Loja] erro ao criar pedido:', err);
      try { discordWin && discordWin.close && discordWin.close(); } catch (_) {}
      if (btn) { btn.disabled = false; btn.innerHTML = `${Icons.svg('shoppingBag')} Comprar e abrir ticket`; }
      UI.toast.error(err?.message || 'Não foi possível criar o pedido.');
    }
  }

  global.Store = Store;
})(window);
