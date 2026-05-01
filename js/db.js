/* ============================================================
   NexaBots — DB (LocalStorage abstraction, simulating LocalBase)
   Provides a Mongo/Firebase-style API on top of localStorage.
   ============================================================ */
(function (global) {
  'use strict';

  const PREFIX = 'nexabots_';
  const VERSION_KEY = PREFIX + 'version';
  const CURRENT_VERSION = '1.0.0';

  function read(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[DB] read error', key, e);
      return null;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[DB] write error', key, e);
      return false;
    }
  }
  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  function uid(prefix = 'id') {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function nowISO() { return new Date().toISOString(); }

  // ---------- Collection helpers ----------
  function collection(name) {
    if (!read(name)) write(name, []);
    return {
      all() { return read(name) || []; },
      find(predicate) { return (read(name) || []).find(predicate); },
      filter(predicate) { return (read(name) || []).filter(predicate); },
      get(id) { return (read(name) || []).find((x) => x.id === id); },
      insert(doc) {
        const list = read(name) || [];
        const item = Object.assign({ id: uid(name), createdAt: nowISO() }, doc);
        list.push(item);
        write(name, list);
        return item;
      },
      update(id, patch) {
        const list = read(name) || [];
        const idx = list.findIndex((x) => x.id === id);
        if (idx === -1) return null;
        list[idx] = Object.assign({}, list[idx], patch, { updatedAt: nowISO() });
        write(name, list);
        return list[idx];
      },
      remove(id) {
        const list = read(name) || [];
        const next = list.filter((x) => x.id !== id);
        write(name, next);
        return list.length !== next.length;
      },
      replaceAll(items) { write(name, items); },
      count() { return (read(name) || []).length; },
      clear() { write(name, []); },
    };
  }

  // ---------- Top-level state (session, settings) ----------
  const meta = {
    getSession() { return read('session'); },
    setSession(s) { return write('session', s); },
    clearSession() { remove('session'); },
    getSettings() {
      return read('settings') || { theme: 'dark', sidebarCollapsed: false, notifications: true, sound: true };
    },
    setSettings(s) { return write('settings', s); },
  };

  // ---------- Public ----------
  global.DB = {
    PREFIX,
    uid,
    nowISO,
    users:        collection('users'),
    plans:        collection('plans'),
    orders:       collection('orders'),
    bots:         collection('bots'),
    activity:     collection('activity'),
    notifications:collection('notifications'),
    meta,
    raw: { read, write, remove },
    version() { return read('version') || CURRENT_VERSION; },
    setVersion(v) { write('version', v); },
    /** Reset everything (used by admin / seed). */
    nuke() {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
      keys.forEach((k) => localStorage.removeItem(k));
    },
    /** Export full database as JSON string. */
    exportAll() {
      const out = {};
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(PREFIX)) out[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k));
      });
      return JSON.stringify(out, null, 2);
    },
    /** Import full database from JSON string. */
    importAll(json) {
      try {
        const obj = JSON.parse(json);
        Object.entries(obj).forEach(([k, v]) => write(k, v));
        return true;
      } catch (e) {
        console.error('[DB] import failed', e);
        return false;
      }
    },
  };
})(window);
