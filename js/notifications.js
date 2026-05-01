/* ============================================================
   NexaBots — Notifications center
   ============================================================ */
(function (global) {
  'use strict';

  function push({ userId, title, message, type }) {
    return DB.notifications.insert({
      userId: userId || null,
      title: title || 'Notificação',
      message: message || '',
      type: type || 'info',
      read: false,
      timestamp: DB.nowISO(),
    });
  }

  function listForUser(userId) {
    return DB.notifications.all()
      .filter((n) => !n.userId || n.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  function unreadCount(userId) {
    return listForUser(userId).filter((n) => !n.read).length;
  }

  function markRead(id) {
    return DB.notifications.update(id, { read: true });
  }

  function markAllRead(userId) {
    const all = DB.notifications.all();
    const next = all.map((n) => (!n.userId || n.userId === userId) ? Object.assign({}, n, { read: true }) : n);
    DB.notifications.replaceAll(next);
  }

  function broadcast({ title, message, type }) {
    return push({ userId: null, title, message, type: type || 'info' });
  }

  function seedDefaults(userId) {
    const existing = listForUser(userId);
    if (existing.length > 0) return;
    push({ userId, title: 'Bem-vindo(a) ao NexaBots!', message: 'Explore os planos e a loja para começar.', type: 'info' });
    push({ userId, title: 'Suporte 24/7', message: 'Abra um ticket no nosso Discord para qualquer dúvida.', type: 'info' });
  }

  global.Notifications = { push, listForUser, unreadCount, markRead, markAllRead, broadcast, seedDefaults };
})(window);
