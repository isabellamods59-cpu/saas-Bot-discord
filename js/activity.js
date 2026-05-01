/* ============================================================
   Nexa Serviços V2 — Activity log (thin wrapper sobre DB.activity)
   ============================================================ */
(function (global) {
  'use strict';
  const Activity = {
    async record({ userId, type, message, data }) {
      return await DB.activity.record({ userId, type, message, data });
    },
    async list(limit = 200) {
      return await DB.activity.all(limit);
    },
    async byUser(userId, limit = 50) {
      return await DB.activity.byUser(userId, limit);
    },
  };
  global.Activity = Activity;
})(window);
