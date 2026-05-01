/* ============================================================
   NexaBots — Activity log
   ============================================================ */
(function (global) {
  'use strict';

  const TYPES = {
    auth:    { icon: 'user',     class: 'success' },
    order:   { icon: 'purchases',class: '' },
    plan:    { icon: 'plans',    class: '' },
    profile: { icon: 'edit',     class: '' },
    security:{ icon: 'lock',     class: 'warning' },
    admin:   { icon: 'shield',   class: 'warning' },
    system:  { icon: 'sparkle',  class: '' },
  };

  function log({ userId, type, message, data }) {
    return DB.activity.insert({
      userId: userId || null,
      type: type || 'system',
      message: message || '—',
      data: data || null,
      timestamp: DB.nowISO(),
    });
  }

  function listForUser(userId, limit = 50) {
    return DB.activity
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  function listAll(limit = 200) {
    return DB.activity.all()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  function clearForUser(userId) {
    const remaining = DB.activity.filter((a) => a.userId !== userId);
    DB.activity.replaceAll(remaining);
  }

  function getMeta(type) { return TYPES[type] || TYPES.system; }

  global.Activity = { log, listForUser, listAll, clearForUser, getMeta };
})(window);
