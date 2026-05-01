/* ============================================================
   Nexa Serviços V2 — Minhas compras
   ============================================================ */
(function (global) {
  'use strict';

  let user = null;
  let purchases = [];
  let filterStatus = 'todos';
  let filterCategory = 'todos';
  let search = '';

  const Purchases = {
    async init(ctx) {
      if (!ctx) return;
      user = ctx.user;
      const { content } = ctx;

      content.innerHTML = `
        <div class="page-head">
          <div>
            <h1 class="page-title">Minhas compras</h1>
            <p class="page-sub">Acompanhe o status dos seus pedidos. Pagamento manual via tickets no Discord.</p>
          </div>
          <div class="page-actions">
            <a class="btn btn-primary" href="store.html">${Icons.svg('store')} Marketplace</a>
            <a class="btn btn-ghost" href="discord.html">${Icons.svg('discord')} Abrir ticket</a>
          </div>
        </div>

        <div class="toolbar mb-4">
          <div class="search-field">
            ${Icons.svg('search')}
            <input class="input" id="p-search" type="search" placeholder="Buscar produto..." />
          </div>
          <div class="filters">
            <select class="input" id="p-status">
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select class="input" id="p-cat">
              <option value="todos">Todas as categorias</option>
              ${DB.CATEGORIES.map((c) => `<option value="${c}">${UI.CATEGORY_META[c].label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="purchase-list">${UI.skeleton(4, 'row')}</div>
      `;
      Icons.hydrate(content);

      content.querySelector('#p-search').addEventListener('input', UI.debounce((e) => { search = e.target.value.trim().toLowerCase(); render(content); }, 200));
      content.querySelector('#p-status').addEventListener('change', (e) => { filterStatus = e.target.value; render(content); });
      content.querySelector('#p-cat').addEventListener('change', (e) => { filterCategory = e.target.value; render(content); });

      try {
        purchases = await DB.purchases.byUser(user.id);
      } catch (err) {
        console.error('[Purchases] erro:', err);
        purchases = [];
      }
      render(content);
    },
  };

  function render(content) {
    const list = purchases.filter((p) => {
      if (filterStatus !== 'todos' && p.status !== filterStatus) return false;
      if (filterCategory !== 'todos' && p.product_category !== filterCategory) return false;
      if (search && !(p.product_name || '').toLowerCase().includes(search)) return false;
      return true;
    });
    const root = content.querySelector('#purchase-list');
    if (!list.length) {
      root.innerHTML = `
        <div class="card empty-state" style="padding:48px;">
          ${Icons.svg('shoppingBag')}
          <h3 style="font-size:18px;">Sem compras por aqui</h3>
          <p>Quando você fizer um pedido, ele aparecerá aqui.</p>
          <a href="store.html" class="btn btn-primary" style="margin-top:12px;">Ver marketplace</a>
        </div>`;
      Icons.hydrate(root);
      return;
    }
    root.innerHTML = `
      <div class="card" style="padding:0;overflow:hidden;">
        <table class="table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((p) => `
              <tr data-search-target data-search-text="${UI.escapeHtml((p.product_name || '').toLowerCase())}" data-id="${UI.escapeHtml(p.id)}">
                <td><span class="mono">#${(p.id || '').slice(0, 8)}</span></td>
                <td><strong>${UI.escapeHtml(p.product_name)}</strong></td>
                <td>${UI.categoryBadge(p.product_category)}</td>
                <td>${UI.statusBadge(p.status)}</td>
                <td>${UI.formatBRL(p.price)}</td>
                <td><span class="muted">${UI.formatDate(p.created_at)}</span></td>
                <td>
                  <a class="btn btn-sm btn-ghost" href="discord.html">${Icons.svg('discord')} Ticket</a>
                  ${p.status === 'pendente' ? `<button class="btn btn-sm btn-danger" data-cancel>${Icons.svg('close')} Cancelar</button>` : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    Icons.hydrate(root);

    root.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const id = tr?.dataset.id;
        if (!id) return;
        const ok = await UI.confirm({ title: 'Cancelar pedido', message: 'Deseja realmente cancelar este pedido?', confirmText: 'Sim, cancelar', danger: true });
        if (!ok) return;
        try {
          await DB.purchases.setStatus(id, 'cancelado');
          await Activity.record({ userId: user.id, type: 'status_change', message: `Pedido ${id.slice(0,8)} cancelado.`, data: { purchase_id: id } });
          UI.toast.success('Pedido cancelado.');
          purchases = await DB.purchases.byUser(user.id);
          render(content);
        } catch (err) {
          console.error(err);
          UI.toast.error('Não foi possível cancelar.');
        }
      });
    });
  }

  global.Purchases = Purchases;
})(window);
