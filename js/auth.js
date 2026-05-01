/* ============================================================
   NexaBots — Authentication
   - Username unique
   - Login / Register / Logout
   - Session persistence in LocalStorage
   ============================================================ */
(function (global) {
  'use strict';

  const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

  function normalizeUsername(u) {
    return (u || '').trim().toLowerCase().replace(/\s+/g, '');
  }
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  }
  function isValidUsername(u) {
    return /^[a-z0-9_]{3,20}$/.test(u || '');
  }

  function findByUsername(username) {
    const n = normalizeUsername(username);
    return DB.users.find((u) => u.username === n);
  }
  function findByEmail(email) {
    const e = (email || '').trim().toLowerCase();
    return DB.users.find((u) => (u.email || '').toLowerCase() === e);
  }

  function register({ username, email, password, confirmPassword, displayName }) {
    const errors = {};
    const uname = normalizeUsername(username);
    const mail = (email || '').trim().toLowerCase();

    if (!uname) errors.username = 'Informe um nome de usuário.';
    else if (!isValidUsername(uname)) errors.username = 'Use 3 a 20 caracteres (letras, números, _).';

    if (!mail) errors.email = 'Informe um e-mail.';
    else if (!isValidEmail(mail)) errors.email = 'E-mail inválido.';

    if (!password || password.length < 6) errors.password = 'A senha precisa ter pelo menos 6 caracteres.';
    if (password !== confirmPassword) errors.confirmPassword = 'As senhas não coincidem.';

    if (uname && findByUsername(uname)) errors.username = 'Este nome de usuário já está em uso.';
    if (mail && findByEmail(mail)) errors.email = 'Este e-mail já está cadastrado.';

    if (Object.keys(errors).length) return { ok: false, errors };

    const user = DB.users.insert({
      username: uname,
      email: mail,
      password: Seed.hashPassword(password),
      role: 'user',
      avatar: 'gradient-' + ((Math.floor(Math.random() * 6)) + 1),
      displayName: (displayName || username || uname).trim(),
      bio: '',
    });
    Activity.log({ userId: user.id, type: 'auth', message: 'Conta criada com sucesso.' });
    return { ok: true, user };
  }

  function login({ identifier, password }) {
    const id = (identifier || '').trim();
    if (!id || !password) {
      return { ok: false, error: 'Preencha usuário/e-mail e senha.' };
    }
    const isMail = id.includes('@');
    const user = isMail ? findByEmail(id) : findByUsername(id);
    if (!user) return { ok: false, error: 'Usuário não encontrado.' };
    if (user.password !== Seed.hashPassword(password)) {
      return { ok: false, error: 'Senha incorreta.' };
    }
    const session = {
      userId: user.id,
      token: DB.uid('tok'),
      issuedAt: DB.nowISO(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
    DB.meta.setSession(session);
    Activity.log({ userId: user.id, type: 'auth', message: 'Login realizado.' });
    return { ok: true, user, session };
  }

  function logout() {
    const u = currentUser();
    if (u) Activity.log({ userId: u.id, type: 'auth', message: 'Sessão encerrada.' });
    DB.meta.clearSession();
  }

  function currentUser() {
    const session = DB.meta.getSession();
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      DB.meta.clearSession();
      return null;
    }
    return DB.users.get(session.userId) || null;
  }

  function isAuthenticated() { return !!currentUser(); }
  function isAdmin() {
    const u = currentUser();
    return !!(u && u.role === 'admin');
  }

  /** Update user profile fields (excluding password). */
  function updateProfile(patch) {
    const u = currentUser();
    if (!u) return { ok: false, error: 'Sessão expirada.' };
    const allowed = ['displayName', 'email', 'avatar', 'bio'];
    const safePatch = {};
    allowed.forEach((k) => { if (patch[k] !== undefined) safePatch[k] = patch[k]; });
    if (safePatch.email) {
      const mail = safePatch.email.trim().toLowerCase();
      if (!isValidEmail(mail)) return { ok: false, error: 'E-mail inválido.' };
      const other = findByEmail(mail);
      if (other && other.id !== u.id) return { ok: false, error: 'Este e-mail já está em uso.' };
      safePatch.email = mail;
    }
    const updated = DB.users.update(u.id, safePatch);
    Activity.log({ userId: u.id, type: 'profile', message: 'Perfil atualizado.' });
    return { ok: true, user: updated };
  }

  function changePassword({ current, next, confirm }) {
    const u = currentUser();
    if (!u) return { ok: false, error: 'Sessão expirada.' };
    if (u.password !== Seed.hashPassword(current || '')) return { ok: false, error: 'Senha atual incorreta.' };
    if (!next || next.length < 6) return { ok: false, error: 'A nova senha precisa ter pelo menos 6 caracteres.' };
    if (next !== confirm) return { ok: false, error: 'As novas senhas não coincidem.' };
    DB.users.update(u.id, { password: Seed.hashPassword(next) });
    Activity.log({ userId: u.id, type: 'security', message: 'Senha alterada.' });
    return { ok: true };
  }

  global.Auth = {
    register,
    login,
    logout,
    currentUser,
    isAuthenticated,
    isAdmin,
    updateProfile,
    changePassword,
    isValidEmail,
    isValidUsername,
    normalizeUsername,
  };
})(window);
