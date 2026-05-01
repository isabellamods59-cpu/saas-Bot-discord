/* ============================================================
   NexaBots V2 — Data layer (Supabase first, LocalStorage fallback)

   Exporta `window.DB` com a mesma forma usada pelas páginas, mas
   agora todos os métodos são assíncronos (retornam Promises).

   Categorias / status:
     CATEGORIES  = ['bots','cursos','jogos','nitro','lojas']
     STATUSES    = ['pendente','aprovado','entregue','cancelado']
   ============================================================ */

(function () {
  'use strict';

  const CATEGORIES = ['bots', 'cursos', 'jogos', 'nitro', 'lojas'];
  const STATUSES = ['pendente', 'aprovado', 'entregue', 'cancelado'];

  const LS = {
    profiles: 'nexa.demo.profiles',
    products: 'nexa.demo.products',
    purchases: 'nexa.demo.purchases',
    activity: 'nexa.demo.activity',
    notifications: 'nexa.demo.notifications',
    session: 'nexa.demo.session',
  };

  const isReady = () => window.Nexa && window.Nexa.isReady();
  const supa = () => window.Nexa.db;

  /* ---------------- Local storage helpers (modo demo) ---------------- */
  function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  }
  function lsSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function nowISO() { return new Date().toISOString(); }

  /* ---------------- PROFILES ---------------- */
  const profiles = {
    async all() {
      if (isReady()) {
        return await supa().profiles.list({}, { orderBy: 'created_at', orderAsc: false });
      }
      return lsGet(LS.profiles);
    },
    async get(id) {
      if (isReady()) return await supa().profiles.get(id);
      return lsGet(LS.profiles).find((p) => p.id === id) || null;
    },
    async byUsername(username) {
      if (isReady()) {
        const list = await supa().profiles.list({}, { });
        return list.find((p) => p.username?.toLowerCase() === username.toLowerCase()) || null;
      }
      return lsGet(LS.profiles).find(
        (p) => p.username?.toLowerCase() === username.toLowerCase()
      ) || null;
    },
    async update(id, patch) {
      if (isReady()) return await supa().profiles.update(id, patch);
      const list = lsGet(LS.profiles);
      const i = list.findIndex((p) => p.id === id);
      if (i < 0) throw new Error('Perfil não encontrado.');
      list[i] = { ...list[i], ...patch, updated_at: nowISO() };
      lsSet(LS.profiles, list);
      return list[i];
    },
    async remove(id) {
      if (isReady()) return await supa().profiles.remove(id);
      const list = lsGet(LS.profiles).filter((p) => p.id !== id);
      lsSet(LS.profiles, list);
    },
  };

  /* ---------------- PRODUCTS ---------------- */
  const products = {
    async all() {
      if (isReady()) {
        return await supa().products.list({}, { orderBy: 'category', orderAsc: true });
      }
      return lsGet(LS.products);
    },
    async byCategory(category) {
      if (isReady()) return await supa().products.list({ category }, { orderBy: 'price', orderAsc: true });
      return lsGet(LS.products).filter((p) => p.category === category);
    },
    async get(id) {
      if (isReady()) return await supa().products.get(id);
      return lsGet(LS.products).find((p) => p.id === id) || null;
    },
    async create(payload) {
      const data = {
        ...payload,
        active: payload.active ?? true,
        recommended: !!payload.recommended,
        features: payload.features || [],
        metadata: payload.metadata || {},
      };
      if (isReady()) return await supa().products.create(data);
      const list = lsGet(LS.products);
      const created = { id: uuid(), created_at: nowISO(), updated_at: nowISO(), ...data };
      list.unshift(created);
      lsSet(LS.products, list);
      return created;
    },
    async update(id, patch) {
      if (isReady()) return await supa().products.update(id, patch);
      const list = lsGet(LS.products);
      const i = list.findIndex((p) => p.id === id);
      if (i < 0) throw new Error('Produto não encontrado.');
      list[i] = { ...list[i], ...patch, updated_at: nowISO() };
      lsSet(LS.products, list);
      return list[i];
    },
    async remove(id) {
      if (isReady()) return await supa().products.remove(id);
      lsSet(LS.products, lsGet(LS.products).filter((p) => p.id !== id));
    },
  };

  /* ---------------- PURCHASES ---------------- */
  const purchases = {
    async all() {
      if (isReady()) return await supa().purchases.list({});
      return lsGet(LS.purchases);
    },
    async byUser(userId) {
      if (isReady()) return await supa().purchases.list({ user_id: userId });
      return lsGet(LS.purchases).filter((p) => p.user_id === userId);
    },
    async get(id) {
      if (isReady()) return await supa().purchases.get(id);
      return lsGet(LS.purchases).find((p) => p.id === id) || null;
    },
    async create({ userId, product, period, notes }) {
      const payload = {
        user_id: userId,
        product_id: product.id || null,
        product_name: product.name,
        product_category: product.category || null,
        price: product.price,
        period: period || 'mês',
        status: 'pendente',
        notes: notes || null,
      };
      if (isReady()) return await supa().purchases.create(payload);
      const list = lsGet(LS.purchases);
      const created = { id: uuid(), created_at: nowISO(), updated_at: nowISO(), ...payload };
      list.unshift(created);
      lsSet(LS.purchases, list);
      return created;
    },
    async update(id, patch) {
      if (isReady()) return await supa().purchases.update(id, patch);
      const list = lsGet(LS.purchases);
      const i = list.findIndex((p) => p.id === id);
      if (i < 0) throw new Error('Pedido não encontrado.');
      list[i] = { ...list[i], ...patch, updated_at: nowISO() };
      lsSet(LS.purchases, list);
      return list[i];
    },
    async setStatus(id, status) {
      if (!STATUSES.includes(status)) throw new Error('Status inválido.');
      return await this.update(id, { status });
    },
    async remove(id) {
      if (isReady()) return await supa().purchases.remove(id);
      lsSet(LS.purchases, lsGet(LS.purchases).filter((p) => p.id !== id));
    },
  };

  /* ---------------- ACTIVITY LOGS ---------------- */
  const activity = {
    async all(limit = 200) {
      if (isReady()) return await supa().activity.list({}, { limit });
      return lsGet(LS.activity).slice(0, limit);
    },
    async byUser(userId, limit = 50) {
      if (isReady()) return await supa().activity.list({ user_id: userId }, { limit });
      return lsGet(LS.activity).filter((a) => a.user_id === userId).slice(0, limit);
    },
    async record({ userId, type, message, data }) {
      const payload = {
        user_id: userId || null,
        type,
        message,
        data: data || {},
      };
      if (isReady()) {
        try { return await supa().activity.create(payload); }
        catch (err) { console.warn('[DB.activity] não conseguiu gravar:', err); return null; }
      }
      const list = lsGet(LS.activity);
      const created = { id: uuid(), created_at: nowISO(), ...payload };
      list.unshift(created);
      lsSet(LS.activity, list.slice(0, 500));
      return created;
    },
    async clear() {
      if (isReady()) {
        // só admin consegue (RLS bloqueia o resto)
        const all = await supa().activity.list({});
        await Promise.all(all.map((row) => supa().activity.remove(row.id)));
        return;
      }
      lsSet(LS.activity, []);
    },
  };

  /* ---------------- NOTIFICATIONS ---------------- */
  const notifications = {
    async byUser(userId) {
      if (isReady()) return await supa().notifications.list({ user_id: userId });
      return lsGet(LS.notifications).filter((n) => n.user_id === userId);
    },
    async unreadCount(userId) {
      const list = await this.byUser(userId);
      return list.filter((n) => !n.read).length;
    },
    async push({ userId, title, message, type = 'info' }) {
      const payload = { user_id: userId, title, message, type, read: false };
      if (isReady()) return await supa().notifications.create(payload);
      const list = lsGet(LS.notifications);
      const created = { id: uuid(), created_at: nowISO(), ...payload };
      list.unshift(created);
      lsSet(LS.notifications, list);
      return created;
    },
    async markRead(id) {
      if (isReady()) return await supa().notifications.update(id, { read: true });
      const list = lsGet(LS.notifications);
      const i = list.findIndex((n) => n.id === id);
      if (i >= 0) { list[i].read = true; lsSet(LS.notifications, list); }
    },
    async markAllRead(userId) {
      const list = await this.byUser(userId);
      await Promise.all(list.filter((n) => !n.read).map((n) => this.markRead(n.id)));
    },
    async remove(id) {
      if (isReady()) return await supa().notifications.remove(id);
      lsSet(LS.notifications, lsGet(LS.notifications).filter((n) => n.id !== id));
    },
  };

  /* ---------------- DEMO SEED ---------------- */
  function seedDemo() {
    if (isReady()) return; // só popula em modo demo
    if (lsGet(LS.products).length > 0) return;
    const seed = [
      // mini seed para modo demo (sem Supabase). Versão completa: supabase/seed.sql
      { id: uuid(), name: 'Nexa Music', category: 'bots', price: 29.90, icon: 'music', short_description: 'Bot de música premium.', features: ['Multi-plataforma','Filas','Filtros'], badge: 'Top 1', recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Nexa Guardian', category: 'bots', price: 39.90, icon: 'shield2', short_description: 'Moderação anti-raid.', features: ['Anti-raid','AutoMod','Captcha'], badge: 'Mais vendido', recommended: true, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Nexa Tickets', category: 'bots', price: 19.90, icon: 'tag', short_description: 'Tickets profissionais.', features: ['Múltiplas categorias','Transcrições'], badge: null, recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Curso Discord.js', category: 'cursos', price: 197, icon: 'book', short_description: 'Curso completo de bots.', features: ['40h de aulas','Deploy 24/7'], badge: 'Lançamento', recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Discord Nitro Anual', category: 'nitro', price: 195, icon: 'crown', short_description: 'Nitro Full por 12 meses.', features: ['12 meses','Economia 35%'], badge: 'Melhor oferta', recommended: true, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Conta Roblox', category: 'jogos', price: 89, icon: 'gamepad', short_description: '1000+ Robux.', features: ['1000+ Robux','Badges raras'], badge: null, recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Loja Premium', category: 'lojas', price: 297, icon: 'store', short_description: 'Servidor de loja pronto.', features: ['Bots integrados','Templates'], badge: 'Pacote', recommended: true, active: true, created_at: nowISO() },
    ];
    lsSet(LS.products, seed);
  }

  /* ---------------- EXPORT ---------------- */
  window.DB = {
    CATEGORIES,
    STATUSES,
    profiles,
    products,
    purchases,
    activity,
    notifications,
    seedDemo,
    isLive: isReady,
  };

  // popula seed se modo demo
  seedDemo();
})();
