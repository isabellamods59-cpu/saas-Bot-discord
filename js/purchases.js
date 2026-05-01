/* ============================================================
   NexaBots — Purchases page
   ============================================================ */
(function (global) {
  'use strict';

  const STATUS = {
    pendente:  { label: 'Pendente',  cls: 'badge-pending'   },
    aprovado:  { label: 'Aprovado',  cls: 'badge-approved'  },
    entregue:  { label: 'Entregue',  cls: 'badge-delivered' },
    cancelado: { label: 'Cancelado', cls: 'badge-canceled'  },
  };

  function statusBadge(status) {
    const s = STATUS[status] || STATUS.pendente;
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  }

  function init() {
    const user = Auth.currentUser();
    if (!user) return;
    const main = document.querySelector('.content');
    if (!main) return;

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Minhas compras</h1>
          <p class="subtitle">Acompanhe o status de todos os seus pedidos.</p>
        </div>
        <a href="plans.html" class="btn btn-primary">${Icons.svg('plus')} Novo pedido</a>
      </div>

      <div class="grid grid-stats" data-summary></div>

      <div class="card mt-6">
        <div class="toolbar">
          <div class="filters" data-filters>
            <button class="pill active" data-status="all">Todos</button>
            <button class="pill" data-status="pendente">${Icons.svg('clock')} Pendentes</button>
            <button class="pill" data-status="aprovado">Aprovados</button>
            <button class="pill" data-status="entregue">Entregues</button>
            <button class="pill" data-status="cancelado">Cancelados</button>
          </div>
          <div class="search-field">
            ${Icons.svg('search')}
            <input class="input" type="search" placeholder="Buscar por plano..." data-purchase-search />
          </div>
        </div>
        <div data-orders></div>
      </div>
    `;

    let filterStatus = 'all';
    let searchQ = '';

    function getOrders() {
      let list = DB.orders.filter((o) => o.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (filterStatus !== 'all') list = list.filter((o) => o.status === filterStatus);
      if (searchQ) {
        const q = searchQ.toLowerCase();
        list = list.filter((o) => (o.planName || '').toLowerCase().includes(q));
      }
      return list;
    }

    function renderSummary() {
      const all = DB.orders.filter((o) => o.userId === user.id);
      const counts = {
        all: all.length,
        pendente: all.filter((o) => o.status === 'pendente').length,
        aprovado: all.filter((o) => o.status === 'aprovado').length,
        entregue: all.filter((o) => o.status === 'entregue').length,
      };
      const totalSpent = all.filter((o) => o.status !== 'cancelado').reduce((s, o) => s + (o.price || 0), 0);
      main.querySelector('[data-summary]').innerHTML = `
        <div class="card card-stat">
          <span class="stat-icon">${Icons.svg('purchases')}</span>
          <span class="stat-label">Total de pedidos</span>
          <span class="stat-value">${counts.all}</span>
        </div>
        <div class="card card-stat">
          <span class="stat-icon" style="background:rgba(234,179,8,0.12);color:#fde68a;border-color:rgba(234,179,8,0.3)">${Icons.svg('clock')}</span>
          <span class="stat-label">Pendentes</span>
          <span class="stat-value">${counts.pendente}</span>
        </div>
        <div class="card card-stat">
          <span class="stat-icon" style="background:rgba(34,197,94,0.12);color:#86efac;border-color:rgba(34,197,94,0.3)">${Icons.svg('checkCircle')}</span>
          <span class="stat-label">Entregues</span>
          <span class="stat-value">${counts.entregue}</span>
        </div>
        <div class="card card-stat">
          <span class="stat-icon">${Icons.svg('dollar')}</span>
          <span class="stat-label">Total investido</span>
          <span class="stat-value" style="font-size:22px;">${UI.formatBRL(totalSpent)}</span>
        </div>
      `;
      Icons.hydrate(main.querySelector('[data-summary]'));
    }

    function renderOrders() {
      const list = getOrders();
      const wrap = main.querySelector('[data-orders]');
      if (list.length === 0) {
        wrap.innerHTML = `
          <div class="empty-state">
            ${Icons.svg('shoppingBag')}
            <h3>Nenhum pedido encontrado</h3>
            <p>${filterStatus === 'all' ? 'Você ainda não fez pedidos. Que tal escolher um plano?' : 'Nenhum pedido com este filtro.'}</p>
            ${filterStatus === 'all' ? `<a class="btn btn-primary mt-4" href="plans.html">${Icons.svg('plans')} Ver planos</a>` : ''}
          </div>
        `;
        Icons.hydrate(wrap);
        return;
      }
      wrap.innerHTML = `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>Pedido</th><th>Plano</th><th>Período</th><th>Data</th><th>Valor</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              ${list.map((o) => `
                <tr>
                  <td><span class="code">#${o.id.slice(-6).toUpperCase()}</span></td>
                  <td><strong>${UI.escapeHtml(o.planName)}</strong></td>
                  <td>${o.period === 'ano' ? 'Anual' : 'Mensal'}</td>
                  <td>${UI.formatDate(o.createdAt, { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  <td><strong>${UI.formatBRL(o.price)}</strong></td>
                  <td>${statusBadge(o.status)}</td>
                  <td class="cell-actions">
                    <button class="btn btn-sm btn-ghost" data-detail="${o.id}">Detalhes</button>
                    ${o.status === 'pendente' ? `<button class="btn btn-sm btn-danger" data-cancel="${o.id}">Cancelar</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    function bind() {
      main.querySelector('[data-purchase-search]').addEventListener('input', (e) => {
        searchQ = e.target.value.trim();
        renderOrders();
      });
      main.querySelectorAll('[data-filters] .pill').forEach((p) => {
        p.addEventListener('click', () => {
          main.querySelectorAll('[data-filters] .pill').forEach((x) => x.classList.remove('active'));
          p.classList.add('active');
          filterStatus = p.dataset.status;
          renderOrders();
        });
      });
      main.addEventListener('click', (e) => {
        const detail = e.target.closest('[data-detail]');
        const cancel = e.target.closest('[data-cancel]');
        if (detail) openDetail(detail.dataset.detail);
        else if (cancel) doCancel(cancel.dataset.cancel);
      });
    }

    function openDetail(id) {
      const o = DB.orders.get(id);
      if (!o) return;
      const plan = DB.plans.get(o.planId);
      UI.openModal({
        title: 'Detalhes do pedido #' + o.id.slice(-6).toUpperCase(),
        body: `
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="flex justify-between items-center">
              <div>
                <div style="font-weight:700;font-size:16px;">${UI.escapeHtml(o.planName)}</div>
                <div class="muted" style="font-size:13px;">${plan ? UI.escapeHtml(plan.tagline) : ''}</div>
              </div>
              ${statusBadge(o.status)}
            </div>
            <hr class="divider" style="margin:0;" />
            <div class="grid grid-2" style="gap:12px;font-size:13.5px;">
              <div><span class="muted">Período:</span><br><strong>${o.period === 'ano' ? 'Anual' : 'Mensal'}</strong></div>
              <div><span class="muted">Valor:</span><br><strong>${UI.formatBRL(o.price)}</strong></div>
              <div><span class="muted">Criado em:</span><br><strong>${UI.formatDate(o.createdAt)}</strong></div>
              <div><span class="muted">Atualizado em:</span><br><strong>${o.updatedAt ? UI.formatDate(o.updatedAt) : '—'}</strong></div>
            </div>
            ${o.status === 'pendente' ? `
              <div class="alert warning">
                ${Icons.svg('warn')}
                <div>
                  <div class="alert-title">Aguardando pagamento</div>
                  <div class="alert-body">Abra um ticket no nosso Discord para finalizar o pagamento.</div>
                </div>
              </div>
              <a href="discord.html" class="btn btn-primary">${Icons.svg('discord')} Abrir ticket no Discord</a>
            ` : o.status === 'aprovado' ? `
              <div class="alert info">
                ${Icons.svg('info')}
                <div>
                  <div class="alert-title">Pagamento aprovado</div>
                  <div class="alert-body">Sua entrega está sendo preparada. Em breve seu bot estará no ar!</div>
                </div>
              </div>
            ` : o.status === 'entregue' ? `
              <div class="alert success">
                ${Icons.svg('checkCircle')}
                <div>
                  <div class="alert-title">Pedido entregue</div>
                  <div class="alert-body">Tudo pronto! Seu bot está ativo. Qualquer dúvida, abra um ticket no Discord.</div>
                </div>
              </div>
            ` : `
              <div class="alert danger">
                ${Icons.svg('error')}
                <div>
                  <div class="alert-title">Pedido cancelado</div>
                  <div class="alert-body">Você ou um administrador cancelou este pedido.</div>
                </div>
              </div>
            `}
          </div>
        `,
        footer: `<button class="btn btn-ghost" data-close>Fechar</button>`,
      });
    }

    function doCancel(id) {
      UI.confirm({ title: 'Cancelar pedido', message: 'Tem certeza que deseja cancelar este pedido pendente?', confirmText: 'Cancelar pedido', danger: true })
        .then((ok) => {
          if (!ok) return;
          DB.orders.update(id, { status: 'cancelado' });
          Activity.log({ userId: user.id, type: 'order', message: 'Pedido cancelado pelo usuário.', data: { orderId: id } });
          Notifications.push({ userId: user.id, title: 'Pedido cancelado', message: 'Seu pedido foi cancelado.', type: 'warning' });
          UI.toast.warn('Pedido cancelado.');
          renderSummary();
          renderOrders();
        });
    }

    renderSummary();
    renderOrders();
    bind();
    Icons.hydrate(main);
  }

  global.Purchases = { init, statusBadge, STATUS };
})(window);
