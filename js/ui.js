/* ============================================================
   Nexa Serviços V2 — UI utilities
   - Toast system
   - Modal helpers
   - Theme / sidebar toggles (localStorage-backed prefs)
   - Avatar gradients
   - Format helpers (currency, date, time-ago)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- Preferences (localStorage) ---------- */
  const PREFS_KEY = 'nexa.prefs';
  const DEFAULT_PREFS = {
    theme: 'dark',
    sidebarCollapsed: false,
    sound: true,
    inAppNotifications: true,
  };
  function getPrefs() {
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
    } catch { return { ...DEFAULT_PREFS }; }
  }
  function setPrefs(patch) {
    const next = { ...getPrefs(), ...patch };
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    return next;
  }

  /* ---------- Toasts ---------- */
  function ensureToastStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }
  function toast({ title, message, type = 'info', duration = 3800 }) {
    const stack = ensureToastStack();
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const iconName = type === 'success' ? 'check' : type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'info';
    el.innerHTML = `
      <div class="toast-icon" style="color: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--brand-300)'}">
        ${Icons.svg(iconName)}
      </div>
      <div style="flex:1;min-width:0;">
        ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
        <div class="toast-msg">${escapeHtml(message || '')}</div>
      </div>
      <button class="toast-close" aria-label="Fechar">${Icons.svg('close')}</button>
    `;
    stack.appendChild(el);
    const close = () => {
      el.style.animation = 'fadeIn 200ms reverse';
      setTimeout(() => el.remove(), 180);
    };
    el.querySelector('.toast-close').addEventListener('click', close);
    if (duration > 0) setTimeout(close, duration);
    return { close };
  }
  toast.success = (m, t = 'Sucesso') => toast({ title: t, message: m, type: 'success' });
  toast.error   = (m, t = 'Erro')    => toast({ title: t, message: m, type: 'error' });
  toast.warn    = (m, t = 'Atenção') => toast({ title: t, message: m, type: 'warning' });
  toast.info    = (m, t = 'Aviso')   => toast({ title: t, message: m, type: 'info' });

  /* ---------- Modal ---------- */
  function openModal({ title, body, footer, onClose, size }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const widthAttr = size === 'lg' ? 'style="max-width:780px"' : size === 'sm' ? 'style="max-width:420px"' : '';
    overlay.innerHTML = `
      <div class="modal" ${widthAttr}>
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(title || '')}</div>
          <button class="btn-icon" aria-label="Fechar" data-close>${Icons.svg('close')}</button>
        </div>
        <div class="modal-body" data-body></div>
        ${footer ? `<div class="modal-footer" data-footer></div>` : ''}
      </div>
    `;
    if (typeof body === 'string') overlay.querySelector('[data-body]').innerHTML = body;
    else if (body instanceof Node) overlay.querySelector('[data-body]').appendChild(body);

    if (footer && overlay.querySelector('[data-footer]')) {
      if (typeof footer === 'string') overlay.querySelector('[data-footer]').innerHTML = footer;
      else if (footer instanceof Node) overlay.querySelector('[data-footer]').appendChild(footer);
    }

    function close() {
      overlay.style.animation = 'fadeIn 200ms reverse';
      setTimeout(() => {
        overlay.remove();
        document.body.classList.remove('no-scroll');
        if (onClose) onClose();
      }, 180);
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
      if (e.target.closest('[data-close]')) close();
    });
    document.body.appendChild(overlay);
    document.body.classList.add('no-scroll');
    return { close, root: overlay };
  }
  function confirm({ title = 'Confirmar', message = 'Tem certeza?', confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
    return new Promise((resolve) => {
      const m = openModal({
        title,
        body: `<p style="color:var(--text-2);font-size:14px;line-height:1.6">${escapeHtml(message)}</p>`,
        footer: `
          <button class="btn btn-ghost" data-act="cancel">${escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${escapeHtml(confirmText)}</button>
        `,
        onClose: () => resolve(false),
      });
      m.root.addEventListener('click', (e) => {
        const t = e.target.closest('[data-act]');
        if (!t) return;
        const act = t.dataset.act;
        m.close();
        resolve(act === 'ok');
      });
    });
  }

  /* ---------- Theme / Sidebar ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    setPrefs({ theme });
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }
  function applySidebar(collapsed) {
    document.querySelector('.app-shell')?.classList.toggle('collapsed', !!collapsed);
    setPrefs({ sidebarCollapsed: !!collapsed });
  }
  function toggleSidebar() {
    const shell = document.querySelector('.app-shell');
    if (!shell) return;
    if (window.matchMedia('(max-width: 760px)').matches) {
      shell.classList.toggle('mobile-open');
      const overlay = ensureMobileOverlay();
      overlay.classList.toggle('active', shell.classList.contains('mobile-open'));
      return;
    }
    applySidebar(!shell.classList.contains('collapsed'));
  }
  function ensureMobileOverlay() {
    let o = document.querySelector('.mobile-overlay');
    if (!o) {
      o = document.createElement('div');
      o.className = 'mobile-overlay';
      o.addEventListener('click', () => {
        document.querySelector('.app-shell')?.classList.remove('mobile-open');
        o.classList.remove('active');
      });
      document.body.appendChild(o);
    }
    return o;
  }

  /* ---------- Avatars ---------- */
  const GRADIENTS = {
    'gradient-1': 'linear-gradient(135deg,#7c3aed,#22d3ee)',
    'gradient-2': 'linear-gradient(135deg,#f472b6,#7c3aed)',
    'gradient-3': 'linear-gradient(135deg,#fb923c,#f472b6)',
    'gradient-4': 'linear-gradient(135deg,#22c55e,#22d3ee)',
    'gradient-5': 'linear-gradient(135deg,#fbbf24,#f472b6)',
    'gradient-6': 'linear-gradient(135deg,#3b82f6,#7c3aed)',
  };
  function avatarStyle(avatarKey) {
    return `background: ${GRADIENTS[avatarKey] || GRADIENTS['gradient-1']}`;
  }
  function avatarInitials(user) {
    const name = (user && (user.display_name || user.displayName || user.username)) || '?';
    return name.replace(/[^a-zA-ZÀ-ÿ ]/g, '').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || name[0].toUpperCase();
  }
  function renderAvatar(user, size = '') {
    if (!user) return '';
    return `<span class="avatar ${size}" style="${avatarStyle(user.avatar)}">${avatarInitials(user)}</span>`;
  }

  /* ---------- Formatters ---------- */
  function formatBRL(v) {
    if (typeof v !== 'number') v = Number(v) || 0;
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function formatDate(iso, opts) {
    try {
      return new Date(iso).toLocaleString('pt-BR', opts || { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (_) { return '—'; }
  }
  function timeAgo(iso) {
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return 'agora';
    const m = Math.floor(s / 60);
    if (m < 60) return `há ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `há ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `há ${d}d`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `há ${mo} meses`;
    return `há ${Math.floor(mo / 12)} anos`;
  }

  /* ---------- Categories metadata ---------- */
  const CATEGORY_META = {
    bots:   { label: 'Bots Discord', icon: 'bot',      color: '#7c3aed', emoji: '🤖' },
    cursos: { label: 'Cursos',       icon: 'book',     color: '#22d3ee', emoji: '🎓' },
    jogos:  { label: 'Jogos',        icon: 'gamepad',  color: '#22c55e', emoji: '🎮' },
    nitro:  { label: 'Discord Nitro',icon: 'sparkle',  color: '#fbbf24', emoji: '💎' },
    lojas:  { label: 'Lojas Prontas',icon: 'store',    color: '#f472b6', emoji: '🛍️' },
  };
  const STATUS_META = {
    pendente:  { label: 'Pendente',  className: 'badge-warning' },
    aprovado:  { label: 'Aprovado',  className: 'badge-info' },
    entregue:  { label: 'Entregue',  className: 'badge-success' },
    cancelado: { label: 'Cancelado', className: 'badge-danger' },
  };
  function statusBadge(status) {
    const meta = STATUS_META[status] || { label: status, className: 'badge-muted' };
    return `<span class="badge ${meta.className}">${escapeHtml(meta.label)}</span>`;
  }
  function categoryBadge(cat) {
    const meta = CATEGORY_META[cat] || { label: cat, icon: 'tag' };
    return `<span class="badge badge-soft"><span class="cat-emoji">${meta.emoji || ''}</span> ${escapeHtml(meta.label)}</span>`;
  }

  /* ---------- Helpers ---------- */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function showRouteLoader() {
    const el = document.createElement('div');
    el.className = 'route-loader';
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));
    setTimeout(() => el.remove(), 800);
  }
  function copy(text) {
    return navigator.clipboard?.writeText(text)
      .then(() => toast.success('Copiado para a área de transferência.'))
      .catch(() => toast.error('Não foi possível copiar.'));
  }
  function skeleton(count = 1, className = '') {
    return Array.from({ length: count }).map(() => `<div class="skeleton ${className}"></div>`).join('');
  }
  function debounce(fn, ms = 300) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }
  function qs(name, search = location.search) {
    return new URLSearchParams(search).get(name);
  }

  /* ---------- Apply prefs on load ---------- */
  function applyStoredPrefs() {
    const p = getPrefs();
    document.documentElement.setAttribute('data-theme', p.theme || 'dark');
  }
  applyStoredPrefs();

  global.UI = {
    toast,
    openModal,
    confirm,
    applyTheme,
    toggleTheme,
    applySidebar,
    toggleSidebar,
    avatarStyle,
    avatarInitials,
    renderAvatar,
    formatBRL,
    formatDate,
    timeAgo,
    escapeHtml,
    showRouteLoader,
    copy,
    skeleton,
    debounce,
    qs,
    GRADIENTS,
    CATEGORY_META,
    STATUS_META,
    statusBadge,
    categoryBadge,
    getPrefs,
    setPrefs,
  };
})(window);
