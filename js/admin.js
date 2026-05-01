/* ============================================================
   Nexa Serviços V2 — Painel Admin
   Tabs: Visão geral, Usuários, Pedidos, Produtos, Logs
   ============================================================ */
(function (global) {
  'use strict';

  let me = null;
  let contentEl = null;
  let activeTab = 'overview';

  // caches
  let users = [];
  let products = [];
  let purchases = [];
  let logs = [];

  const Admin = {
    async init(ctx) {
      if (!ctx) return;
      me = ctx.user;
      contentEl = ctx.content;

      contentEl.innerHTML = `
        <div class="page-head">
          <div>
            <h1 class="page-title">Painel Admin</h1>
            <p class="page-sub">Gerencie usuários, pedidos, produtos e veja o que rola na plataforma.</p>
          </div>
          <div class="page-actions">
            <span class="badge badge-soft"><span data-icon="shield"></span> Modo: ${window.Nexa?.isReady() ? 'Live (Supabase)' : 'Demo (LocalStorage)'}</span>
          </div>
        </div>

        <div class="tabs">
          <button class="tab" data-tab="overview">${Icons.svg('dashboard')} Visão geral</button>
          <button class="tab" data-tab="users">${Icons.svg('users')} Usuários</button>
          <button class="tab" data-tab="orders">${Icons.svg('purchases')} Pedidos</button>
          <button class="tab" data-tab="products">${Icons.svg('store')} Produtos</button>
          <button class="tab" data-tab="logs">${Icons.svg('activity')} Logs</button>
        </div>

        <div id="tab-content"></div>
      `;
      Icons.hydrate(contentEl);

      contentEl.querySelectorAll('[data-tab]').forEach((b) => {
        b.addEventListener('click', () => switchTab(b.dataset.tab));
      });
      switchTab('overview');
    },
  };

  async function switchTab(tab) {
    activeTab = tab;
    contentEl.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const root = contentEl.querySelector('#tab-content');
    root.innerHTML = `<div class="card" style="padding:30px;">${UI.skeleton(3, 'row')}</div>`;
    try {
      if (tab === 'overview') await renderOverview(root);
      else if (tab === 'users') await renderUsers(root);
      else if (tab === 'orders') await renderOrders(root);
      else if (tab === 'products') await renderProducts(root);
      else if (tab === 'logs') await renderLogs(root);
    } catch (err) {
      console.error('[Admin] erro:', err);
      root.innerHTML = `<div class="card" style="padding:30px;">${Icons.svg('warn')} Erro ao carregar dados.</div>`;
      Icons.hydrate(root);
    }
  }

  /* --------------- OVERVIEW --------------- */
  async function renderOverview(root) {
    const [allUsers, allPurchases, recentLogs] = await Promise.all([
      DB.profiles.all(), DB.purchases.all(), DB.activity.all(20),
    ]);
    users = allUsers; purchases = allPurchases; logs = recentLogs;

    const totalRevenue = allPurchases
      .filter((p) => p.status !== 'cancelado')
      .reduce((s, p) => s + Number(p.price || 0), 0);
    const pending = allPurchases.filter((p) => p.status === 'pendente').length;
    const approved = allPurchases.filter((p) => p.status === 'aprovado').length;
    const delivered = allPurchases.filter((p) => p.status === 'entregue').length;
    const last7 = (() => {
      const cutoff = Date.now() - 7 * 86400000;
      return allPurchases.filter((p) => new Date(p.created_at).getTime() > cutoff);
    })();

    root.innerHTML = `
      <div class="grid grid-4 mb-6">
        <div class="metric"><div class="ring"></div>
          <div class="label">Usuários</div><div class="value">${allUsers.length}</div>
          <div class="delta up">${allUsers.filter((u) => u.role === 'admin').length} admins</div>
        </div>
        <div class="metric"><div class="ring"></div>
          <div class="label">Pedidos totais</div><div class="value">${allPurchases.length}</div>
          <div class="delta up">${last7.length} nos últimos 7 dias</div>
        </div>
        <div class="metric"><div class="ring"></div>
          <div class="label">Pendentes</div><div class="value">${pending}</div>
          <div class="delta">${approved} aprovados • ${delivered} entregues</div>
        </div>
        <div class="metric"><div class="ring"></div>
          <div class="label">Receita</div><div class="value">${UI.formatBRL(totalRevenue)}</div>
          <div class="delta up">acumulada</div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-header"><h3>Pedidos pendentes</h3><a class="link" data-jump="orders">Ver todos</a></div>
          <div id="pend-list">${UI.skeleton(3, 'row')}</div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Atividade recente</h3><a class="link" data-jump="logs">Ver tudo</a></div>
          <div id="recent-logs"></div>
        </div>
      </div>
    `;
    Icons.hydrate(root);

    const pendList = root.querySelector('#pend-list');
    const pendingRows = allPurchases.filter((p) => p.status === 'pendente').slice(0, 5);
    if (!pendingRows.length) {
      pendList.innerHTML = `<div class="empty-state" style="padding:24px;">${Icons.svg('check')}<h3 style="font-size:14px;margin-top:6px;">Tudo em dia!</h3><p>Nenhum pedido pendente.</p></div>`;
    } else {
      pendList.innerHTML = pendingRows.map((p) => `
        <div class="row-item">
          <div class="row-left">
            <span class="ico">${Icons.svg('shoppingBag')}</span>
            <div>
              <div class="ttl">${UI.escapeHtml(p.product_name)}</div>
              <div class="sub">${userLabel(p.user_id, allUsers)} • ${UI.formatBRL(p.price)}</div>
            </div>
          </div>
          ${UI.statusBadge(p.status)}
        </div>
      `).join('');
    }
    Icons.hydrate(pendList);

    const recentLogsEl = root.querySelector('#recent-logs');
    if (!recentLogs.length) {
      recentLogsEl.innerHTML = `<div class="empty-state" style="padding:24px;">${Icons.svg('activity')}<p>Sem atividade ainda.</p></div>`;
    } else {
      recentLogsEl.innerHTML = recentLogs.slice(0, 8).map((l) => `
        <div class="activity-item">
          <span class="ico">${Icons.svg('activity')}</span>
          <div style="flex:1;min-width:0;">
            <div>${UI.escapeHtml(l.message || l.type)}</div>
            <div class="time">${userLabel(l.user_id, allUsers)} • ${UI.timeAgo(l.created_at)}</div>
          </div>
        </div>
      `).join('');
    }
    Icons.hydrate(recentLogsEl);

    root.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(a.dataset.jump);
    }));
  }

  function userLabel(userId, list) {
    const u = list.find((x) => x.id === userId);
    return u ? UI.escapeHtml('@' + u.username) : '<span class="muted">desconhecido</span>';
  }

  /* --------------- USERS --------------- */
  async function renderUsers(root) {
    users = await DB.profiles.all();
    let filter = '';
    let roleFilter = 'todos';

    function html() {
      const list = users.filter((u) => {
        if (roleFilter !== 'todos' && u.role !== roleFilter) return false;
        if (filter && !((u.username || '') + (u.email || '') + (u.display_name || '')).toLowerCase().includes(filter)) return false;
        return true;
      });
      return `
        <div class="toolbar mb-4">
          <div class="search-field">${Icons.svg('search')}<input class="input" id="u-search" placeholder="Buscar usuário..." value="${UI.escapeHtml(filter)}"/></div>
          <select class="input" id="u-role">
            <option value="todos">Todos</option>
            <option value="admin">Admins</option>
            <option value="user">Usuários</option>
          </select>
        </div>
        <div class="card" style="padding:0;overflow:hidden;">
          <table class="table">
            <thead>
              <tr><th>Usuário</th><th>E-mail</th><th>Função</th><th>Cadastro</th><th>Ações</th></tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `<tr><td colspan="5" style="padding:32px;text-align:center;color:var(--text-2)">Nenhum usuário encontrado.</td></tr>` : list.map((u) => `
                <tr data-id="${UI.escapeHtml(u.id)}">
                  <td><div style="display:flex;align-items:center;gap:10px;">${UI.renderAvatar(u, 'sm')}<div><div style="font-weight:600;">${UI.escapeHtml(u.display_name || u.username)}</div><div class="muted" style="font-size:12px;">@${UI.escapeHtml(u.username)}</div></div></div></td>
                  <td><span class="muted">${UI.escapeHtml(u.email || '—')}</span></td>
                  <td>${u.role === 'admin' ? '<span class="badge badge-info">Admin</span>' : '<span class="badge badge-muted">Usuário</span>'}</td>
                  <td><span class="muted">${UI.formatDate(u.created_at)}</span></td>
                  <td>
                    <button class="btn btn-sm btn-ghost" data-act="role">${u.role === 'admin' ? 'Remover admin' : 'Promover'}</button>
                    ${u.id !== me.id ? `<button class="btn btn-sm btn-danger" data-act="del">${Icons.svg('trash')} Excluir</button>` : ''}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    function render() { root.innerHTML = html(); Icons.hydrate(root); attach(); }
    function attach() {
      root.querySelector('#u-search').addEventListener('input', UI.debounce((e) => { filter = e.target.value.trim().toLowerCase(); render(); }, 200));
      root.querySelector('#u-role').addEventListener('change', (e) => { roleFilter = e.target.value; render(); });
      root.querySelectorAll('[data-act]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const tr = btn.closest('tr'); const id = tr?.dataset.id;
          const target = users.find((u) => u.id === id);
          if (!target) return;
          if (btn.dataset.act === 'role') {
            const newRole = target.role === 'admin' ? 'user' : 'admin';
            try {
              await DB.profiles.update(id, { role: newRole });
              await Activity.record({ userId: me.id, type: 'admin_action', message: `Função de @${target.username} alterada para ${newRole}.` });
              UI.toast.success('Função atualizada.');
              users = await DB.profiles.all(); render();
            } catch (err) { UI.toast.error(err?.message || 'Falha ao atualizar.'); }
          } else if (btn.dataset.act === 'del') {
            const ok = await UI.confirm({ title: 'Excluir usuário', message: `Apagar @${target.username}? Isso remove apenas o perfil. A conta de auth precisa ser apagada via Supabase Dashboard.`, danger: true, confirmText: 'Excluir' });
            if (!ok) return;
            try {
              await DB.profiles.remove(id);
              await Activity.record({ userId: me.id, type: 'admin_action', message: `Perfil de @${target.username} removido.` });
              UI.toast.success('Perfil removido.');
              users = await DB.profiles.all(); render();
            } catch (err) { UI.toast.error(err?.message || 'Falha ao excluir.'); }
          }
        });
      });
    }
    render();
  }

  /* --------------- ORDERS --------------- */
  async function renderOrders(root) {
    [purchases, users] = await Promise.all([DB.purchases.all(), DB.profiles.all()]);
    let st = 'todos', cat = 'todos', q = '';
    function html() {
      const list = purchases.filter((p) => {
        if (st !== 'todos' && p.status !== st) return false;
        if (cat !== 'todos' && p.product_category !== cat) return false;
        const u = users.find((u) => u.id === p.user_id);
        const target = ((p.product_name || '') + ' ' + (u?.username || '') + ' ' + (u?.email || '')).toLowerCase();
        if (q && !target.includes(q)) return false;
        return true;
      });
      return `
        <div class="toolbar mb-4">
          <div class="search-field">${Icons.svg('search')}<input class="input" id="o-q" placeholder="Buscar..." value="${UI.escapeHtml(q)}"/></div>
          <select class="input" id="o-status">
            <option value="todos">Todos status</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select class="input" id="o-cat">
            <option value="todos">Todas categorias</option>
            ${DB.CATEGORIES.map((c) => `<option value="${c}">${UI.CATEGORY_META[c].label}</option>`).join('')}
          </select>
        </div>
        <div class="card" style="padding:0;overflow:hidden;">
          <table class="table">
            <thead><tr>
              <th>Pedido</th><th>Usuário</th><th>Produto</th><th>Categoria</th><th>Status</th><th>Valor</th><th>Data</th><th>Ações</th>
            </tr></thead>
            <tbody>
              ${list.length === 0 ? `<tr><td colspan="8" style="padding:32px;text-align:center;color:var(--text-2)">Nenhum pedido.</td></tr>` : list.map((p) => {
                const u = users.find((u) => u.id === p.user_id);
                return `<tr data-id="${UI.escapeHtml(p.id)}">
                  <td><span class="mono">#${(p.id || '').slice(0, 8)}</span></td>
                  <td>${u ? `@${UI.escapeHtml(u.username)}` : '<span class="muted">—</span>'}</td>
                  <td><strong>${UI.escapeHtml(p.product_name)}</strong></td>
                  <td>${UI.categoryBadge(p.product_category)}</td>
                  <td>${UI.statusBadge(p.status)}</td>
                  <td>${UI.formatBRL(p.price)}</td>
                  <td><span class="muted">${UI.formatDate(p.created_at)}</span></td>
                  <td>
                    <select class="input input-sm" data-status>
                      ${DB.STATUSES.map((s) => `<option value="${s}" ${s===p.status?'selected':''}>${UI.STATUS_META[s].label}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-danger" data-del>${Icons.svg('trash')}</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    function render() { root.innerHTML = html(); Icons.hydrate(root); attach(); }
    function attach() {
      root.querySelector('#o-q').addEventListener('input', UI.debounce((e) => { q = e.target.value.trim().toLowerCase(); render(); }, 200));
      root.querySelector('#o-status').addEventListener('change', (e) => { st = e.target.value; render(); });
      root.querySelector('#o-cat').addEventListener('change', (e) => { cat = e.target.value; render(); });
      root.querySelectorAll('[data-status]').forEach((sel) => {
        sel.addEventListener('change', async () => {
          const tr = sel.closest('tr'); const id = tr?.dataset.id;
          const newStatus = sel.value;
          try {
            await DB.purchases.setStatus(id, newStatus);
            const purchase = purchases.find((x) => x.id === id);
            await Activity.record({ userId: me.id, type: 'admin_action', message: `Pedido #${id.slice(0,8)} alterado para "${UI.STATUS_META[newStatus].label}".` });
            if (purchase?.user_id) await Notifications.push({ userId: purchase.user_id, type: newStatus === 'cancelado' ? 'error' : 'success', title: 'Status atualizado', message: `Seu pedido para ${purchase.product_name} agora está: ${UI.STATUS_META[newStatus].label}.` });
            UI.toast.success('Status atualizado.');
            purchases = await DB.purchases.all(); render();
          } catch (err) { UI.toast.error(err?.message || 'Falha ao atualizar.'); }
        });
      });
      root.querySelectorAll('[data-del]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const tr = btn.closest('tr'); const id = tr?.dataset.id;
          const ok = await UI.confirm({ title: 'Excluir pedido', message: 'Tem certeza? Esta ação é permanente.', danger: true });
          if (!ok) return;
          try {
            await DB.purchases.remove(id);
            UI.toast.success('Pedido removido.');
            purchases = await DB.purchases.all(); render();
          } catch (err) { UI.toast.error(err?.message || 'Falha ao excluir.'); }
        });
      });
    }
    render();
  }

  /* --------------- PRODUCTS --------------- */
  async function renderProducts(root) {
    products = await DB.products.all();
    let q = '', cat = 'todos';
    function html() {
      const list = products.filter((p) => {
        if (cat !== 'todos' && p.category !== cat) return false;
        if (q && !((p.name || '') + (p.description || '') + (p.short_description || '')).toLowerCase().includes(q)) return false;
        return true;
      });
      return `
        <div class="toolbar mb-4" style="justify-content:space-between;">
          <div style="display:flex;gap:10px;flex:1;">
            <div class="search-field" style="flex:1;">${Icons.svg('search')}<input class="input" id="p-q" placeholder="Buscar produto..." value="${UI.escapeHtml(q)}"/></div>
            <select class="input" id="p-cat">
              <option value="todos">Todas</option>
              ${DB.CATEGORIES.map((c) => `<option value="${c}">${UI.CATEGORY_META[c].label}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary" id="p-new">${Icons.svg('plus')} Novo produto</button>
        </div>
        <div class="card" style="padding:0;overflow:hidden;">
          <table class="table">
            <thead><tr><th>Nome</th><th>Categoria</th><th>Preço</th><th>Status</th><th>Recomendado</th><th>Ações</th></tr></thead>
            <tbody>
              ${list.length === 0 ? `<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--text-2)">Nenhum produto.</td></tr>` : list.map((p) => `
                <tr data-id="${UI.escapeHtml(p.id)}">
                  <td><div style="display:flex;align-items:center;gap:10px;"><span style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--bg-elev-2);color:var(--brand-300)">${Icons.svg(p.icon || 'bot')}</span><div><div style="font-weight:600;">${UI.escapeHtml(p.name)}</div><div class="muted" style="font-size:12px;">${UI.escapeHtml(p.short_description || '')}</div></div></div></td>
                  <td>${UI.categoryBadge(p.category)}</td>
                  <td>${UI.formatBRL(p.price)}</td>
                  <td>${p.active === false ? '<span class="badge badge-muted">Oculto</span>' : '<span class="badge badge-success">Ativo</span>'}</td>
                  <td>${p.recommended ? '<span class="badge badge-info">Sim</span>' : '<span class="muted">—</span>'}</td>
                  <td>
                    <button class="btn btn-sm btn-ghost" data-edit>${Icons.svg('edit')}</button>
                    <button class="btn btn-sm btn-danger" data-del>${Icons.svg('trash')}</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    function render() { root.innerHTML = html(); Icons.hydrate(root); attach(); }
    function attach() {
      root.querySelector('#p-q').addEventListener('input', UI.debounce((e) => { q = e.target.value.trim().toLowerCase(); render(); }, 200));
      root.querySelector('#p-cat').addEventListener('change', (e) => { cat = e.target.value; render(); });
      root.querySelector('#p-new').addEventListener('click', () => openProductForm(null));
      root.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => {
        const id = btn.closest('tr').dataset.id;
        const p = products.find((x) => x.id === id);
        if (p) openProductForm(p);
      }));
      root.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.closest('tr').dataset.id;
        const ok = await UI.confirm({ title: 'Excluir produto', message: 'Esta ação não pode ser desfeita.', danger: true });
        if (!ok) return;
        try {
          await DB.products.remove(id);
          UI.toast.success('Produto removido.');
          products = await DB.products.all(); render();
        } catch (err) { UI.toast.error(err?.message || 'Falha ao excluir.'); }
      }));
    }
    function openProductForm(p) {
      const isEdit = !!p;
      const data = p || {};
      const m = UI.openModal({
        title: isEdit ? 'Editar produto' : 'Novo produto',
        size: 'lg',
        body: `
          <form id="prod-form" class="form-grid">
            <div class="form-row">
              <div class="field"><label class="field-label">Nome</label><input class="input" name="name" required value="${UI.escapeHtml(data.name || '')}"/></div>
              <div class="field"><label class="field-label">Categoria</label><select class="input" name="category" required>${DB.CATEGORIES.map((c) => `<option value="${c}" ${c===data.category?'selected':''}>${UI.CATEGORY_META[c].label}</option>`).join('')}</select></div>
            </div>
            <div class="form-row">
              <div class="field"><label class="field-label">Preço (R$)</label><input class="input" name="price" type="number" step="0.01" min="0" required value="${data.price ?? ''}"/></div>
              <div class="field"><label class="field-label">Período</label><input class="input" name="period" placeholder="ex: mês, ano, único" value="${UI.escapeHtml(data.period || '')}"/></div>
              <div class="field"><label class="field-label">Ícone (key)</label><input class="input" name="icon" placeholder="bot, shield2, music..." value="${UI.escapeHtml(data.icon || 'bot')}"/></div>
            </div>
            <div class="field"><label class="field-label">Descrição curta</label><input class="input" name="short_description" value="${UI.escapeHtml(data.short_description || '')}"/></div>
            <div class="field"><label class="field-label">Descrição completa</label><textarea class="input" name="description" rows="3">${UI.escapeHtml(data.description || '')}</textarea></div>
            <div class="field"><label class="field-label">Recursos (um por linha)</label><textarea class="input" name="features" rows="3">${(data.features || []).join('\n')}</textarea></div>
            <div class="form-row">
              <div class="field"><label class="field-label">Badge</label><input class="input" name="badge" placeholder="ex: Top 1, Lançamento" value="${UI.escapeHtml(data.badge || '')}"/></div>
              <div class="field"><label class="field-label">Imagem (URL)</label><input class="input" name="image" value="${UI.escapeHtml(data.image || '')}"/></div>
            </div>
            <div class="form-row">
              <label class="checkbox"><input type="checkbox" name="active" ${data.active !== false ? 'checked' : ''}/><span class="box"></span><span>Ativo</span></label>
              <label class="checkbox"><input type="checkbox" name="recommended" ${data.recommended ? 'checked' : ''}/><span class="box"></span><span>Recomendado</span></label>
            </div>
          </form>
        `,
        footer: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="prod-save">${Icons.svg('check')} Salvar</button>`,
      });
      Icons.hydrate(m.root);
      m.root.querySelector('#prod-save').addEventListener('click', async () => {
        const f = m.root.querySelector('#prod-form');
        const fd = new FormData(f);
        const features = String(fd.get('features') || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
        const payload = {
          name: fd.get('name'),
          category: fd.get('category'),
          price: Number(fd.get('price') || 0),
          period: fd.get('period') || null,
          icon: fd.get('icon') || 'bot',
          short_description: fd.get('short_description') || null,
          description: fd.get('description') || null,
          features,
          badge: fd.get('badge') || null,
          image: fd.get('image') || null,
          active: !!fd.get('active'),
          recommended: !!fd.get('recommended'),
        };
        try {
          if (isEdit) await DB.products.update(p.id, payload);
          else await DB.products.create(payload);
          UI.toast.success('Produto salvo.');
          m.close();
          products = await DB.products.all();
          renderProducts(root);
        } catch (err) { UI.toast.error(err?.message || 'Falha ao salvar.'); }
      });
    }
    render();
  }

  /* --------------- LOGS --------------- */
  async function renderLogs(root) {
    [logs, users] = await Promise.all([DB.activity.all(200), DB.profiles.all()]);
    let q = '';
    function html() {
      const list = logs.filter((l) => {
        if (!q) return true;
        const u = users.find((u) => u.id === l.user_id);
        return ((l.message || '') + ' ' + (l.type || '') + ' ' + (u?.username || '')).toLowerCase().includes(q);
      });
      return `
        <div class="toolbar mb-4" style="justify-content:space-between;">
          <div class="search-field" style="flex:1;">${Icons.svg('search')}<input class="input" id="l-q" placeholder="Buscar logs..." value="${UI.escapeHtml(q)}"/></div>
          <button class="btn btn-danger" id="l-clear">${Icons.svg('trash')} Limpar logs</button>
        </div>
        <div class="card" style="padding:0;overflow:hidden;">
          <table class="table">
            <thead><tr><th>Tipo</th><th>Usuário</th><th>Mensagem</th><th>Quando</th></tr></thead>
            <tbody>
              ${list.length === 0 ? `<tr><td colspan="4" style="padding:32px;text-align:center;color:var(--text-2)">Sem logs.</td></tr>` : list.map((l) => {
                const u = users.find((u) => u.id === l.user_id);
                return `<tr>
                  <td><span class="badge badge-muted">${UI.escapeHtml(l.type || '—')}</span></td>
                  <td>${u ? '@' + UI.escapeHtml(u.username) : '<span class="muted">sistema</span>'}</td>
                  <td>${UI.escapeHtml(l.message || '')}</td>
                  <td><span class="muted">${UI.formatDate(l.created_at)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    function render() { root.innerHTML = html(); Icons.hydrate(root); attach(); }
    function attach() {
      root.querySelector('#l-q').addEventListener('input', UI.debounce((e) => { q = e.target.value.trim().toLowerCase(); render(); }, 200));
      root.querySelector('#l-clear').addEventListener('click', async () => {
        const ok = await UI.confirm({ title: 'Limpar logs', message: 'Apagar TODOS os logs de atividade?', danger: true });
        if (!ok) return;
        try {
          await DB.activity.clear();
          UI.toast.success('Logs apagados.');
          logs = await DB.activity.all(); render();
        } catch (err) { UI.toast.error(err?.message || 'Falha ao limpar.'); }
      });
    }
    render();
  }

  global.Admin = Admin;
})(window);
