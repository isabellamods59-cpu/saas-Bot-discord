/* ============================================================
   Nexa Serviços V2 — Data layer (Supabase first, LocalStorage fallback)

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
  // bump this version when changing the demo seed (prices, descriptions etc.) to refresh localStorage
  const SEED_VERSION = 'v3';
  const SEED_KEY = 'nexa.demo.seedVersion';

  function seedDemo() {
    if (isReady()) return; // só popula em modo demo
    const existing = lsGet(LS.products);
    const currentVersion = localStorage.getItem(SEED_KEY);
    // se já tem produtos da versão atual, não re-popula
    if (existing.length > 0 && currentVersion === SEED_VERSION) return;
    // versão antiga ou sem produtos → reset products
    const seed = [
      // mini seed para modo demo (sem Supabase). Versão completa: supabase/seed.sql
      // ===== BOTS DISCORD =====
      { id: uuid(), name: 'Nexa Tickets', category: 'bots', price: 5.99, icon: 'tag',
        short_description: 'Sistema profissional de tickets multi-categoria.',
        description: 'Bot completo de tickets com transcrições automáticas em HTML, múltiplas categorias, atendentes designados, sistema de avaliação e estatísticas.',
        features: ['Múltiplas categorias','Transcrições em HTML','Atendentes designados','Sistema de avaliação','Tags e prioridades','Painel de configuração'],
        badge: 'Mais barato', recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Nexa Levels', category: 'bots', price: 7.99, icon: 'trendingUp',
        short_description: 'Sistema de níveis e XP com cards customizados.',
        description: 'Acompanhe a progressão dos seus membros com XP por chat e voz, cards visuais customizáveis, ranking global e recompensas automáticas a cada nível.',
        features: ['XP por chat e voz','Cards customizáveis','Recompensas por nível','Ranking global','Backgrounds premium','Comandos slash'],
        badge: null, recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Nexa Economy', category: 'bots', price: 9.99, icon: 'coin',
        short_description: 'Economia virtual completa com loja, banco e jogos.',
        description: 'Sistema completo de economia virtual: daily, work, slot, loja personalizada, banco com juros, ranking global e itens negociáveis entre membros.',
        features: ['Daily / Work / Slot','Loja personalizada','Banco com juros','Ranking global','Itens negociáveis','Multi-servidor'],
        badge: null, recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Nexa Music', category: 'bots', price: 9.99, icon: 'music',
        short_description: 'Tocador de música premium com filas e equalizador.',
        description: 'Bot de música premium com suporte a Spotify, YouTube, SoundCloud e Apple Music. Equalizador 8 bandas, filtros pro DJ, letras em tempo real e qualidade lossless.',
        features: ['Spotify / YouTube / SoundCloud','Equalizador 8 bandas','Filtros pro DJ','Letras em tempo real','Hospedagem 24/7','Comandos slash'],
        badge: 'Top 1', recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Nexa Guardian', category: 'bots', price: 12.99, icon: 'shield2',
        short_description: 'Sistema completo de moderação e anti-raid.',
        description: 'Moderação inteligente com proteção anti-raid, anti-spam, captcha de verificação, AutoMod customizável, logs detalhados e banimento programado.',
        features: ['Anti-raid e anti-spam','Captcha de verificação','Logs de auditoria','AutoMod customizável','Banimento programado','Filtros de palavras'],
        badge: 'Mais vendido', recommended: true, active: true, created_at: nowISO() },
      // ===== CURSOS =====
      { id: uuid(), name: 'Curso Discord.js Avançado', category: 'cursos', price: 49.90, icon: 'book',
        short_description: 'Aprenda a criar bots profissionais do zero ao deploy.',
        description: 'Curso de 40h com Discord.js v14, slash commands, banco de dados PostgreSQL, deploy 24/7 na cloud e estratégias de monetização.',
        features: ['40h de conteúdo','Discord.js v14','Slash commands','Banco de dados','Deploy 24/7','Suporte vitalício'],
        badge: 'Lançamento', recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Curso Comunidade do Zero', category: 'cursos', price: 39.90, icon: 'users',
        short_description: 'Construa uma comunidade Discord de 10k+ membros.',
        description: 'Estratégias práticas de growth, engajamento, sistemas de eventos, parcerias com criadores e monetização da sua comunidade Discord.',
        features: ['Estratégias de growth','Sistema de eventos','Parcerias e mídia','Monetização','Templates prontos','Suporte vitalício'],
        badge: null, recommended: false, active: true, created_at: nowISO() },
      // ===== JOGOS =====
      { id: uuid(), name: 'Conta Roblox Premium', category: 'jogos', price: 29.90, icon: 'gamepad',
        short_description: 'Conta Roblox verificada com 1000+ Robux e badges raras.',
        description: 'Conta verificada com 1000 Robux, vários jogos pagos já comprados, badges colecionáveis raras e e-mail original.',
        features: ['1000+ Robux','Badges raras','Jogos pagos inclusos','E-mail original','Garantia 30 dias','Suporte rápido'],
        badge: null, recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Steam Wallet R$ 50', category: 'jogos', price: 39.90, icon: 'gift',
        short_description: 'Crédito Steam de R$ 50 — entrega digital.',
        description: 'Gift code da Steam Wallet de R$ 50, entregue em até 24h após confirmação do pagamento. Resgate imediato na sua conta.',
        features: ['Crédito de R$ 50,00','Entrega digital','Resgate imediato','Suporte rápido','Garantia oficial'],
        badge: null, recommended: false, active: true, created_at: nowISO() },
      // ===== NITRO =====
      { id: uuid(), name: 'Nitro Basic 1 Mês', category: 'nitro', price: 7.99, icon: 'zap',
        short_description: 'Nitro Basic mensal — perks essenciais.',
        description: 'Nitro Basic com upload de 50MB, emojis cross-server, perfil customizado e streams melhoradas. Ativação em até 1h.',
        features: ['Upload de 50MB','Emojis cross-server','Perfil customizado','Streams melhoradas','Ativação em 1h'],
        badge: null, recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Discord Nitro 1 Mês', category: 'nitro', price: 14.99, icon: 'sparkle',
        short_description: 'Discord Nitro Full por 1 mês.',
        description: 'Nitro Full mensal com perks completos: emojis cross-server, upload 500MB, streams em HD, 2 server boosts grátis e perfil personalizado.',
        features: ['Emojis cross-server','Upload de 500MB','Streams em HD','2 boosts inclusos','Perfil personalizado','Custom tags'],
        badge: null, recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Discord Nitro 1 Ano', category: 'nitro', price: 89.90, icon: 'crown',
        short_description: 'Nitro Full por 12 meses — economia de 50%.',
        description: 'Nitro Full por um ano inteiro. Economia de 50% comparado ao mensal. Perks completos + 24 boosts inclusos.',
        features: ['12 meses Nitro Full','Economia de 50%','24 boosts inclusos','Suporte prioritário','Garantia oficial'],
        badge: 'Melhor oferta', recommended: true, active: true, created_at: nowISO() },
      // ===== LOJAS PRONTAS =====
      { id: uuid(), name: 'Loja Lite', category: 'lojas', price: 39.90, icon: 'shoppingBag',
        short_description: 'Site simples e funcional para vender no Discord.',
        description: 'Site one-page integrado ao Discord com checkout pronto e abertura de ticket automática para entrega manual.',
        features: ['Site one-page','Integração Discord','Checkout pronto','Suporte via ticket','Setup em 24h'],
        badge: null, recommended: false, active: true, created_at: nowISO() },
      { id: uuid(), name: 'Loja Discord Premium', category: 'lojas', price: 79.90, icon: 'store',
        short_description: 'Servidor Discord completo de loja, pronto pra vender.',
        description: 'Servidor Discord pré-configurado com sistema de tickets, painel de produtos, bots integrados, templates de mensagens e treinamento incluso.',
        features: ['Servidor estruturado','Sistema de tickets','Bots integrados','Templates prontos','Treinamento incluso','Suporte 30 dias'],
        badge: 'Pacote completo', recommended: true, active: true, created_at: nowISO() },
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
