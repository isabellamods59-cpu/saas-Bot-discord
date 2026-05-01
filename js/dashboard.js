/* ============================================================
   Nexa Serviços V2 — Dashboard
   ============================================================ */
(function (global) {
  'use strict';

  const Dashboard = {
    async init(ctx) {
      if (!ctx) return;
      const { content, user } = ctx;
      if (!user) return;

      content.innerHTML = `
        <div class="welcome-banner">
          <h2>Olá, <span class="gradient-text">${UI.escapeHtml(user.display_name || user.username)}</span> 👋</h2>
          <p>Bem-vindo(a) ao painel do Nexa Serviços V2 — gerencie suas compras, ative serviços e descubra novidades no marketplace.</p>
          <div class="actions">
            <a href="store.html" class="btn btn-primary"><span data-icon="store"></span> Ir para o marketplace</a>
            <a href="discord.html" class="btn btn-ghost"><span data-icon="discord"></span> Suporte Discord</a>
          </div>
        </div>

        <div class="grid grid-4 mb-6" id="metrics">
          ${UI.skeleton(4, 'tile')}
        </div>

        <div class="grid grid-3" style="align-items:stretch;">
          <div class="card span-2">
            <div class="card-header">
              <h3>Vendas (últimos 7 dias)</h3>
              <span class="badge badge-soft" id="chart-total">—</span>
            </div>
            <div class="bar-chart" id="bar-chart"></div>
          </div>
          <div class="card">
            <div class="card-header">
              <h3>Atividade recente</h3>
              <a class="link" href="profile.html">Ver tudo</a>
            </div>
            <div class="activity-feed" id="activity-feed">
              ${UI.skeleton(4, 'row')}
            </div>
          </div>
        </div>

        <div class="grid grid-2 mt-6" style="align-items:stretch;">
          <div class="card">
            <div class="card-header">
              <h3>Suas compras recentes</h3>
              <a class="link" href="purchases.html">Ver todas</a>
            </div>
            <div id="recent-purchases">${UI.skeleton(3, 'row')}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <h3>Sugestões para você</h3>
              <a class="link" href="store.html">Marketplace</a>
            </div>
            <div id="suggestions" class="grid grid-2" style="gap:12px;">
              ${UI.skeleton(2, 'tile')}
            </div>
          </div>
        </div>
      `;
      Icons.hydrate(content);

      try {
        const [purchases, products, activity] = await Promise.all([
          DB.purchases.byUser(user.id),
          DB.products.all(),
          DB.activity.byUser(user.id, 8),
        ]);
        renderMetrics(content, purchases);
        renderChart(content, purchases);
        renderActivity(content, activity);
        renderRecentPurchases(content, purchases);
        renderSuggestions(content, products, purchases);
      } catch (err) {
        console.error('[Dashboard] erro:', err);
        UI.toast.error('Não foi possível carregar todos os dados.');
      }
    },
  };

  function renderMetrics(content, purchases) {
    const total = purchases.length;
    const pendentes = purchases.filter((p) => p.status === 'pendente').length;
    const aprovados = purchases.filter((p) => p.status === 'aprovado').length;
    const entregues = purchases.filter((p) => p.status === 'entregue').length;
    const totalSpent = purchases
      .filter((p) => p.status !== 'cancelado')
      .reduce((sum, p) => sum + Number(p.price || 0), 0);

    content.querySelector('#metrics').innerHTML = `
      <div class="metric"><div class="ring" style="--metric-color: radial-gradient(circle, rgba(124,58,237,0.4), transparent 70%)"></div>
        <div class="label">Pedidos</div><div class="value">${total}</div>
        <div class="delta up">+${entregues + aprovados} ativos</div>
      </div>
      <div class="metric"><div class="ring" style="--metric-color: radial-gradient(circle, rgba(34,211,238,0.4), transparent 70%)"></div>
        <div class="label">Pendentes</div><div class="value">${pendentes}</div>
        <div class="delta">${pendentes > 0 ? 'Aguardando confirmação' : 'Tudo em dia'}</div>
      </div>
      <div class="metric"><div class="ring" style="--metric-color: radial-gradient(circle, rgba(244,114,182,0.4), transparent 70%)"></div>
        <div class="label">Entregues</div><div class="value">${entregues}</div>
        <div class="delta up">${entregues > 0 ? 'Tudo certo!' : '—'}</div>
      </div>
      <div class="metric"><div class="ring" style="--metric-color: radial-gradient(circle, rgba(34,197,94,0.4), transparent 70%)"></div>
        <div class="label">Total investido</div><div class="value">${UI.formatBRL(totalSpent)}</div>
        <div class="delta up">com Nexa Serviços</div>
      </div>
    `;
  }

  function renderChart(content, purchases) {
    const chart = content.querySelector('#bar-chart');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const count = purchases.filter((p) => (p.created_at || '').slice(0, 10) === key).length;
      days.push({ label, count });
    }
    const max = Math.max(1, ...days.map((d) => d.count));
    chart.innerHTML = days.map((d) =>
      `<div class="bar" style="height:${Math.max(8, (d.count / max) * 100)}%" data-label="${UI.escapeHtml(d.label)}"></div>`
    ).join('');
    content.querySelector('#chart-total').textContent = `Total: ${days.reduce((a, b) => a + b.count, 0)}`;
  }

  function renderActivity(content, activity) {
    const feed = content.querySelector('#activity-feed');
    if (!activity.length) {
      feed.innerHTML = `
        <div class="empty-state" style="padding:24px 8px;">
          ${Icons.svg('activity')}
          <h3 style="font-size:14px;margin-top:6px;">Sem atividade ainda</h3>
          <p>Quando você usar a plataforma, sua atividade aparece aqui.</p>
        </div>`;
      Icons.hydrate(feed);
      return;
    }
    feed.innerHTML = activity.map((a) => `
      <div class="activity-item">
        <span class="ico">${Icons.svg(iconForActivity(a.type))}</span>
        <div style="flex:1;min-width:0;">
          <div>${UI.escapeHtml(a.message || a.type)}</div>
          <div class="time">${UI.timeAgo(a.created_at || a.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  function iconForActivity(type) {
    if (type === 'login') return 'arrowRight';
    if (type === 'logout') return 'logout';
    if (type === 'signup') return 'user';
    if (type === 'purchase_created') return 'shoppingBag';
    if (type === 'purchase_updated' || type === 'status_change') return 'check';
    if (type === 'profile_updated') return 'edit';
    return 'activity';
  }

  function renderRecentPurchases(content, purchases) {
    const root = content.querySelector('#recent-purchases');
    const items = purchases.slice(0, 5);
    if (!items.length) {
      root.innerHTML = `
        <div class="empty-state" style="padding:20px;">
          ${Icons.svg('shoppingBag')}
          <h3 style="font-size:14px;margin-top:6px;">Nenhuma compra ainda</h3>
          <p>Visite o marketplace para começar.</p>
          <a href="store.html" class="btn btn-primary btn-sm" style="margin-top:8px;">Ver marketplace</a>
        </div>`;
      Icons.hydrate(root);
      return;
    }
    root.innerHTML = items.map((p) => `
      <div class="row-item">
        <div class="row-left">
          <span class="ico cat-${p.product_category || 'bots'}">${Icons.svg('shoppingBag')}</span>
          <div>
            <div class="ttl">${UI.escapeHtml(p.product_name)}</div>
            <div class="sub">${UI.formatDate(p.created_at)} • ${UI.formatBRL(p.price)}</div>
          </div>
        </div>
        ${UI.statusBadge(p.status)}
      </div>
    `).join('');
    Icons.hydrate(root);
  }

  function renderSuggestions(content, products, purchases) {
    const purchasedIds = new Set(purchases.map((p) => p.product_id));
    const recommended = products.filter((p) => p.recommended && p.active !== false && !purchasedIds.has(p.id)).slice(0, 4);
    const fallback = products.filter((p) => !purchasedIds.has(p.id)).slice(0, 4);
    const list = (recommended.length ? recommended : fallback).slice(0, 2);
    const root = content.querySelector('#suggestions');
    if (!list.length) {
      root.innerHTML = `<div class="empty-state" style="padding:20px;">${Icons.svg('compass')}<h3 style="font-size:14px;margin-top:6px;">Você já tem tudo!</h3><p>Em breve, novas surpresas.</p></div>`;
      Icons.hydrate(root);
      return;
    }
    root.innerHTML = list.map((p) => `
      <a href="store.html?product=${UI.escapeHtml(p.id)}" class="suggest">
        <div class="suggest-thumb">${Icons.svg(p.icon || 'bot')}</div>
        <div>
          <div class="ttl">${UI.escapeHtml(p.name)}</div>
          <div class="sub">${UI.escapeHtml(UI.CATEGORY_META[p.category]?.label || p.category)} • ${UI.formatBRL(p.price)}</div>
        </div>
      </a>
    `).join('');
    Icons.hydrate(root);
  }

  global.Dashboard = Dashboard;
})(window);
