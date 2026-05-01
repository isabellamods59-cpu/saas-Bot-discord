/* ============================================================
   NexaBots V2 — Demo seed (apenas no modo LocalStorage)
   No modo Supabase, o seed real está em supabase/seed.sql.
   ============================================================ */
(function () {
  'use strict';
  if (window.Nexa && window.Nexa.isReady()) return;

  const KEY_DONE = 'nexa.demo.seedDone.v2';
  if (localStorage.getItem(KEY_DONE) === '1') return;

  // Conta admin demo: admin / admin123
  try {
    const accounts = JSON.parse(localStorage.getItem('nexa.demo.accounts') || '[]');
    const profiles = JSON.parse(localStorage.getItem('nexa.demo.profiles') || '[]');
    if (!accounts.some((a) => a.username === 'admin')) {
      const id = 'demo-admin';
      // hash equivalente ao usado em auth.js
      function fakeHash(str) {
        let h = 5381;
        for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
        return String(h >>> 0);
      }
      accounts.push({ id, username: 'admin', email: 'admin@nexabots.app', password: fakeHash('admin123') });
      profiles.push({
        id, username: 'admin', email: 'admin@nexabots.app',
        display_name: 'Administrador', avatar: 'gradient-2', role: 'admin',
        bio: 'Operações da plataforma.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      localStorage.setItem('nexa.demo.accounts', JSON.stringify(accounts));
      localStorage.setItem('nexa.demo.profiles', JSON.stringify(profiles));
    }
  } catch (e) {
    console.warn('[Seed] falhou ao criar admin demo:', e);
  }
  localStorage.setItem(KEY_DONE, '1');
})();
