/* ============================================================
   Nexa Serviços V2 — Configurações
   ============================================================ */
(function (global) {
  'use strict';
  const Settings = {
    async init(ctx) {
      if (!ctx) return;
      const { content, user } = ctx;

      content.innerHTML = `
        <div class="page-head">
          <div>
            <h1 class="page-title">Configurações</h1>
            <p class="page-sub">Ajuste tema, preferências e gerencie seus dados.</p>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-header"><h3>Aparência</h3></div>
            <div class="setting-row">
              <div>
                <div class="label">Tema</div>
                <div class="desc">Escuro (recomendado) ou claro.</div>
              </div>
              <div class="seg" id="theme-seg">
                <button data-theme="dark" class="seg-btn">${Icons.svg('moon')} Escuro</button>
                <button data-theme="light" class="seg-btn">${Icons.svg('sun')} Claro</button>
              </div>
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Sidebar</div>
                <div class="desc">Comportamento padrão da barra lateral.</div>
              </div>
              <div class="seg" id="sidebar-seg">
                <button data-sb="false" class="seg-btn">Expandida</button>
                <button data-sb="true" class="seg-btn">Recolhida</button>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>Notificações</h3></div>
            <div class="setting-row">
              <div>
                <div class="label">Notificações no app</div>
                <div class="desc">Receber alertas em tempo real.</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="opt-notif" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Sons</div>
                <div class="desc">Efeitos sonoros suaves.</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="opt-sound" />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="card span-2">
            <div class="card-header"><h3>Backend</h3></div>
            <div class="setting-row">
              <div>
                <div class="label">Modo</div>
                <div class="desc">${window.Nexa?.isReady() ? 'Conectado ao Supabase. Seus dados são persistidos no servidor.' : 'Modo preview — dados só ficam no navegador.'}</div>
              </div>
              ${window.Nexa?.isReady()
                ? '<span class="env-pill env-live"><span class="dot"></span> Live</span>'
                : '<span class="env-pill env-preview"><span class="dot"></span> Preview</span>'}
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Limpar dados locais</div>
                <div class="desc">Apaga preferências e cache local. Não afeta dados do servidor.</div>
              </div>
              <button class="btn btn-danger btn-sm" id="clear-local">${Icons.svg('trash')} Limpar local</button>
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Encerrar sessão</div>
                <div class="desc">Faz logout em todas as abas deste navegador.</div>
              </div>
              <button class="btn btn-ghost btn-sm" id="logout-btn">${Icons.svg('logout')} Sair</button>
            </div>
          </div>
        </div>
      `;
      Icons.hydrate(content);

      const prefs = UI.getPrefs();
      const themeSeg = content.querySelector('#theme-seg');
      themeSeg.querySelectorAll('[data-theme]').forEach((b) => {
        b.classList.toggle('active', b.dataset.theme === (prefs.theme || 'dark'));
        b.addEventListener('click', () => {
          UI.applyTheme(b.dataset.theme);
          themeSeg.querySelectorAll('[data-theme]').forEach((x) => x.classList.toggle('active', x === b));
          UI.toast.success('Tema atualizado.');
        });
      });
      const sbSeg = content.querySelector('#sidebar-seg');
      sbSeg.querySelectorAll('[data-sb]').forEach((b) => {
        const isCollapsed = b.dataset.sb === 'true';
        b.classList.toggle('active', isCollapsed === !!prefs.sidebarCollapsed);
        b.addEventListener('click', () => {
          UI.applySidebar(isCollapsed);
          sbSeg.querySelectorAll('[data-sb]').forEach((x) => x.classList.toggle('active', x === b));
          UI.toast.success('Preferência salva.');
        });
      });
      const optN = content.querySelector('#opt-notif');
      optN.checked = prefs.inAppNotifications !== false;
      optN.addEventListener('change', () => UI.setPrefs({ inAppNotifications: optN.checked }));
      const optS = content.querySelector('#opt-sound');
      optS.checked = prefs.sound !== false;
      optS.addEventListener('change', () => UI.setPrefs({ sound: optS.checked }));

      content.querySelector('#clear-local').addEventListener('click', async () => {
        const ok = await UI.confirm({ title: 'Limpar dados locais', message: 'Isso apaga apenas dados deste navegador (preferências, cache demo). Continuar?', danger: true });
        if (!ok) return;
        Object.keys(localStorage).filter((k) => k.startsWith('nexa.')).forEach((k) => localStorage.removeItem(k));
        UI.toast.success('Dados locais apagados. Recarregando...');
        setTimeout(() => location.reload(), 700);
      });
      content.querySelector('#logout-btn').addEventListener('click', async () => {
        await Auth.logout();
        location.replace('index.html');
      });
    },
  };
  global.Settings = Settings;
})(window);
