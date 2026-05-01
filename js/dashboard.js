/* ============================================================
   NexaBots — Dashboard page
   ============================================================ */
(function (global) {
  'use strict';

  function userOrders(userId) {
    return DB.orders.filter((o) => o.userId === userId);
  }

  function metrics(userId) {
    const orders = userOrders(userId);
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === 'entregue').length;
    const spent = orders.filter((o) => o.status !== 'cancelado').reduce((s, o) => s + (o.price || 0), 0);
    const activeBots = delivered; // simulated 1 active bot per delivered order
    return { total, delivered, spent, activeBots };
  }

  function renderStats(userId) {
    const { total, delivered, spent, activeBots } = metrics(userId);
    return `
      <div class="grid grid-stats">
        <div class="card card-stat animate-in" style="animation-delay:.05s">
          <span class="stat-icon">${Icons.svg('purchases')}</span>
          <span class="stat-label">Total de Compras</span>
          <span class="stat-value">${total}</span>
          <span class="stat-trend up">${Icons.svg('trendingUp')} ${total > 0 ? '+' + total : '0'} no total</span>
        </div>
        <div class="card card-stat animate-in" style="animation-delay:.1s">
          <span class="stat-icon">${Icons.svg('bot')}</span>
          <span class="stat-label">Bots Ativos</span>
          <span class="stat-value">${activeBots}</span>
          <span class="stat-trend up">${Icons.svg('checkCircle')} Funcionando 24/7</span>
        </div>
        <div class="card card-stat animate-in" style="animation-delay:.15s">
          <span class="stat-icon">${Icons.svg('dollar')}</span>
          <span class="stat-label">Investimento Total</span>
          <span class="stat-value">${UI.formatBRL(spent)}</span>
          <span class="stat-trend up">${Icons.svg('trendingUp')} Em planos NexaBots</span>
        </div>
        <div class="card card-stat animate-in" style="animation-delay:.2s">
          <span class="stat-icon">${Icons.svg('checkCircle')}</span>
          <span class="stat-label">Compras Entregues</span>
          <span class="stat-value">${delivered}</span>
          <span class="stat-trend up">${Icons.svg('check')} Aprovadas e ativas</span>
        </div>
      </div>
    `;
  }

  function renderActivity(userId) {
    const items = Activity.listForUser(userId, 8);
    if (items.length === 0) {
      return `
        <div class="empty-state">
          ${Icons.svg('activity')}
          <h3>Sem atividade ainda</h3>
          <p>Sua atividade recente vai aparecer aqui assim que você começar a usar a plataforma.</p>
        </div>
      `;
    }
    return `
      <div class="activity-feed">
        ${items.map((it) => {
          const meta = Activity.getMeta(it.type);
          return `
            <div class="activity-item ${meta.class}">
              <span class="ico">${Icons.svg(meta.icon)}</span>
              <div class="body">
                <div class="msg">${UI.escapeHtml(it.message)}</div>
                <div class="meta">${UI.formatDate(it.timestamp)} • ${UI.timeAgo(it.timestamp)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderChart() {
    // Generate fake but pretty bars
    const labels = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    const values = labels.map(() => Math.floor(20 + Math.random() * 80));
    const max = Math.max(...values);
    return `
      <div class="bar-chart">
        ${values.map((v, i) => `<div class="bar" data-label="${labels[i]}" style="height:${(v / max * 100).toFixed(0)}%; opacity:${0.55 + (v/max)*0.45}"></div>`).join('')}
      </div>
    `;
  }

  function renderRecentOrders(userId) {
    const orders = userOrders(userId).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    if (orders.length === 0) {
      return `
        <div class="empty-state">
          ${Icons.svg('shoppingBag')}
          <h3>Nenhuma compra ainda</h3>
          <p>Confira nossos planos e dê o primeiro passo na sua jornada NexaBots.</p>
          <a href="plans.html" class="btn btn-primary mt-4">${Icons.svg('plans')} Ver planos</a>
        </div>
      `;
    }
    return `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Plano</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead>
          <tbody>
            ${orders.map((o) => `
              <tr>
                <td><strong>${UI.escapeHtml(o.planName)}</strong></td>
                <td>${UI.formatDate(o.createdAt, { day:'2-digit', month:'short', year:'numeric' })}</td>
                <td>${UI.formatBRL(o.price)}</td>
                <td>${Purchases ? Purchases.statusBadge(o.status) : `<span class="badge">${o.status}</span>`}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function init() {
    const user = Auth.currentUser();
    if (!user) return;
    const main = document.querySelector('.content');
    if (!main) return;

    const greet = (() => {
      const h = new Date().getHours();
      if (h < 5) return 'Boa madrugada';
      if (h < 12) return 'Bom dia';
      if (h < 18) return 'Boa tarde';
      return 'Boa noite';
    })();

    main.innerHTML = `
      <section class="welcome-banner animate-in">
        <h2>${greet}, ${UI.escapeHtml(user.displayName || user.username)} 👋</h2>
        <p>Bem-vindo(a) de volta ao seu painel NexaBots. Aqui está um resumo da sua atividade e do desempenho dos seus bots.</p>
        <div class="actions">
          <a class="btn btn-primary" href="plans.html">${Icons.svg('plans')} Ver planos</a>
          <a class="btn btn-ghost" href="store.html">${Icons.svg('store')} Explorar loja</a>
          <a class="btn btn-ghost" href="discord.html">${Icons.svg('discord')} Suporte Discord</a>
        </div>
      </section>

      <div data-stats>${renderStats(user.id)}</div>

      <div class="grid mt-6" style="grid-template-columns: 1.4fr 1fr; gap:16px;">
        <div class="card animate-in">
          <div class="flex justify-between items-center" style="margin-bottom:8px;">
            <div>
              <div class="card-title">${Icons.svg('activity')} Visão semanal</div>
              <div class="card-subtitle">Engajamento simulado dos seus bots nos últimos 7 dias</div>
            </div>
            <div class="badge badge-purple no-dot">Demo</div>
          </div>
          ${renderChart()}
        </div>
        <div class="card animate-in" style="animation-delay:.05s">
          <div class="card-title">${Icons.svg('purchases')} Últimas compras</div>
          <div class="card-subtitle">Histórico recente de pedidos</div>
          <div data-recent>${renderRecentOrders(user.id)}</div>
        </div>
      </div>

      <div class="grid mt-6" style="grid-template-columns: 1fr 1fr; gap:16px;">
        <div class="card animate-in">
          <div class="card-title">${Icons.svg('compass')} Atalhos rápidos</div>
          <div class="card-subtitle">Acesse rapidamente as áreas mais usadas</div>
          <div class="grid grid-2 mt-2" style="gap:10px;">
            <a class="btn btn-ghost" href="profile.html">${Icons.svg('user')} Meu perfil</a>
            <a class="btn btn-ghost" href="purchases.html">${Icons.svg('purchases')} Minhas compras</a>
            <a class="btn btn-ghost" href="store.html">${Icons.svg('store')} Loja de bots</a>
            <a class="btn btn-ghost" href="settings.html">${Icons.svg('settings')} Configurações</a>
          </div>
        </div>
        <div class="card animate-in" style="animation-delay:.05s">
          <div class="card-title">${Icons.svg('activity')} Atividade recente</div>
          <div class="card-subtitle">O que aconteceu na sua conta</div>
          <div data-activity>${renderActivity(user.id)}</div>
        </div>
      </div>
    `;
    Icons.hydrate(main);
  }

  global.Dashboard = { init };
})(window);
