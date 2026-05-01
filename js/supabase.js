/* ============================================================
   NexaBots V2 — Supabase wrapper (window.Nexa)

   Carregamento esperado:
     <script src="js/config.js"></script>
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
     <script src="js/supabase.js"></script>

   Este arquivo expõe `window.Nexa` com:
     - Nexa.ready          : Promise resolvida quando cliente está pronto
     - Nexa.isReady()      : boolean (config presente E SDK carregado)
     - Nexa.client         : referência crua ao supabase-js client
     - Nexa.auth.*         : wrappers de autenticação (Promise-based)
     - Nexa.db.<table>.*   : CRUD por tabela (Promise-based)

   Quando as chaves do Supabase não estão configuradas (config.js vazio),
   `Nexa.isReady()` retorna false e `data.js` cai no modo demonstração
   usando LocalStorage.
   ============================================================ */

(function () {
  'use strict';

  const cfg = (window.NEXA_CONFIG || {});
  const URL = (cfg.SUPABASE_URL || '').trim();
  const KEY = (cfg.SUPABASE_ANON_KEY || '').trim();

  let client = null;
  let ready = false;

  if (URL && KEY && window.supabase && window.supabase.createClient) {
    try {
      client = window.supabase.createClient(URL, KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: 'nexabots.supabase.auth',
        },
      });
      ready = true;
    } catch (err) {
      console.error('[Nexa] Falha ao inicializar Supabase:', err);
      client = null;
      ready = false;
    }
  }

  /* -------------------- AUTH WRAPPER -------------------- */
  const auth = {
    async signUp({ email, password, username, displayName, avatar }) {
      if (!ready) throw new Error('Supabase não configurado.');
      // 1) checa se username está disponível
      const { data: avail, error: rpcErr } = await client
        .rpc('username_available', { p_username: username });
      if (rpcErr) throw rpcErr;
      if (avail === false) {
        const e = new Error('Esse nome de usuário já está em uso.');
        e.code = 'username_taken';
        throw e;
      }
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName || username,
            avatar: avatar || 'gradient-1',
          },
        },
      });
      if (error) throw error;
      return data;
    },

    async signIn({ identifier, password }) {
      if (!ready) throw new Error('Supabase não configurado.');
      // identifier pode ser email ou username
      let email = identifier;
      if (!identifier.includes('@')) {
        // resolve username -> email pela tabela profiles
        const { data, error } = await client
          .from('profiles')
          .select('email')
          .ilike('username', identifier)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          const e = new Error('Usuário não encontrado.');
          e.code = 'user_not_found';
          throw e;
        }
        email = data.email;
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signOut() {
      if (!ready) return;
      await client.auth.signOut();
    },

    async getSession() {
      if (!ready) return null;
      const { data } = await client.auth.getSession();
      return data?.session || null;
    },

    async getUser() {
      if (!ready) return null;
      const { data } = await client.auth.getUser();
      return data?.user || null;
    },

    onChange(callback) {
      if (!ready) return () => {};
      const { data: sub } = client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return () => sub?.subscription?.unsubscribe?.();
    },

    async updatePassword(newPassword) {
      if (!ready) throw new Error('Supabase não configurado.');
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
  };

  /* -------------------- TABLE FACTORY -------------------- */
  function tableApi(tableName, opts = {}) {
    const orderCol = opts.orderBy || 'created_at';
    const orderAsc = opts.orderAsc === true;
    return {
      async list(filter = {}, options = {}) {
        if (!ready) throw new Error('Supabase não configurado.');
        let q = client.from(tableName).select(options.select || '*');
        Object.entries(filter || {}).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          if (Array.isArray(v)) q = q.in(k, v);
          else q = q.eq(k, v);
        });
        if (options.search && options.searchColumns) {
          // simple OR ilike search across given columns
          const expr = options.searchColumns
            .map((c) => `${c}.ilike.%${options.search}%`)
            .join(',');
          q = q.or(expr);
        }
        if (options.limit) q = q.limit(options.limit);
        const ord = options.orderBy || orderCol;
        if (ord) q = q.order(ord, { ascending: options.orderAsc ?? orderAsc });
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
      },
      async get(id) {
        if (!ready) throw new Error('Supabase não configurado.');
        const { data, error } = await client
          .from(tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async create(payload) {
        if (!ready) throw new Error('Supabase não configurado.');
        const { data, error } = await client
          .from(tableName)
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      },
      async update(id, patch) {
        if (!ready) throw new Error('Supabase não configurado.');
        const { data, error } = await client
          .from(tableName)
          .update(patch)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      },
      async remove(id) {
        if (!ready) throw new Error('Supabase não configurado.');
        const { error } = await client.from(tableName).delete().eq('id', id);
        if (error) throw error;
      },
      async count(filter = {}) {
        if (!ready) throw new Error('Supabase não configurado.');
        let q = client.from(tableName).select('id', { count: 'exact', head: true });
        Object.entries(filter || {}).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          if (Array.isArray(v)) q = q.in(k, v);
          else q = q.eq(k, v);
        });
        const { count, error } = await q;
        if (error) throw error;
        return count || 0;
      },
      subscribe(events, callback) {
        if (!ready) return () => {};
        const channel = client
          .channel(`tbl-${tableName}-${Math.random().toString(36).slice(2, 8)}`)
          .on('postgres_changes',
            { event: events || '*', schema: 'public', table: tableName },
            (payload) => callback(payload)
          )
          .subscribe();
        return () => client.removeChannel(channel);
      },
    };
  }

  /* -------------------- DB WRAPPER -------------------- */
  const db = {
    profiles: tableApi('profiles', { orderBy: 'created_at', orderAsc: false }),
    products: tableApi('products', { orderBy: 'created_at', orderAsc: false }),
    purchases: tableApi('purchases', { orderBy: 'created_at', orderAsc: false }),
    activity: tableApi('activity_logs', { orderBy: 'created_at', orderAsc: false }),
    notifications: tableApi('notifications', { orderBy: 'created_at', orderAsc: false }),
  };

  /* -------------------- HEALTH CHECK -------------------- */
  async function healthCheck() {
    if (!ready) return { ok: false, reason: 'config_missing' };
    try {
      const { error } = await client.from('products').select('id').limit(1);
      if (error) {
        return { ok: false, reason: 'schema_missing', error };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: 'unreachable', error: err };
    }
  }

  /* -------------------- EXPORT -------------------- */
  window.Nexa = {
    client,
    isReady: () => ready,
    auth,
    db,
    healthCheck,
    config: cfg,
    /** Promise resolvida assim que o objeto é construído. */
    ready: Promise.resolve(),
  };
})();
