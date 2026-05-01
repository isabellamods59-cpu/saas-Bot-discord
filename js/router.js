/* ============================================================
   NexaBots — Router / Page guards
   - Protect pages (redirect to login if not authenticated)
   - Protect admin pages (redirect to dashboard if not admin)
   - Boot shared layout (sidebar, topbar, theme)
   ============================================================ */
(function (global) {
  'use strict';

  function requireAuth() {
    if (!Auth.isAuthenticated()) {
      window.location.replace('index.html');
      return false;
    }
    return true;
  }
  function requireAdmin() {
    if (!Auth.isAuthenticated()) {
      window.location.replace('index.html');
      return false;
    }
    if (!Auth.isAdmin()) {
      window.location.replace('dashboard.html');
      return false;
    }
    return true;
  }
  function redirectIfAuthed() {
    if (Auth.isAuthenticated()) {
      window.location.replace('dashboard.html');
      return true;
    }
    return false;
  }

  const NAV = [
    { group: 'Principal', items: [
      { href: 'dashboard.html', label: 'Dashboard',  icon: 'dashboard' },
      { href: 'plans.html',     label: 'Planos',     icon: 'plans' },
      { href: 'store.html',     label: 'Loja',       icon: 'store' },
      { href: 'purchases.html', label: 'Minhas compras', icon: 'purchases' },
    ]},
    { group: 'Conta', items: [
      { href: 'profile.html',   label: 'Perfil',     icon: 'user' },
      { href: 'settings.html',  label: 'Configurações', icon: 'settings' },
      { href: 'discord.html',   label: 'Suporte Discord', icon: 'discord' },
    ]},
    { group: 'Administração', items: [
      { href: 'admin.html',     label: 'Painel Admin', icon: 'shield', adminOnly: true },
    ]},
  ];

  function buildSidebar(activePage) {
    const user = Auth.currentUser();
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
    return `
      <aside class="sidebar">
        <a href="dashboard.html" class="sidebar-brand">
          <span class="logo">${Icons.svg('bot')}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="brand-name">NexaBots</span>
            <span class="brand-tag">PRO</span>
          </div>
        </a>
        <nav class="sidebar-nav">${groupsHTML}</nav>
        <div class="sidebar-foot">
          ${UI.renderAvatar(user, 'sm')}
          <div class="who">
            <span class="uname">${UI.escapeHtml((user && (user.displayName || user.username)) || '—')}</span>
            <span class="role">${user && user.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
          </div>
          <button class="btn-icon" data-action="logout" title="Sair" aria-label="Sair">${Icons.svg('logout')}</button>
        </div>
      </aside>
    `;
  }

  function buildTopbar(activePage) {
    const user = Auth.currentUser();
    const breadcrumb = (NAV.flatMap((g) => g.items).find((i) => i.href === activePage) || { label: 'NexaBots' }).label;
    const unread = user ? Notifications.unreadCount(user.id) : 0;
    return `
      <header class="topbar">
        <button class="toggle-sidebar" aria-label="Alternar menu" data-action="toggle-sidebar">${Icons.svg('menu')}</button>
        <div class="crumbs">
          <span>NexaBots</span>
          <span class="sep">/</span>
          <span class="current">${UI.escapeHtml(breadcrumb)}</span>
        </div>
        <div class="topbar-search">
          ${Icons.svg('search')}
          <input class="input" type="search" placeholder="Buscar planos, bots, comandos..." data-global-search />
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

  function bindShellEvents() {
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) {
        // close notif pop on outside click
        const notifPop = document.querySelector('.notif-pop');
        if (notifPop && !e.target.closest('.notif-pop') && !e.target.closest('[data-action="notifications"]')) {
          notifPop.remove();
        }
        return;
      }
      switch (action) {
        case 'logout':
          UI.confirm({ title: 'Sair', message: 'Deseja realmente encerrar a sessão?', confirmText: 'Sair', danger: true }).then((ok) => {
            if (!ok) return;
            Auth.logout();
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
          openNotifications(e.target.closest('[data-notif-root]'));
          break;
      }
    });
    // Global search (very light, just toasts a hint or filters tables in same page)
    document.addEventListener('input', (e) => {
      if (!e.target.matches('[data-global-search]')) return;
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('[data-search-target]').forEach((row) => {
        const text = row.dataset.searchText || row.textContent.toLowerCase();
        row.style.display = !q || text.includes(q) ? '' : 'none';
      });
    });
  }

  function openNotifications(anchor) {
    const existing = document.querySelector('.notif-pop');
    if (existing) { existing.remove(); return; }
    if (!anchor) return;
    const user = Auth.currentUser();
    if (!user) return;
    const list = Notifications.listForUser(user.id).slice(0, 8);
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
              <div class="time">${UI.timeAgo(n.timestamp)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    anchor.appendChild(pop);
    pop.querySelector('[data-mark-all-read]')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      Notifications.markAllRead(user.id);
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
  function mount({ active, requireAuth: needAuth = true, requireAdmin: needAdmin = false }) {
    if (needAdmin) { if (!requireAdmin()) return null; }
    else if (needAuth) { if (!requireAuth()) return null; }

    const settings = DB.meta.getSettings();
    UI.applyTheme(settings.theme || 'dark');

    const root = document.querySelector('[data-app]');
    if (!root) {
      console.error('[Router] missing [data-app] container');
      return null;
    }

    const contentInner = root.innerHTML;
    root.innerHTML = `
      <div class="app-shell ${settings.sidebarCollapsed ? 'collapsed' : ''}">
        ${buildSidebar(active)}
        <div>
          ${buildTopbar(active)}
          <main class="content"></main>
        </div>
      </div>
    `;
    const main = root.querySelector('.content');
    main.innerHTML = contentInner;

    bindShellEvents();
    syncThemeIcon();
    Icons.hydrate(root);
    UI.showRouteLoader();

    return main;
  }

  global.Router = { mount, requireAuth, requireAdmin, redirectIfAuthed };
})(window);
