/* ============================================================
   NexaBots — Profile page
   ============================================================ */
(function (global) {
  'use strict';

  function init() {
    const user = Auth.currentUser();
    if (!user) return;
    const main = document.querySelector('.content');
    if (!main) return;

    function render() {
      const u = Auth.currentUser();
      main.innerHTML = `
        <div class="page-header">
          <div>
            <h1>Meu perfil</h1>
            <p class="subtitle">Personalize suas informações e mantenha sua conta segura.</p>
          </div>
        </div>

        <div class="profile-hero animate-in">
          <span class="avatar lg" style="${UI.avatarStyle(u.avatar)}">${UI.avatarInitials(u)}</span>
          <div class="info">
            <h2>${UI.escapeHtml(u.displayName || u.username)}</h2>
            <div class="meta">@${UI.escapeHtml(u.username)} • ${UI.escapeHtml(u.email)}</div>
            <div class="meta mt-2">
              <span class="badge ${u.role === 'admin' ? 'badge-purple' : 'badge-info'} no-dot">${u.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
              <span class="badge no-dot">Membro desde ${UI.formatDate(u.createdAt, { day:'2-digit', month:'short', year:'numeric' })}</span>
            </div>
          </div>
          <a class="btn btn-ghost" href="settings.html">${Icons.svg('settings')} Configurações</a>
        </div>

        <div class="grid" style="grid-template-columns: 1.2fr 1fr; gap:16px;">
          <div class="card animate-in">
            <div class="card-title">${Icons.svg('user')} Informações pessoais</div>
            <div class="card-subtitle">Atualize seus dados visíveis no perfil</div>
            <form id="profile-form" style="display:flex;flex-direction:column;gap:14px;margin-top:8px;">
              <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="field">
                  <label class="field-label" for="displayName">Nome de exibição</label>
                  <input class="input" id="displayName" name="displayName" value="${UI.escapeHtml(u.displayName || '')}" />
                </div>
                <div class="field">
                  <label class="field-label">Nome de usuário</label>
                  <input class="input" value="@${UI.escapeHtml(u.username)}" disabled />
                  <span class="field-hint">O nome de usuário não pode ser alterado.</span>
                </div>
              </div>
              <div class="field">
                <label class="field-label" for="email">E-mail</label>
                <div class="input-icon">
                  <span data-icon="mail"></span>
                  <input class="input" id="email" name="email" type="email" value="${UI.escapeHtml(u.email)}" />
                </div>
              </div>
              <div class="field">
                <label class="field-label" for="bio">Bio</label>
                <textarea class="input textarea" id="bio" name="bio" rows="3" placeholder="Conte um pouco sobre você...">${UI.escapeHtml(u.bio || '')}</textarea>
              </div>
              <div>
                <label class="field-label">Avatar</label>
                <div class="avatar-picker" id="avatar-picker">
                  ${Object.keys(UI.GRADIENTS).map((k) => `
                    <span class="opt ${u.avatar === k ? 'active' : ''}" data-avatar="${k}" style="background:${UI.GRADIENTS[k]}"></span>
                  `).join('')}
                </div>
              </div>
              <div class="flex gap-2">
                <button type="submit" class="btn btn-primary">${Icons.svg('check')} Salvar alterações</button>
                <button type="button" class="btn btn-ghost" data-cancel>Cancelar</button>
              </div>
            </form>
          </div>

          <div class="card animate-in" style="animation-delay:.05s">
            <div class="card-title">${Icons.svg('lock')} Segurança</div>
            <div class="card-subtitle">Altere sua senha periodicamente</div>
            <form id="password-form" style="display:flex;flex-direction:column;gap:14px;margin-top:8px;">
              <div class="field">
                <label class="field-label" for="cur-pw">Senha atual</label>
                <input class="input" id="cur-pw" type="password" required />
              </div>
              <div class="field">
                <label class="field-label" for="new-pw">Nova senha</label>
                <input class="input" id="new-pw" type="password" required minlength="6" />
                <span class="field-hint">Mínimo 6 caracteres.</span>
              </div>
              <div class="field">
                <label class="field-label" for="conf-pw">Confirmar nova senha</label>
                <input class="input" id="conf-pw" type="password" required />
              </div>
              <button type="submit" class="btn btn-primary">${Icons.svg('shield')} Atualizar senha</button>
            </form>

            <hr class="divider" />

            <div class="card-title">${Icons.svg('activity')} Atividade da conta</div>
            <div class="card-subtitle">Últimos 5 eventos da sua conta</div>
            <div class="activity-feed mt-2">
              ${Activity.listForUser(u.id, 5).map((it) => {
                const meta = Activity.getMeta(it.type);
                return `
                  <div class="activity-item ${meta.class}">
                    <span class="ico">${Icons.svg(meta.icon)}</span>
                    <div class="body">
                      <div class="msg">${UI.escapeHtml(it.message)}</div>
                      <div class="meta">${UI.timeAgo(it.timestamp)}</div>
                    </div>
                  </div>
                `;
              }).join('') || '<p class="muted" style="font-size:13px;">Nenhuma atividade ainda.</p>'}
            </div>
          </div>
        </div>
      `;
      bind();
      Icons.hydrate(main);
    }

    function bind() {
      // Avatar picker
      let chosenAvatar = (Auth.currentUser() || {}).avatar;
      main.querySelectorAll('#avatar-picker .opt').forEach((o) => {
        o.addEventListener('click', () => {
          main.querySelectorAll('#avatar-picker .opt').forEach((x) => x.classList.remove('active'));
          o.classList.add('active');
          chosenAvatar = o.dataset.avatar;
          // live preview hero
          const heroAv = main.querySelector('.profile-hero .avatar');
          if (heroAv) heroAv.style.background = UI.GRADIENTS[chosenAvatar];
        });
      });

      const profileForm = main.querySelector('#profile-form');
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
          displayName: profileForm.displayName.value.trim(),
          email: profileForm.email.value.trim(),
          bio: profileForm.bio.value.trim(),
          avatar: chosenAvatar,
        };
        const r = Auth.updateProfile(data);
        if (!r.ok) { UI.toast.error(r.error); return; }
        UI.toast.success('Perfil atualizado!');
        render();
      });
      main.querySelector('[data-cancel]').addEventListener('click', () => render());

      const pwForm = main.querySelector('#password-form');
      pwForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const r = Auth.changePassword({
          current: pwForm.querySelector('#cur-pw').value,
          next: pwForm.querySelector('#new-pw').value,
          confirm: pwForm.querySelector('#conf-pw').value,
        });
        if (!r.ok) { UI.toast.error(r.error); return; }
        UI.toast.success('Senha atualizada com sucesso.');
        pwForm.reset();
      });
    }

    render();
  }

  global.Profile = { init };
})(window);
