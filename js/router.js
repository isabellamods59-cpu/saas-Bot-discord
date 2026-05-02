/* ============================================================
   Nexa Serviços V2 — Router / Page guards
   - Async page guard (espera sessão)
   - Constrói shell (sidebar, topbar, theme)
   - Suporta backend Supabase (live) ou modo preview (LocalStorage)
   ============================================================ */
(function (global) {
  'use strict';

  const NAV = [
    { group: 'Principal', items: [
      { href: 'dashboard.html',  label: 'Dashboard',       icon: 'dashboard' },
      { href: 'store.html',      label: 'Loja',            icon: 'store' },
      { href: 'purchases.html',  label: 'Minhas compras',  icon: 'purchases' },
    ]},
    { group: 'Conta', items: [
      { href: 'profile.html',    label: 'Perfil',          icon: 'user' },
      { href: 'settings.html',   label: 'Configurações',   icon: 'settings' },
      { href: 'discord.html',    label: 'Suporte Discord', icon: 'discord' },
    ]},
    { group: 'Administração', items: [
      { href: 'admin.html',      label: 'Painel Admin',    icon: 'shield', adminOnly: true },
    ]},
  ];

  function buildSidebar(activePage, user) {
    const isAdminUser = user && user.role === 'admin';
    const groupsHTML = NAV.map((g) => {
      const items = g.items.filter((i) => !i.adminOnly || isAdminUser);
      if (items.length === 0) return '';
      return `
        <div class="sidebar-section-title">${UI.escapeHtml(g.group)}</div>
        ${items.map((i) => `
          <a class="nav-link ${activePage === i.href ? 'active' : ''}" href="${i.href}" data-href="${i.href}">
            ${Icons.svg(i.icon)}
            <span class="label">${UI.escapeHtml(i.label)}</span>
            ${i.label === 'Suporte Discord' ? '<span class="nav-badge">Live</span>' : ''}
          </a>
        `).join('')}
      `;
    }).join('');
    const userName = (user && (user.display_name || user.username)) || '—';
    return `
      <aside class="sidebar">
        <a href="dashboard.html" class="sidebar-brand">
          <span class="logo">${Icons.svg('bot')}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="brand-name">Nexa Serviços</span>
          </div>
        </a>
        <nav class="sidebar-nav">${groupsHTML}</nav>
        <div class="sidebar-foot">
          <div class="sidebar-foot-user">
            ${UI.renderAvatar(user, 'sm')}
            <div class="who">
              <span class="uname">${UI.escapeHtml(userName)}</span>
              <span class="role">${user && user.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-block btn-logout" data-action="logout" title="Sair da conta">
            ${Icons.svg('logout')} <span>Sair da conta</span>
          </button>
        </div>
      </aside>
    `;
  }

  function buildTopbar(activePage, user, unread = 0) {
    const breadcrumb = (NAV.flatMap((g) => g.items).find((i) => i.href === activePage) || { label: 'Nexa Serviços' }).label;
    // Em produção (Supabase) o badge é discreto; em modo preview avisamos o operador.
    const isLive = !!(window.Nexa && window.Nexa.isReady());
    const envPill = isLive
      ? ''
      : '<span class="env-pill env-preview" title="Modo preview — configure Supabase em js/config.js para usar dados reais"><span class="dot"></span> Preview</span>';
    return `
      <header class="topbar">
        <button class="toggle-sidebar" aria-label="Alternar menu" data-action="toggle-sidebar">${Icons.svg('menu')}</button>
        <div class="crumbs">
          <span>Nexa Serviços</span>
          <span class="sep">/</span>
          <span class="current">${UI.escapeHtml(breadcrumb)}</span>
          ${envPill}
        </div>
        <div class="topbar-search">
          ${Icons.svg('search')}
          <input class="input" type="search" placeholder="Buscar produtos, pedidos..." data-global-search />
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" data-action="theme-toggle" aria-label="Alternar tema">
            <span class="icon-sun" style="display:none">${Icons.svg('sun')}</span>
            <span class="icon-moon">${Icons.svg('moon')}</span>
          </button>
          <div style="position:relative;" data-notif-root>
            <button class="icon-btn" data-action="notifications" aria-label="Notificações">
              ${Icons.svg('bell')}
              ${unread > 0 ? '<span class="pulse"></span>' : ''}
            </button>
          </div>
          <a class="icon-btn" href="profile.html" aria-label="Perfil">${Icons.svg('user')}</a>
        </div>
      </header>
    `;
  }

  function bindShellEvents(user) {
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) {
        const notifPop = document.querySelector('.notif-pop');
        if (notifPop && !e.target.closest('.notif-pop') && !e.target.closest('[data-action="notifications"]')) {
          notifPop.remove();
        }
        return;
      }
      switch (action) {
        case 'logout':
          UI.confirm({ title: 'Sair', message: 'Deseja realmente encerrar a sessão?', confirmText: 'Sair', danger: true }).then(async (ok) => {
            if (!ok) return;
            await Auth.logout();
            window.location.replace('index.html');
          });
          break;
        case 'toggle-sidebar':
          UI.toggleSidebar();
          break;
        case 'theme-toggle':
          UI.toggleTheme();
          syncThemeIcon();
          break;
        case 'notifications':
          openNotifications(e.target.closest('[data-notif-root]'), user);
          break;
      }
    });
    document.addEventListener('input', (e) => {
      if (!e.target.matches('[data-global-search]')) return;
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('[data-search-target]').forEach((row) => {
        const text = row.dataset.searchText || row.textContent.toLowerCase();
        row.style.display = !q || text.includes(q) ? '' : 'none';
      });
    });
  }

  async function openNotifications(anchor, user) {
    const existing = document.querySelector('.notif-pop');
    if (existing) { existing.remove(); return; }
    if (!anchor || !user) return;
    const list = (await DB.notifications.byUser(user.id)).slice(0, 8);
    const pop = document.createElement('div');
    pop.className = 'notif-pop';
    pop.innerHTML = `
      <div class="notif-head">
        <span>Notificações</span>
        <button class="btn btn-sm btn-ghost" data-mark-all-read>Marcar todas como lidas</button>
      </div>
      <div class="notif-list">
        ${list.length === 0 ? `
          <div class="empty-state" style="padding:24px 16px;">
            ${Icons.svg('bell')}
            <h3 style="font-size:14px;margin-top:6px;">Sem notificações</h3>
            <p>Você está em dia!</p>
          </div>
        ` : list.map((n) => `
          <div class="notif-item ${n.read ? '' : 'unread'}">
            <span class="dot"></span>
            <div style="flex:1;min-width:0;">
              <div class="ttl">${UI.escapeHtml(n.title)}</div>
              <div>${UI.escapeHtml(n.message)}</div>
              <div class="time">${UI.timeAgo(n.created_at || n.timestamp)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    anchor.appendChild(pop);
    pop.querySelector('[data-mark-all-read]')?.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      await DB.notifications.markAllRead(user.id);
      pop.remove();
      const pulse = anchor.querySelector('.pulse');
      if (pulse) pulse.remove();
      UI.toast.success('Notificações marcadas como lidas.');
    });
  }

  function syncThemeIcon() {
    const t = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('.icon-sun').forEach((el) => el.style.display = t === 'light' ? 'inline-flex' : 'none');
    document.querySelectorAll('.icon-moon').forEach((el) => el.style.display = t === 'light' ? 'none' : 'inline-flex');
  }

  /** Mount the layout shell into [data-app] container. Returns the .content node. */
  async function mount({ active, requireAuth: needAuth = true, requireAdmin: needAdmin = false } = {}) {
    let me = null;
    if (needAuth || needAdmin) {
      me = await Auth.requireSession({ adminOnly: needAdmin });
      if (!me) return null;
    }

    const prefs = UI.getPrefs();
    UI.applyTheme(prefs.theme || 'dark');

    const root = document.querySelector('[data-app]');
    if (!root) {
      console.error('[Router] missing [data-app] container');
      return null;
    }

    let unread = 0;
    if (me) {
      try { unread = await DB.notifications.unreadCount(me.id); } catch { unread = 0; }
    }

    const contentInner = root.innerHTML;
    root.innerHTML = `
      <div class="app-shell ${prefs.sidebarCollapsed ? 'collapsed' : ''}">
        ${buildSidebar(active, me)}
        <div class="app-main">
          ${buildTopbar(active, me, unread)}
          <main class="content"></main>
        </div>
      </div>
    `;
    const main = root.querySelector('.content');
    main.innerHTML = contentInner;

    bindShellEvents(me);
    syncThemeIcon();
    Icons.hydrate(root);
    UI.showRouteLoader();

    return { content: main, user: me };
  }

  /** Para páginas auth-only (login/register): redireciona se já autenticado */
  async function redirectIfAuthed() {
    const me = await Auth.currentUser();
    if (me) {
      window.location.replace('dashboard.html');
      return true;
    }
    return false;
  }

  global.Router = { mount, redirectIfAuthed };
})(window);
