/* ============================================================
   NexaBots — Settings page
   ============================================================ */
(function (global) {
  'use strict';

  function init() {
    const user = Auth.currentUser();
    if (!user) return;
    const main = document.querySelector('.content');
    if (!main) return;

    function render() {
      const s = DB.meta.getSettings();
      main.innerHTML = `
        <div class="page-header">
          <div>
            <h1>Configurações</h1>
            <p class="subtitle">Personalize a sua experiência no NexaBots.</p>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr; gap:16px;">
          <div class="card animate-in">
            <div class="card-title">${Icons.svg('sun')} Aparência</div>
            <div class="card-subtitle">Escolha como você prefere visualizar a interface</div>
            <div class="setting-row">
              <div>
                <div class="label">Tema escuro</div>
                <div class="desc">Use o modo escuro para reduzir o cansaço visual.</div>
              </div>
              <div class="switch ${s.theme === 'dark' ? 'on' : ''}" data-toggle="theme"></div>
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Sidebar recolhida</div>
                <div class="desc">Inicie sempre com a sidebar minimizada (mais espaço).</div>
              </div>
              <div class="switch ${s.sidebarCollapsed ? 'on' : ''}" data-toggle="sidebar"></div>
            </div>
          </div>

          <div class="card animate-in" style="animation-delay:.05s">
            <div class="card-title">${Icons.svg('bell')} Notificações</div>
            <div class="card-subtitle">Quando você quer ser avisado(a)</div>
            <div class="setting-row">
              <div>
                <div class="label">Notificações in-app</div>
                <div class="desc">Receba avisos sobre atualizações de pedidos.</div>
              </div>
              <div class="switch ${s.notifications ? 'on' : ''}" data-toggle="notifications"></div>
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Som ao receber notificações</div>
                <div class="desc">Toque um som curto a cada novo aviso.</div>
              </div>
              <div class="switch ${s.sound ? 'on' : ''}" data-toggle="sound"></div>
            </div>
          </div>

          <div class="card animate-in" style="animation-delay:.1s">
            <div class="card-title">${Icons.svg('globe')} Idioma e região</div>
            <div class="card-subtitle">A interface é exibida no idioma selecionado</div>
            <div class="setting-row">
              <div>
                <div class="label">Idioma</div>
                <div class="desc">Atualmente disponível em Português (Brasil).</div>
              </div>
              <select class="select" style="max-width:200px;" disabled>
                <option>Português (Brasil)</option>
              </select>
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Moeda</div>
                <div class="desc">Os preços são exibidos em Real brasileiro.</div>
              </div>
              <select class="select" style="max-width:200px;" disabled>
                <option>BRL — Real (R$)</option>
              </select>
            </div>
          </div>

          <div class="card animate-in" style="animation-delay:.15s">
            <div class="card-title">${Icons.svg('terminal')} Dados e privacidade</div>
            <div class="card-subtitle">Exporte ou apague seus dados locais</div>
            <div class="setting-row">
              <div>
                <div class="label">Exportar meus dados</div>
                <div class="desc">Baixe um arquivo JSON com tudo o que está salvo localmente.</div>
              </div>
              <button class="btn btn-ghost" data-action="export-data">${Icons.svg('upload')} Exportar</button>
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Limpar minha atividade</div>
                <div class="desc">Apaga o histórico de atividade da sua conta.</div>
              </div>
              <button class="btn btn-danger" data-action="clear-activity">${Icons.svg('trash')} Limpar</button>
            </div>
            <div class="setting-row">
              <div>
                <div class="label">Resetar dados de demonstração</div>
                <div class="desc">Apaga TODAS as contas, pedidos, planos e bots locais. Use com cuidado.</div>
              </div>
              <button class="btn btn-danger" data-action="nuke">${Icons.svg('refresh')} Resetar tudo</button>
            </div>
          </div>
        </div>
      `;
      bind();
      Icons.hydrate(main);
    }

    function bind() {
      main.querySelectorAll('[data-toggle]').forEach((sw) => {
        sw.addEventListener('click', () => {
          const key = sw.dataset.toggle;
          const s = DB.meta.getSettings();
          if (key === 'theme') {
            UI.toggleTheme();
          } else if (key === 'sidebar') {
            const newCollapsed = !s.sidebarCollapsed;
            UI.applySidebar(newCollapsed);
          } else {
            s[key] = !s[key];
            DB.meta.setSettings(s);
          }
          UI.toast.success('Configuração atualizada.');
          render();
        });
      });

      main.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        if (action === 'export-data') {
          const blob = new Blob([DB.exportAll()], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'nexabots-backup-' + new Date().toISOString().slice(0, 10) + '.json';
          a.click();
          URL.revokeObjectURL(url);
          UI.toast.success('Backup gerado!');
        } else if (action === 'clear-activity') {
          UI.confirm({
            title: 'Limpar atividade',
            message: 'Apagar todo o histórico da sua conta? Essa ação não pode ser desfeita.',
            danger: true,
          }).then((ok) => {
            if (!ok) return;
            Activity.clearForUser(user.id);
            UI.toast.success('Histórico apagado.');
            render();
          });
        } else if (action === 'nuke') {
          UI.confirm({
            title: 'Resetar TODOS os dados',
            message: 'Tem certeza? Essa ação apaga todas as contas e pedidos locais. Você precisará criar uma nova conta.',
            confirmText: 'Apagar tudo',
            danger: true,
          }).then((ok) => {
            if (!ok) return;
            DB.nuke();
            UI.toast.warn('Dados apagados. Redirecionando...');
            setTimeout(() => window.location.replace('index.html'), 800);
          });
        }
      });
    }

    render();
  }

  global.Settings = { init };
})(window);
