/* ============================================================
   Nexa Serviços V2 — Auth (Supabase + fallback localStorage demo)

   API:
     Auth.register({ username, email, password, displayName, avatar })
     Auth.login({ identifier, password })
     Auth.logout()
     Auth.currentUser()       // perfil completo (profiles row) ou null
     Auth.isAuthenticated()
     Auth.requireSession({ adminOnly })   // redireciona se não autenticado
     Auth.onChange(cb)        // cb(user|null)
   ============================================================ */
(function () {
  'use strict';

  const ADMIN_EMAIL = (window.NEXA_CONFIG?.ADMIN_EMAIL || 'devbot2026@nexaservicos.app').toLowerCase();

  const DEMO = {
    profiles: 'nexa.demo.profiles',
    session: 'nexa.demo.session',
    accounts: 'nexa.demo.accounts', // { email, username, password (sha-ish), id }
  };

  const isLive = () => !!(window.Nexa && window.Nexa.isReady());

  /* ----------- helpers ----------- */
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function nowISO() { return new Date().toISOString(); }
  function lsGet(k, fallback = []) {
    try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }
  function lsSet(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function fakeHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return String(h >>> 0);
  }

  /* ----------- listeners ----------- */
  const listeners = new Set();
  function notify(user) {
    listeners.forEach((cb) => { try { cb(user); } catch (e) { console.error(e); } });
  }
  let cachedProfile = null;

  /* ----------- profile resolver ----------- */
  function isSchemaMissingError(err) {
    if (!err) return false;
    const msg = String(err.message || err.hint || '').toLowerCase();
    return msg.includes('schema cache') || msg.includes("could not find the table") ||
      msg.includes('relation') && msg.includes('does not exist');
  }
  async function fetchProfile(authUserId) {
    if (!isLive()) return null;
    const { data, error } = await window.Nexa.client
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();
    if (error) {
      console.error('[Auth] erro ao buscar profile:', error);
      if (isSchemaMissingError(error)) {
        const e = new Error('Schema do Supabase ainda não foi aplicado. Rode supabase/schema.sql no SQL Editor antes de continuar.');
        e.code = 'schema_missing';
        throw e;
      }
      return null;
    }
    return data;
  }

  /* ----------- DEMO MODE auth (sem Supabase) ----------- */
  const demo = {
    async register({ username, email, password, displayName, avatar }) {
      username = String(username || '').trim();
      email = String(email || '').trim().toLowerCase();
      if (!username || !email || !password) throw new Error('Preencha todos os campos.');
      if (username.length < 3) throw new Error('Username deve ter ao menos 3 caracteres.');
      if (password.length < 6) throw new Error('Senha deve ter ao menos 6 caracteres.');
      const accounts = lsGet(DEMO.accounts);
      if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase()))
        { const e = new Error('Esse nome de usuário já está em uso.'); e.code = 'username_taken'; throw e; }
      if (accounts.some((a) => a.email === email))
        throw new Error('Esse e-mail já está cadastrado.');
      const id = uuid();
      accounts.push({ id, username, email, password: fakeHash(password) });
      lsSet(DEMO.accounts, accounts);
      const profile = {
        id, username, email,
        display_name: displayName || username,
        avatar: avatar || 'gradient-1',
        role: email === ADMIN_EMAIL ? 'admin' : 'user',
        created_at: nowISO(), updated_at: nowISO(),
      };
      const profiles = lsGet(DEMO.profiles);
      profiles.unshift(profile);
      lsSet(DEMO.profiles, profiles);
      lsSet(DEMO.session, { user_id: id, expires: Date.now() + 7 * 86400000 });
      cachedProfile = profile;
      notify(profile);
      return profile;
    },
    async login({ identifier, password }) {
      identifier = String(identifier || '').trim();
      password = String(password || '');
      const accounts = lsGet(DEMO.accounts);
      let acc = accounts.find((a) => a.username.toLowerCase() === identifier.toLowerCase());
      if (!acc) acc = accounts.find((a) => a.email === identifier.toLowerCase());
      if (!acc) throw new Error('Usuário ou e-mail não encontrado.');
      if (acc.password !== fakeHash(password)) throw new Error('Senha incorreta.');
      const profiles = lsGet(DEMO.profiles);
      const profile = profiles.find((p) => p.id === acc.id);
      lsSet(DEMO.session, { user_id: acc.id, expires: Date.now() + 7 * 86400000 });
      cachedProfile = profile;
      notify(profile);
      return profile;
    },
    async logout() {
      localStorage.removeItem(DEMO.session);
      cachedProfile = null;
      notify(null);
    },
    async currentUser() {
      const sess = lsGet(DEMO.session, null);
      if (!sess || !sess.user_id) return null;
      if (sess.expires && sess.expires < Date.now()) {
        localStorage.removeItem(DEMO.session);
        return null;
      }
      const profiles = lsGet(DEMO.profiles);
      const p = profiles.find((x) => x.id === sess.user_id) || null;
      cachedProfile = p;
      return p;
    },
  };

  /* ----------- LIVE MODE auth (Supabase) ----------- */
  const live = {
    async register({ username, email, password, displayName, avatar }) {
      username = String(username || '').trim();
      email = String(email || '').trim().toLowerCase();
      if (!username || !email || !password) throw new Error('Preencha todos os campos.');
      if (username.length < 3) throw new Error('Username deve ter ao menos 3 caracteres.');
      if (password.length < 6) throw new Error('Senha deve ter ao menos 6 caracteres.');
      try {
        await window.Nexa.auth.signUp({ email, password, username, displayName, avatar });
      } catch (err) {
        if (err?.code === 'schema_missing') throw err;
        if (err?.code === 'username_taken') throw err;
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('user already') || msg.includes('already registered')) {
          throw new Error('Já existe uma conta com esse e-mail.');
        }
        throw err;
      }
      // tenta login imediato (se confirmação de email não estiver exigida)
      try {
        await window.Nexa.auth.signIn({ identifier: email, password });
      } catch (err) {
        if (err?.code === 'schema_missing') throw err;
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('confirm')) {
          const e = new Error('Confirme seu e-mail antes de entrar.');
          e.code = 'email_confirmation_required';
          throw e;
        }
        throw err;
      }
      const user = await window.Nexa.auth.getUser();
      let profile = user ? await fetchProfile(user.id) : null;
      // fallback: cria o profile manualmente caso o trigger não tenha rodado
      if (user && !profile) {
        const { data, error } = await window.Nexa.client.from('profiles').insert({
          id: user.id, username, email,
          display_name: displayName || username,
          avatar: avatar || 'gradient-1',
          role: email === ADMIN_EMAIL ? 'admin' : 'user',
        }).select('*').single();
        if (error) throw error;
        profile = data;
      }
      cachedProfile = profile;
      notify(profile);
      return profile;
    },
    async login({ identifier, password }) {
      identifier = String(identifier || '').trim();
      if (!identifier || !password) throw new Error('Preencha usuário/e-mail e senha.');
      try {
        await window.Nexa.auth.signIn({ identifier, password });
      } catch (err) {
        if (err?.code === 'schema_missing') throw err;
        if (err?.code === 'user_not_found') throw new Error('Usuário não encontrado.');
        const m = (err?.message || '').toLowerCase();
        if (m.includes('invalid') || m.includes('credentials') || m.includes('senha')) {
          throw new Error('Usuário/e-mail ou senha incorretos.');
        }
        if (m.includes('email not confirmed') || m.includes('confirm')) {
          throw new Error('Confirme seu e-mail antes de entrar.');
        }
        throw err;
      }
      const user = await window.Nexa.auth.getUser();
      const profile = user ? await fetchProfile(user.id) : null;
      cachedProfile = profile;
      notify(profile);
      return profile;
    },
    async logout() {
      await window.Nexa.auth.signOut();
      cachedProfile = null;
      notify(null);
    },
    async currentUser() {
      if (cachedProfile) return cachedProfile;
      const user = await window.Nexa.auth.getUser();
      if (!user) return null;
      const profile = await fetchProfile(user.id);
      cachedProfile = profile;
      return profile;
    },
  };

  /* ----------- escolha do modo ----------- */
  const impl = () => (isLive() ? live : demo);

  /* ----------- public API ----------- */
  const Auth = {
    isLive,
    async register(args)   { return impl().register(args); },
    async login(args)      { return impl().login(args); },
    async logout()         { return impl().logout(); },
    async currentUser()    { return impl().currentUser(); },
    async isAuthenticated() { return !!(await impl().currentUser()); },
    async requireSession({ adminOnly = false } = {}) {
      const me = await impl().currentUser();
      if (!me) {
        location.replace('index.html?next=' + encodeURIComponent(location.pathname.split('/').pop()));
        return null;
      }
      if (adminOnly && me.role !== 'admin') {
        location.replace('dashboard.html');
        return null;
      }
      return me;
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    /** invalida cache (após editar profile, p.ex.) */
    invalidate() { cachedProfile = null; },
  };

  // se Supabase está pronto, escuta mudanças globais
  if (isLive()) {
    window.Nexa.auth.onChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        cachedProfile = null;
        notify(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const profile = await fetchProfile(session.user.id);
        cachedProfile = profile;
        notify(profile);
      }
    });
  }

  window.Auth = Auth;
})();
