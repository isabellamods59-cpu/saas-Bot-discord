/* ============================================================
   NexaBots — Admin panel
   ============================================================ */
(function (global) {
  'use strict';

  const STATUSES = ['pendente', 'aprovado', 'entregue', 'cancelado'];

  function init() {
    const me = Auth.currentUser();
    if (!me || me.role !== 'admin') return;
    const main = document.querySelector('.content');
    if (!main) return;

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="flex items-center gap-3">${Icons.svg('shield')} Painel Administrativo</h1>
          <p class="subtitle">Controle completo da plataforma — usuários, compras, atividades e mais.</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost" data-action="export">${Icons.svg('upload')} Exportar dados</button>
          <button class="btn btn-danger" data-action="nuke">${Icons.svg('refresh')} Resetar plataforma</button>
        </div>
      </div>

      <div class="admin-stats" data-stats></div>

      <div class="tabs mb-6" id="admin-tabs">
        <button class="tab active" data-tab="users">${Icons.svg('users')} Usuários</button>
        <button class="tab" data-tab="orders">${Icons.svg('purchases')} Compras</button>
        <button class="tab" data-tab="plans">${Icons.svg('plans')} Planos</button>
        <button class="tab" data-tab="bots">${Icons.svg('bot')} Bots</button>
        <button class="tab" data-tab="activity">${Icons.svg('activity')} Atividade</button>
      </div>

      <div data-panel></div>
    `;

    let tab = 'users';
    function renderStats() {
      const u = DB.users.count();
      const o = DB.orders.count();
      const revenue = DB.orders.all().filter((x) => x.status !== 'cancelado').reduce((s, x) => s + (x.price || 0), 0);
      const pending = DB.orders.filter((x) => x.status === 'pendente').length;
      main.querySelector('[data-stats]').innerHTML = `
        <div class="card card-stat">
          <span class="stat-icon">${Icons.svg('users')}</span>
          <span class="stat-label">Usuários</span>
          <span class="stat-value">${u}</span>
          <span class="stat-trend up">${Icons.svg('trendingUp')} Total cadastrado</span>
        </div>
        <div class="card card-stat">
          <span class="stat-icon">${Icons.svg('purchases')}</span>
          <span class="stat-label">Pedidos</span>
          <span class="stat-value">${o}</span>
          <span class="stat-trend up">${pending} pendente${pending !== 1 ? 's' : ''}</span>
        </div>
        <div class="card card-stat">
          <span class="stat-icon">${Icons.svg('dollar')}</span>
          <span class="stat-label">Receita simulada</span>
          <span class="stat-value" style="font-size:22px;">${UI.formatBRL(revenue)}</span>
          <span class="stat-trend up">${Icons.svg('trendingUp')} Excluindo cancelados</span>
        </div>
        <div class="card card-stat">
          <span class="stat-icon">${Icons.svg('activity')}</span>
          <span class="stat-label">Eventos</span>
          <span class="stat-value">${DB.activity.count()}</span>
          <span class="stat-trend up">Atividade total registrada</span>
        </div>
      `;
      Icons.hydrate(main.querySelector('[data-stats]'));
    }
    function renderPanel() {
      const wrap = main.querySelector('[data-panel]');
      if (tab === 'users') wrap.innerHTML = renderUsers();
      else if (tab === 'orders') wrap.innerHTML = renderOrders();
      else if (tab === 'plans') wrap.innerHTML = renderPlans();
      else if (tab === 'bots') wrap.innerHTML = renderBots();
      else if (tab === 'activity') wrap.innerHTML = renderActivity();
      Icons.hydrate(wrap);
    }

    main.querySelectorAll('#admin-tabs .tab').forEach((t) => {
      t.addEventListener('click', () => {
        main.querySelectorAll('#admin-tabs .tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        tab = t.dataset.tab;
        renderPanel();
      });
    });

    main.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'export') {
        const blob = new Blob([DB.exportAll()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nexabots-export-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        UI.toast.success('Backup gerado!');
        return;
      }
      if (action === 'nuke') {
        UI.confirm({ title: 'Resetar plataforma', message: 'Apagar TODOS os dados (usuários, pedidos, planos)? Essa ação não pode ser desfeita.', danger: true, confirmText: 'Apagar tudo' })
          .then((ok) => {
            if (!ok) return;
            DB.nuke();
            UI.toast.warn('Plataforma resetada. Redirecionando...');
            setTimeout(() => window.location.replace('index.html'), 700);
          });
        return;
      }

      // Users actions
      const editUser = e.target.closest('[data-edit-user]');
      const delUser = e.target.closest('[data-del-user]');
      const promoteUser = e.target.closest('[data-promote-user]');
      if (editUser) return openEditUser(editUser.dataset.editUser);
      if (delUser) return doDeleteUser(delUser.dataset.delUser);
      if (promoteUser) return doToggleAdmin(promoteUser.dataset.promoteUser);

      // Orders actions
      const orderStatus = e.target.closest('[data-order-status]');
      const orderDel = e.target.closest('[data-order-del]');
      const orderDetail = e.target.closest('[data-order-detail]');
      if (orderStatus) return openChangeStatus(orderStatus.dataset.orderStatus);
      if (orderDel) return doDeleteOrder(orderDel.dataset.orderDel);
      if (orderDetail) return openOrderDetail(orderDetail.dataset.orderDetail);

      // Plans
      const editPlan = e.target.closest('[data-edit-plan]');
      const delPlan = e.target.closest('[data-del-plan]');
      const newPlan = e.target.closest('[data-new-plan]');
      if (editPlan) return openEditPlan(editPlan.dataset.editPlan);
      if (delPlan) return doDeletePlan(delPlan.dataset.delPlan);
      if (newPlan) return openEditPlan(null);

      // Bots
      const editBot = e.target.closest('[data-edit-bot]');
      const delBot = e.target.closest('[data-del-bot]');
      const newBot = e.target.closest('[data-new-bot]');
      if (editBot) return openEditBot(editBot.dataset.editBot);
      if (delBot) return doDeleteBot(delBot.dataset.delBot);
      if (newBot) return openEditBot(null);

      // Activity
      const clearAct = e.target.closest('[data-clear-activity]');
      if (clearAct) {
        UI.confirm({ title: 'Limpar log', message: 'Apagar todo o histórico de atividade da plataforma?', danger: true })
          .then((ok) => { if (!ok) return; DB.activity.clear(); renderPanel(); UI.toast.success('Atividade limpa.'); });
      }
    });

    // Search
    main.addEventListener('input', (e) => {
      if (e.target.matches('[data-admin-search]')) {
        const q = e.target.value.trim().toLowerCase();
        main.querySelectorAll('[data-row]').forEach((r) => {
          const txt = r.dataset.searchText || r.textContent.toLowerCase();
          r.style.display = !q || txt.includes(q) ? '' : 'none';
        });
      }
    });

    // ---- Renderers ----
    function renderUsers() {
      const users = DB.users.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return `
        <div class="card">
          <div class="toolbar">
            <h3 style="margin:0;font-size:16px;">${users.length} usuário${users.length !== 1 ? 's' : ''}</h3>
            <div class="search-field">${Icons.svg('search')}<input class="input" placeholder="Buscar por nome, e-mail..." data-admin-search /></div>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Usuário</th><th>E-mail</th><th>Função</th><th>Cadastro</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map((u) => `
                  <tr data-row data-search-text="${UI.escapeHtml((u.username + ' ' + (u.displayName||'') + ' ' + u.email).toLowerCase())}">
                    <td>
                      <div class="flex items-center gap-3">
                        ${UI.renderAvatar(u, 'sm')}
                        <div>
                          <div style="font-weight:600;">${UI.escapeHtml(u.displayName || u.username)}</div>
                          <div class="muted" style="font-size:12px;">@${UI.escapeHtml(u.username)}</div>
                        </div>
                      </div>
                    </td>
                    <td>${UI.escapeHtml(u.email)}</td>
                    <td>${u.role === 'admin' ? '<span class="badge badge-purple no-dot">Administrador</span>' : '<span class="badge badge-info no-dot">Usuário</span>'}</td>
                    <td>${UI.formatDate(u.createdAt, { day:'2-digit', month:'short', year:'numeric' })}</td>
                    <td class="cell-actions">
                      <button class="btn btn-sm btn-ghost" data-edit-user="${u.id}" title="Editar">${Icons.svg('edit')}</button>
                      <button class="btn btn-sm btn-ghost" data-promote-user="${u.id}" title="${u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}">${Icons.svg('crown')}</button>
                      <button class="btn btn-sm btn-danger" data-del-user="${u.id}" title="Excluir">${Icons.svg('trash')}</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function renderOrders() {
      const orders = DB.orders.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return `
        <div class="card">
          <div class="toolbar">
            <h3 style="margin:0;font-size:16px;">${orders.length} pedido${orders.length !== 1 ? 's' : ''}</h3>
            <div class="search-field">${Icons.svg('search')}<input class="input" placeholder="Buscar por usuário ou plano..." data-admin-search /></div>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>#ID</th><th>Cliente</th><th>Plano</th><th>Data</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                ${orders.length === 0 ? `<tr><td colspan="7"><div class="empty-state">${Icons.svg('shoppingBag')}<h3>Sem pedidos ainda</h3><p>Os pedidos dos usuários aparecerão aqui.</p></div></td></tr>` : orders.map((o) => {
                  const u = DB.users.get(o.userId);
                  return `
                    <tr data-row data-search-text="${UI.escapeHtml(((u && u.username) || '') + ' ' + (o.planName || ''))}">
                      <td><span class="code">#${o.id.slice(-6).toUpperCase()}</span></td>
                      <td>
                        <div class="flex items-center gap-2">
                          ${u ? UI.renderAvatar(u, 'sm') : ''}
                          <div>
                            <div style="font-weight:600;">${UI.escapeHtml((u && (u.displayName || u.username)) || 'usuário removido')}</div>
                            <div class="muted" style="font-size:11.5px;">@${UI.escapeHtml((u && u.username) || '—')}</div>
                          </div>
                        </div>
                      </td>
                      <td>${UI.escapeHtml(o.planName)} <span class="muted" style="font-size:12px;">(${o.period === 'ano' ? 'Anual' : 'Mensal'})</span></td>
                      <td>${UI.formatDate(o.createdAt, { day:'2-digit', month:'short', year:'numeric' })}</td>
                      <td><strong>${UI.formatBRL(o.price)}</strong></td>
                      <td>${Purchases.statusBadge(o.status)}</td>
                      <td class="cell-actions">
                        <button class="btn btn-sm btn-ghost" data-order-detail="${o.id}" title="Detalhes">${Icons.svg('eye')}</button>
                        <button class="btn btn-sm btn-primary" data-order-status="${o.id}">Mudar status</button>
                        <button class="btn btn-sm btn-danger" data-order-del="${o.id}">${Icons.svg('trash')}</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function renderPlans() {
      const plans = DB.plans.all();
      return `
        <div class="card">
          <div class="toolbar">
            <h3 style="margin:0;font-size:16px;">${plans.length} plano${plans.length !== 1 ? 's' : ''}</h3>
            <button class="btn btn-primary btn-sm" data-new-plan>${Icons.svg('plus')} Novo plano</button>
          </div>
          <div class="grid grid-plans">
            ${plans.map((p) => `
              <div class="card plan-card ${p.recommended ? 'recommended' : ''}">
                <span class="plan-tag">${UI.escapeHtml(p.name)}</span>
                <p class="muted" style="margin:0;font-size:13px;">${UI.escapeHtml(p.tagline)}</p>
                <div class="plan-price">
                  <span class="currency">R$</span>${(p.price || 0).toFixed(2).replace('.', ',')}
                  <span class="period">/${p.period || 'mês'}</span>
                </div>
                <ul class="plan-features">
                  ${(p.features || []).slice(0, 4).map((f) => `<li>${UI.escapeHtml(f)}</li>`).join('')}
                </ul>
                <div class="flex gap-2">
                  <button class="btn btn-ghost btn-sm" data-edit-plan="${p.id}">${Icons.svg('edit')} Editar</button>
                  <button class="btn btn-danger btn-sm" data-del-plan="${p.id}">${Icons.svg('trash')} Excluir</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    function renderBots() {
      const bots = DB.bots.all();
      return `
        <div class="card">
          <div class="toolbar">
            <h3 style="margin:0;font-size:16px;">${bots.length} bot${bots.length !== 1 ? 's' : ''} na loja</h3>
            <button class="btn btn-primary btn-sm" data-new-bot>${Icons.svg('plus')} Novo bot</button>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Bot</th><th>Categoria</th><th>Preço</th><th>Ações</th></tr></thead>
              <tbody>
                ${bots.map((b) => `
                  <tr>
                    <td>
                      <div class="flex items-center gap-2">
                        <span class="avatar sm">${Icons.svg(b.icon)}</span>
                        <div>
                          <div style="font-weight:600;">${UI.escapeHtml(b.name)}</div>
                          <div class="muted" style="font-size:12px;">${UI.escapeHtml(b.desc.slice(0, 60))}...</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge badge-purple no-dot">${UI.escapeHtml(b.tag)}</span></td>
                    <td><strong>${UI.formatBRL(b.price)}</strong></td>
                    <td class="cell-actions">
                      <button class="btn btn-sm btn-ghost" data-edit-bot="${b.id}">${Icons.svg('edit')}</button>
                      <button class="btn btn-sm btn-danger" data-del-bot="${b.id}">${Icons.svg('trash')}</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function renderActivity() {
      const list = Activity.listAll(200);
      return `
        <div class="card">
          <div class="toolbar">
            <h3 style="margin:0;font-size:16px;">Log de atividades (${list.length})</h3>
            <div class="flex gap-2">
              <div class="search-field">${Icons.svg('search')}<input class="input" placeholder="Buscar mensagem..." data-admin-search /></div>
              <button class="btn btn-danger btn-sm" data-clear-activity>${Icons.svg('trash')} Limpar log</button>
            </div>
          </div>
          ${list.length === 0 ? `<div class="empty-state">${Icons.svg('activity')}<h3>Sem atividade</h3><p>Eventos aparecerão aqui em tempo real.</p></div>` : `
            <div class="activity-feed">
              ${list.map((it) => {
                const meta = Activity.getMeta(it.type);
                const u = it.userId ? DB.users.get(it.userId) : null;
                return `
                  <div class="activity-item ${meta.class}" data-row data-search-text="${UI.escapeHtml((it.message + ' ' + ((u && u.username) || '')).toLowerCase())}">
                    <span class="ico">${Icons.svg(meta.icon)}</span>
                    <div class="body">
                      <div class="msg">${u ? `<strong>@${UI.escapeHtml(u.username)}</strong> — ` : ''}${UI.escapeHtml(it.message)}</div>
                      <div class="meta">${UI.formatDate(it.timestamp)} • ${UI.timeAgo(it.timestamp)}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;
    }

    // ---- Modals ----
    function openEditUser(id) {
      const u = DB.users.get(id);
      if (!u) return;
      const m = UI.openModal({
        title: 'Editar usuário @' + u.username,
        body: `
          <div class="field"><label class="field-label">Nome de exibição</label><input class="input" id="ed-display" value="${UI.escapeHtml(u.displayName || '')}" /></div>
          <div class="field mt-4"><label class="field-label">E-mail</label><input class="input" id="ed-email" type="email" value="${UI.escapeHtml(u.email)}" /></div>
          <div class="field mt-4"><label class="field-label">Função</label>
            <select class="select" id="ed-role">
              <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuário</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>
          </div>
        `,
        footer: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${Icons.svg('check')} Salvar</button>`,
      });
      Icons.hydrate(m.root);
      m.root.querySelector('[data-save]').addEventListener('click', () => {
        const patch = {
          displayName: m.root.querySelector('#ed-display').value.trim(),
          email: m.root.querySelector('#ed-email').value.trim().toLowerCase(),
          role: m.root.querySelector('#ed-role').value,
        };
        if (!Auth.isValidEmail(patch.email)) { UI.toast.error('E-mail inválido.'); return; }
        DB.users.update(id, patch);
        Activity.log({ userId: me.id, type: 'admin', message: `Admin atualizou o usuário @${u.username}.` });
        UI.toast.success('Usuário atualizado.');
        m.close();
        renderStats(); renderPanel();
      });
    }

    function doDeleteUser(id) {
      const u = DB.users.get(id);
      if (!u) return;
      if (u.id === me.id) { UI.toast.error('Você não pode excluir a si mesmo.'); return; }
      UI.confirm({ title: 'Excluir usuário', message: `Excluir definitivamente @${u.username}? Os pedidos serão preservados.`, danger: true, confirmText: 'Excluir' })
        .then((ok) => {
          if (!ok) return;
          DB.users.remove(id);
          Activity.log({ userId: me.id, type: 'admin', message: `Admin excluiu o usuário @${u.username}.` });
          UI.toast.warn('Usuário excluído.');
          renderStats(); renderPanel();
        });
    }
    function doToggleAdmin(id) {
      const u = DB.users.get(id);
      if (!u) return;
      if (u.id === me.id) { UI.toast.error('Você não pode alterar sua própria função.'); return; }
      const newRole = u.role === 'admin' ? 'user' : 'admin';
      DB.users.update(id, { role: newRole });
      Activity.log({ userId: me.id, type: 'admin', message: `Função de @${u.username} alterada para ${newRole}.` });
      UI.toast.success('Função atualizada.');
      renderPanel();
    }

    function openChangeStatus(id) {
      const o = DB.orders.get(id);
      if (!o) return;
      const m = UI.openModal({
        title: 'Mudar status do pedido',
        body: `
          <p class="muted" style="font-size:13.5px;">Pedido #${o.id.slice(-6).toUpperCase()} — ${UI.escapeHtml(o.planName)}</p>
          <div class="flex gap-2 mt-4" style="flex-wrap:wrap;">
            ${STATUSES.map((s) => `<button class="pill ${o.status === s ? 'active' : ''}" data-set-status="${s}">${UI.escapeHtml(s.charAt(0).toUpperCase() + s.slice(1))}</button>`).join('')}
          </div>
        `,
        footer: `<button class="btn btn-ghost" data-close>Fechar</button>`,
      });
      m.root.querySelectorAll('[data-set-status]').forEach((b) => {
        b.addEventListener('click', () => {
          const newStatus = b.dataset.setStatus;
          DB.orders.update(id, { status: newStatus });
          Activity.log({ userId: me.id, type: 'admin', message: `Pedido #${o.id.slice(-6).toUpperCase()} marcado como ${newStatus}.`, data: { orderId: id } });
          if (o.userId) Notifications.push({ userId: o.userId, title: 'Status atualizado', message: `Seu pedido foi marcado como "${newStatus}".`, type: newStatus === 'entregue' ? 'success' : newStatus === 'cancelado' ? 'warning' : 'info' });
          UI.toast.success('Status atualizado.');
          m.close();
          renderStats(); renderPanel();
        });
      });
    }
    function doDeleteOrder(id) {
      UI.confirm({ title: 'Excluir pedido', message: 'Apagar este pedido definitivamente?', danger: true })
        .then((ok) => { if (!ok) return; DB.orders.remove(id); UI.toast.warn('Pedido excluído.'); renderStats(); renderPanel(); });
    }
    function openOrderDetail(id) {
      const o = DB.orders.get(id);
      if (!o) return;
      const u = DB.users.get(o.userId);
      UI.openModal({
        title: 'Pedido #' + o.id.slice(-6).toUpperCase(),
        body: `
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="grid grid-2" style="gap:12px;font-size:13.5px;">
              <div><span class="muted">Cliente:</span><br><strong>${u ? '@' + UI.escapeHtml(u.username) : '—'}</strong></div>
              <div><span class="muted">Status:</span><br>${Purchases.statusBadge(o.status)}</div>
              <div><span class="muted">Plano:</span><br><strong>${UI.escapeHtml(o.planName)}</strong></div>
              <div><span class="muted">Período:</span><br><strong>${o.period === 'ano' ? 'Anual' : 'Mensal'}</strong></div>
              <div><span class="muted">Valor:</span><br><strong>${UI.formatBRL(o.price)}</strong></div>
              <div><span class="muted">Criado em:</span><br><strong>${UI.formatDate(o.createdAt)}</strong></div>
            </div>
            ${o.notes ? `<div><span class="muted">Notas:</span><div class="card" style="padding:12px;font-size:13px;margin-top:6px;">${UI.escapeHtml(o.notes)}</div></div>` : ''}
          </div>
        `,
        footer: `<button class="btn btn-ghost" data-close>Fechar</button>`,
      });
    }

    function openEditPlan(id) {
      const p = id ? DB.plans.get(id) : { name: '', price: 0, period: 'mês', tagline: '', features: [], recommended: false };
      const m = UI.openModal({
        title: id ? 'Editar plano' : 'Novo plano',
        size: 'lg',
        body: `
          <div class="grid grid-2" style="gap:12px;">
            <div class="field"><label class="field-label">Nome</label><input class="input" id="p-name" value="${UI.escapeHtml(p.name)}" /></div>
            <div class="field"><label class="field-label">Tagline</label><input class="input" id="p-tag" value="${UI.escapeHtml(p.tagline || '')}" /></div>
            <div class="field"><label class="field-label">Preço (R$)</label><input class="input" id="p-price" type="number" step="0.01" value="${p.price}" /></div>
            <div class="field"><label class="field-label">Período</label>
              <select class="select" id="p-period"><option value="mês" ${p.period === 'mês' ? 'selected' : ''}>Mês</option><option value="ano" ${p.period === 'ano' ? 'selected' : ''}>Ano</option></select>
            </div>
          </div>
          <div class="field mt-4"><label class="field-label">Recursos (1 por linha)</label><textarea class="input textarea" id="p-feat" rows="6">${UI.escapeHtml((p.features || []).join('\n'))}</textarea></div>
          <label class="checkbox mt-4"><input type="checkbox" id="p-rec" ${p.recommended ? 'checked' : ''}><span class="box"></span><span>Marcar como recomendado</span></label>
        `,
        footer: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${Icons.svg('check')} Salvar</button>`,
      });
      Icons.hydrate(m.root);
      m.root.querySelector('[data-save]').addEventListener('click', () => {
        const data = {
          name: m.root.querySelector('#p-name').value.trim(),
          tagline: m.root.querySelector('#p-tag').value.trim(),
          price: parseFloat(m.root.querySelector('#p-price').value) || 0,
          period: m.root.querySelector('#p-period').value,
          features: m.root.querySelector('#p-feat').value.split('\n').map((s) => s.trim()).filter(Boolean),
          recommended: m.root.querySelector('#p-rec').checked,
        };
        if (!data.name) { UI.toast.error('O nome é obrigatório.'); return; }
        if (data.recommended) {
          DB.plans.replaceAll(DB.plans.all().map((x) => Object.assign({}, x, { recommended: false })));
        }
        if (id) DB.plans.update(id, data);
        else DB.plans.insert(data);
        Activity.log({ userId: me.id, type: 'admin', message: id ? `Plano "${data.name}" atualizado.` : `Novo plano "${data.name}" criado.` });
        UI.toast.success(id ? 'Plano atualizado.' : 'Plano criado.');
        m.close();
        renderPanel();
      });
    }
    function doDeletePlan(id) {
      const p = DB.plans.get(id);
      if (!p) return;
      UI.confirm({ title: 'Excluir plano', message: `Excluir o plano "${p.name}"?`, danger: true })
        .then((ok) => { if (!ok) return; DB.plans.remove(id); UI.toast.warn('Plano excluído.'); renderPanel(); });
    }

    function openEditBot(id) {
      const ICONS = ['music','shield2','coin','tag','trendingUp','gift','activity','gamepad','bot','sparkle','crown','heart'];
      const b = id ? DB.bots.get(id) : { name: '', tag: '', price: 0, desc: '', icon: 'bot', popularity: '' };
      const m = UI.openModal({
        title: id ? 'Editar bot' : 'Novo bot',
        size: 'lg',
        body: `
          <div class="grid grid-2" style="gap:12px;">
            <div class="field"><label class="field-label">Nome</label><input class="input" id="b-name" value="${UI.escapeHtml(b.name)}" /></div>
            <div class="field"><label class="field-label">Categoria</label><input class="input" id="b-tag" value="${UI.escapeHtml(b.tag)}" /></div>
            <div class="field"><label class="field-label">Preço (R$)</label><input class="input" id="b-price" type="number" step="0.01" value="${b.price}" /></div>
            <div class="field"><label class="field-label">Ícone</label>
              <select class="select" id="b-icon">${ICONS.map((i) => `<option value="${i}" ${b.icon === i ? 'selected' : ''}>${i}</option>`).join('')}</select>
            </div>
          </div>
          <div class="field mt-4"><label class="field-label">Descrição</label><textarea class="input textarea" id="b-desc" rows="4">${UI.escapeHtml(b.desc)}</textarea></div>
          <div class="field mt-4"><label class="field-label">Selo (opcional)</label><input class="input" id="b-pop" placeholder="ex: Mais vendido" value="${UI.escapeHtml(b.popularity || '')}" /></div>
        `,
        footer: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-save>${Icons.svg('check')} Salvar</button>`,
      });
      Icons.hydrate(m.root);
      m.root.querySelector('[data-save]').addEventListener('click', () => {
        const data = {
          name: m.root.querySelector('#b-name').value.trim(),
          tag: m.root.querySelector('#b-tag').value.trim(),
          price: parseFloat(m.root.querySelector('#b-price').value) || 0,
          icon: m.root.querySelector('#b-icon').value,
          desc: m.root.querySelector('#b-desc').value.trim(),
          popularity: m.root.querySelector('#b-pop').value.trim(),
        };
        if (!data.name || !data.tag) { UI.toast.error('Nome e categoria são obrigatórios.'); return; }
        if (id) DB.bots.update(id, data);
        else DB.bots.insert(data);
        Activity.log({ userId: me.id, type: 'admin', message: id ? `Bot "${data.name}" atualizado.` : `Novo bot "${data.name}" criado.` });
        UI.toast.success(id ? 'Bot atualizado.' : 'Bot criado.');
        m.close();
        renderPanel();
      });
    }
    function doDeleteBot(id) {
      const b = DB.bots.get(id);
      if (!b) return;
      UI.confirm({ title: 'Excluir bot', message: `Excluir o bot "${b.name}" da loja?`, danger: true })
        .then((ok) => { if (!ok) return; DB.bots.remove(id); UI.toast.warn('Bot excluído.'); renderPanel(); });
    }

    renderStats();
    renderPanel();
    Icons.hydrate(main);
  }

  global.AdminPanel = { init };
})(window);
