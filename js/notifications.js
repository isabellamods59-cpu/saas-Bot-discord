/* ============================================================
   Nexa Serviços V2 — Notifications (thin wrapper sobre DB.notifications)
   ============================================================ */
(function (global) {
  'use strict';
  const Notifications = {
    async push({ userId, title, message, type = 'info' }) {
      return await DB.notifications.push({ userId, title, message, type });
    },
    async listForUser(userId) {
      return await DB.notifications.byUser(userId);
    },
    async unreadCount(userId) {
      return await DB.notifications.unreadCount(userId);
    },
    async markRead(id) { return await DB.notifications.markRead(id); },
    async markAllRead(userId) { return await DB.notifications.markAllRead(userId); },
  };
  global.Notifications = Notifications;
})(window);
