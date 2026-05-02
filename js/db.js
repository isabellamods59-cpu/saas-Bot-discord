/* ============================================================
   Nexa Serviços V2 — Data layer (Supabase first, LocalStorage fallback)

   Exporta `window.DB` com a mesma forma usada pelas páginas, mas
   agora todos os métodos são assíncronos (retornam Promises).

   Categorias / status:
     CATEGORIES  = ['bots']
     STATUSES    = ['pendente','aprovado','entregue','cancelado']
   ============================================================ */

(function () {
  'use strict';

  const CATEGORIES = ['bots'];
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
        period: period || 'vitalício',
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

  /* ---------------- PREVIEW SEED (offline only) ---------------- */
  // Usado apenas quando Supabase não está configurado (modo preview).
  // Bump esta versão quando mudar o seed para forçar refresh do localStorage.
  const SEED_VERSION = 'v5-launch-bots-2';
  const SEED_KEY = 'nexa.preview.seedVersion';

  function seedDemo() {
    if (isReady()) return; // produção: dados vêm do Supabase
    const existing = lsGet(LS.products);
    const currentVersion = localStorage.getItem(SEED_KEY);
    if (existing.length > 0 && currentVersion === SEED_VERSION) return;
    // Catálogo idêntico ao supabase/seed.sql — 4 bots
    const seed = [
      { id: uuid(), name: 'Bot Ticket', category: 'bots', price: 8.99, icon: 'tag',
        short_description: 'Sistema profissional de tickets multi-categoria.',
        description: 'Bot completo de tickets com transcrições automáticas em HTML, múltiplas categorias, atendentes designados, sistema de avaliação 5 estrelas e estatísticas detalhadas. Painel web de configuração.',
        features: ['Painel web de configuração','Múltiplas categorias','Transcrições em HTML','Atendentes designados','Sistema de avaliação 5 estrelas','Estatísticas em tempo real'],
        badge: 'Mais barato', recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Bot Suporte', category: 'bots', price: 11.50, icon: 'help',
        short_description: 'Bot de FAQ + atendimento automatizado 24/7.',
        description: 'Bot de suporte com base de conhecimento em IA, FAQ inteligente, encaminhamento automático para humanos e métricas de satisfação. Reduz drasticamente carga da equipe.',
        features: ['FAQ com IA local','Atendimento 24/7','Encaminhamento automático','Histórico de conversas','Métricas NPS','Comandos /faq personalizados'],
        badge: 'Recomendado', recommended: true, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Bot Moderação', category: 'bots', price: 13.50, icon: 'shield',
        short_description: 'Anti-raid + AutoMod + moderação completa.',
        description: 'Bot avançado anti-raid com captcha, AutoMod customizável, anti-spam, blacklist de palavras, raid mode automático e logs de auditoria detalhados.',
        features: ['Captcha de verificação','AutoMod customizável','Anti-spam inteligente','Blacklist de palavras','Raid mode automático','Logs de auditoria'],
        badge: 'Popular', recommended: true, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Bot VIP', category: 'bots', price: 22.50, icon: 'crown',
        short_description: 'Bot all-in-one premium: tickets + moderação + economia + level + boas-vindas.',
        description: 'Pacote completo com TODAS as funcionalidades premium: sistema de tickets, moderação anti-raid, sistema de economia, sistema de level/XP, mensagens de boas-vindas customizadas, painel admin web e suporte vitalício.',
        features: ['Tickets + Moderação + Economia','Sistema de level/XP','Boas-vindas customizadas','Painel admin web','Atualizações vitalícias','Suporte prioritário no Discord'],
        badge: 'Premium', recommended: true, active: true, created_at: nowISO() },
    ];
    lsSet(LS.products, seed);
    localStorage.setItem(SEED_KEY, SEED_VERSION);
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
