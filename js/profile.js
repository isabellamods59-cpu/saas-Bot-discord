/* ============================================================
   Nexa Serviços V2 — Perfil do usuário
   ============================================================ */
(function (global) {
  'use strict';

  const Profile = {
    async init(ctx) {
      if (!ctx) return;
      const { content, user } = ctx;
      if (!user) return;

      content.innerHTML = `
        <div class="page-head">
          <div>
            <h1 class="page-title">Meu perfil</h1>
            <p class="page-sub">Atualize seus dados, escolha um avatar e gerencie sua segurança.</p>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-header"><h3>Dados pessoais</h3></div>
            <form id="profile-form">
              <div class="profile-head">
                ${UI.renderAvatar(user, 'lg')}
                <div>
                  <div style="font-size:18px;font-weight:700;">${UI.escapeHtml(user.display_name || user.username)}</div>
                  <div class="muted">@${UI.escapeHtml(user.username)} • ${UI.escapeHtml(user.email || '—')}</div>
                </div>
              </div>
              <div class="form-row">
                <div class="field">
                  <label class="field-label">Nome de exibição</label>
                  <input class="input" name="display_name" value="${UI.escapeHtml(user.display_name || '')}" />
                </div>
                <div class="field">
                  <label class="field-label">Usuário</label>
                  <input class="input" value="${UI.escapeHtml(user.username)}" disabled />
                  <span class="field-hint">Não é possível alterar.</span>
                </div>
              </div>
              <div class="field">
                <label class="field-label">E-mail</label>
                <input class="input" value="${UI.escapeHtml(user.email || '')}" disabled />
                <span class="field-hint">Para alterar o e-mail, abra um ticket.</span>
              </div>
              <div class="field">
                <label class="field-label">Bio</label>
                <textarea class="input" name="bio" rows="3" placeholder="Conte algo sobre você...">${UI.escapeHtml(user.bio || '')}</textarea>
              </div>
              <div class="form-actions" style="display:flex;gap:8px;margin-top:8px;">
                <button class="btn btn-primary" type="submit">${Icons.svg('check')} Salvar alterações</button>
              </div>
            </form>
          </div>

          <div class="card">
            <div class="card-header"><h3>Avatar</h3></div>
            <p class="muted" style="font-size:13px;margin-bottom:8px;">Escolha um gradiente como sua foto.</p>
            <div class="avatar-picker" id="avatar-picker">
              ${Object.keys(UI.GRADIENTS).map((g) => `
                <span class="opt ${user.avatar === g ? 'active' : ''}" data-avatar="${g}" style="${UI.avatarStyle(g)}"></span>
              `).join('')}
            </div>

            <div class="card-header" style="margin-top:24px;"><h3>Senha</h3></div>
            <form id="password-form">
              <div class="field">
                <label class="field-label">Nova senha</label>
                <input class="input" name="password" type="password" minlength="6" placeholder="Mínimo 6 caracteres" />
              </div>
              <div class="field">
                <label class="field-label">Confirmar nova senha</label>
                <input class="input" name="confirm" type="password" minlength="6" />
              </div>
              <button class="btn btn-primary" type="submit">${Icons.svg('lock')} Atualizar senha</button>
              <p class="muted" style="font-size:12px;margin-top:8px;">${window.Nexa?.isReady() ? 'Atualizado de forma segura via Supabase Auth.' : 'No modo demo, senhas ficam apenas no navegador.'}</p>
            </form>
          </div>
        </div>
      `;
      Icons.hydrate(content);

      content.querySelector('#profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const patch = {
          display_name: form.display_name.value.trim() || user.username,
          bio: form.bio.value.trim() || null,
        };
        try {
          await DB.profiles.update(user.id, patch);
          Auth.invalidate();
          await Activity.record({ userId: user.id, type: 'profile_updated', message: 'Perfil atualizado.' });
          UI.toast.success('Perfil atualizado!');
          setTimeout(() => location.reload(), 700);
        } catch (err) {
          console.error(err);
          UI.toast.error(err?.message || 'Não foi possível atualizar.');
        }
      });

      content.querySelectorAll('[data-avatar]').forEach((opt) => {
        opt.addEventListener('click', async () => {
          const av = opt.dataset.avatar;
          try {
            await DB.profiles.update(user.id, { avatar: av });
            Auth.invalidate();
            content.querySelectorAll('[data-avatar]').forEach((o) => o.classList.toggle('active', o === opt));
            UI.toast.success('Avatar atualizado.');
            setTimeout(() => location.reload(), 600);
          } catch (err) {
            console.error(err);
            UI.toast.error('Não foi possível atualizar o avatar.');
          }
        });
      });

      content.querySelector('#password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const pw = form.password.value;
        const cf = form.confirm.value;
        if (!pw || pw.length < 6) { UI.toast.warn('A senha precisa ter pelo menos 6 caracteres.'); return; }
        if (pw !== cf) { UI.toast.warn('As senhas não coincidem.'); return; }
        try {
          if (window.Nexa?.isReady()) {
            await window.Nexa.auth.updatePassword(pw);
          } else {
            // demo mode: atualiza accounts
            const accounts = JSON.parse(localStorage.getItem('nexa.demo.accounts') || '[]');
            const i = accounts.findIndex((a) => a.id === user.id);
            if (i >= 0) {
              function fakeHash(str){let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h)+str.charCodeAt(i);return String(h>>>0);}
              accounts[i].password = fakeHash(pw);
              localStorage.setItem('nexa.demo.accounts', JSON.stringify(accounts));
            }
          }
          await Activity.record({ userId: user.id, type: 'password_updated', message: 'Senha atualizada.' });
          UI.toast.success('Senha atualizada!');
          form.reset();
        } catch (err) {
          console.error(err);
          UI.toast.error(err?.message || 'Não foi possível atualizar a senha.');
        }
      });
    },
  };
  global.Profile = Profile;
})(window);
