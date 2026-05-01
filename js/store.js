/* ============================================================
   NexaBots V2 — Marketplace (5 categorias)
   - Filtros por categoria, busca, ordenação
   - Compra real (cria registro em DB.purchases)
   ============================================================ */
(function (global) {
  'use strict';

  let allProducts = [];
  let currentCategory = 'todos';
  let currentSearch = '';
  let currentSort = 'relevance';
  let user = null;

  const Store = {
    async init(ctx) {
      if (!ctx) return;
      user = ctx.user;
      const { content } = ctx;
      currentCategory = (UI.qs('category') || 'todos').toLowerCase();
      const focusProduct = UI.qs('product');

      content.innerHTML = `
        <div class="page-head">
          <div>
            <h1 class="page-title">Marketplace NexaBots</h1>
            <p class="page-sub">Bots, cursos, jogos, Nitro e lojas prontas — tudo em um só lugar. Pagamento manual via Discord.</p>
          </div>
          <div class="page-actions">
            <a class="btn btn-ghost" href="discord.html">${Icons.svg('discord')} Suporte / Tickets</a>
          </div>
        </div>

        <div class="cat-strip" id="cat-strip"></div>

        <div class="toolbar mb-4">
          <div class="search-field">
            ${Icons.svg('search')}
            <input class="input" id="search" type="search" placeholder="Buscar por nome ou descrição..." />
          </div>
          <div class="filters">
            <select class="input" id="sort" style="min-width:180px">
              <option value="relevance">Mais relevantes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="newest">Mais recentes</option>
            </select>
          </div>
        </div>

        <div class="product-grid" id="product-grid">
          ${UI.skeleton(8, 'card')}
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
        console.error('[Marketplace] erro ao buscar produtos:', err);
        allProducts = [];
        UI.toast.error('Não foi possível carregar os produtos.');
      }
      renderCategoryStrip(content);
      render(content);

      if (focusProduct) {
        const found = allProducts.find((p) => p.id === focusProduct || p.slug === focusProduct);
        if (found) openProductModal(found);
      }
    },
  };

  function renderCategoryStrip(content) {
    const cats = ['todos', ...DB.CATEGORIES];
    const stripEl = content.querySelector('#cat-strip');
    const counts = {};
    DB.CATEGORIES.forEach((c) => { counts[c] = allProducts.filter((p) => p.category === c).length; });
    counts.todos = allProducts.length;

    stripEl.innerHTML = cats.map((c) => {
      const meta = c === 'todos'
        ? { label: 'Todos', emoji: '✨', color: 'rgba(124,58,237,0.35)' }
        : { ...UI.CATEGORY_META[c], color: UI.CATEGORY_META[c].color };
      const isActive = c === currentCategory;
      const colorRgba = (() => {
        const m = { bots: 'rgba(124,58,237,', cursos: 'rgba(34,211,238,', jogos: 'rgba(34,197,94,', nitro: 'rgba(251,191,36,', lojas: 'rgba(244,114,182,', todos: 'rgba(124,58,237,' }[c];
        return m;
      })();
      return `
        <button class="cat-card ${isActive ? 'active' : ''}" data-cat="${c}"
          style="--cat-color: ${colorRgba}0.4); --cat-shadow: ${colorRgba}0.5);">
          <span class="emoji">${meta.emoji || '🎯'}</span>
          <span class="ttl">${UI.escapeHtml(meta.label || c)}</span>
          <span class="sub">${counts[c] || 0} produtos</span>
        </button>
      `;
    }).join('');
    stripEl.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.cat;
        const url = new URL(location.href);
        if (currentCategory === 'todos') url.searchParams.delete('category');
        else url.searchParams.set('category', currentCategory);
        history.replaceState(null, '', url);
        renderCategoryStrip(content);
        render(content);
      });
    });
  }

  function applyFilters() {
    let list = [...allProducts].filter((p) => p.active !== false);
    if (currentCategory !== 'todos') {
      list = list.filter((p) => p.category === currentCategory);
    }
    if (currentSearch) {
      list = list.filter((p) =>
        (p.name + ' ' + (p.description || '') + ' ' + (p.short_description || ''))
          .toLowerCase().includes(currentSearch)
      );
    }
    if (currentSort === 'price-asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (currentSort === 'price-desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (currentSort === 'newest') list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
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
          <p>Tente outra categoria ou busca.</p>
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
    const features = Array.isArray(p.features) ? p.features.slice(0, 3) : [];
    const cat = UI.CATEGORY_META[p.category] || { label: p.category, emoji: '🎯' };
    return `
      <article class="product-card ${p.recommended ? 'recommended' : ''}" data-product-id="${UI.escapeHtml(p.id)}">
        <div class="thumb">
          ${p.image ? `<img src="${UI.escapeHtml(p.image)}" alt="${UI.escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover">` : Icons.svg(p.icon || 'bot')}
          ${p.badge ? `<span class="badge ${p.recommended ? 'badge-soft' : 'badge-info'}" style="position:absolute;top:12px;left:12px;">${UI.escapeHtml(p.badge)}</span>` : ''}
          <span class="badge badge-soft" style="position:absolute;top:12px;right:12px;">${cat.emoji} ${UI.escapeHtml(cat.label)}</span>
        </div>
        <div class="body">
          <div class="name">${UI.escapeHtml(p.name)}</div>
          <div class="desc">${UI.escapeHtml(p.short_description || p.description || '')}</div>
          ${features.length ? `<div class="feat">${features.map((f) => `<span class="tag">${UI.escapeHtml(f)}</span>`).join('')}</div>` : ''}
          <div class="footrow">
            <div class="price">${UI.formatBRL(p.price)}<small> ${p.period ? '/ ' + p.period : ''}</small></div>
            <button class="btn btn-primary btn-sm" data-buy>${Icons.svg('shoppingBag')} Comprar</button>
          </div>
        </div>
      </article>
    `;
  }

  function openProductModal(product) {
    const features = Array.isArray(product.features) ? product.features : [];
    const cat = UI.CATEGORY_META[product.category] || { label: product.category, emoji: '🎯' };
    UI.openModal({
      title: product.name,
      size: 'lg',
      body: `
        <div class="product-detail">
          <div class="thumb-large">
            ${product.image ? `<img src="${UI.escapeHtml(product.image)}" alt="${UI.escapeHtml(product.name)}">` : Icons.svg(product.icon || 'bot')}
          </div>
          <div>
            <div class="badge badge-soft" style="margin-bottom:8px;">${cat.emoji} ${UI.escapeHtml(cat.label)}</div>
            <p style="color:var(--text-2);">${UI.escapeHtml(product.description || product.short_description || '')}</p>
            ${features.length ? `<ul class="feat-list">${features.map((f) => `<li>${Icons.svg('check')} ${UI.escapeHtml(f)}</li>`).join('')}</ul>` : ''}
            <div class="price-block">
              <div class="price">${UI.formatBRL(product.price)}<small> ${product.period ? '/ ' + product.period : ''}</small></div>
              <p class="muted" style="font-size:12px;">Pagamento manual via ticket no Discord. A liberação é feita pelo time NexaBots.</p>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" data-close>Fechar</button>
        <button class="btn btn-primary" id="confirm-buy">${Icons.svg('shoppingBag')} Confirmar pedido</button>
      `,
    });
    Icons.hydrate(document.body);
    document.querySelector('#confirm-buy')?.addEventListener('click', () => createOrder(product));
  }

  // Listen on grid for "Comprar" button shortcut
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
    try {
      const purchase = await DB.purchases.create({
        userId: user.id,
        product,
        period: product.period,
      });
      await Activity.record({
        userId: user.id, type: 'purchase_created',
        message: `Pedido criado para ${product.name}.`,
        data: { purchase_id: purchase.id, product_id: product.id, price: product.price },
      });
      await Notifications.push({
        userId: user.id, type: 'success',
        title: 'Pedido criado',
        message: `Seu pedido para ${product.name} está pendente. Abra um ticket no Discord para liberar.`,
      });
      UI.toast.success(`Pedido para ${product.name} criado! Status: pendente.`);
      // close modal
      const overlay = document.querySelector('.modal-overlay');
      overlay?.click();
      setTimeout(() => location.assign('purchases.html'), 600);
    } catch (err) {
      console.error('[Marketplace] erro ao criar pedido:', err);
      UI.toast.error(err?.message || 'Não foi possível criar o pedido.');
      if (btn) { btn.disabled = false; btn.innerHTML = `${Icons.svg('shoppingBag')} Confirmar pedido`; Icons.hydrate(btn); }
    }
  }

  global.Store = Store;
})(window);
