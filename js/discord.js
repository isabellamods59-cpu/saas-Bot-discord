/* ============================================================
   NexaBots V2 — Suporte Discord
   ============================================================ */
(function (global) {
  'use strict';
  const DiscordPage = {
    async init(ctx) {
      if (!ctx) return;
      const { content } = ctx;
      const invite = (window.NEXA_CONFIG?.DISCORD_INVITE) || 'https://discord.gg/nexabots';

      content.innerHTML = `
        <div class="discord-hero">
          <div class="discord-hero-bg"></div>
          <div class="discord-hero-content">
            <span class="badge badge-soft" style="margin-bottom:10px;">${Icons.svg('discord')} Suporte oficial NexaBots</span>
            <h1>Pagamento e suporte 100% manuais via Discord</h1>
            <p>Para comprar, ativar produtos ou tirar dúvidas, abra um ticket no nosso servidor. Nosso time atende rapidinho. ⚡</p>
            <div class="actions">
              <a href="${invite}" target="_blank" class="btn btn-primary btn-lg">${Icons.svg('discord')} Entrar no Discord</a>
              <button class="btn btn-ghost btn-lg" id="copy-invite">${Icons.svg('copy')} Copiar link</button>
            </div>
          </div>
        </div>

        <div class="grid grid-3 mt-6">
          <div class="card step">
            <span class="step-num">1</span>
            <h3>Crie um pedido</h3>
            <p class="muted">Vá ao marketplace, escolha o produto e clique em "Comprar". O pedido fica como pendente.</p>
            <a class="btn btn-ghost btn-sm mt-2" href="store.html">${Icons.svg('store')} Marketplace</a>
          </div>
          <div class="card step">
            <span class="step-num">2</span>
            <h3>Abra um ticket</h3>
            <p class="muted">No Discord, vá ao canal #abrir-ticket e descreva seu pedido. Time NexaBots responde em minutos.</p>
            <a class="btn btn-ghost btn-sm mt-2" href="${invite}" target="_blank">${Icons.svg('arrowUpRight')} Abrir Discord</a>
          </div>
          <div class="card step">
            <span class="step-num">3</span>
            <h3>Receba seu produto</h3>
            <p class="muted">Após confirmação do pagamento, seu pedido é aprovado e em seguida marcado como entregue.</p>
            <a class="btn btn-ghost btn-sm mt-2" href="purchases.html">${Icons.svg('purchases')} Minhas compras</a>
          </div>
        </div>

        <div class="card mt-6">
          <div class="card-header"><h3>Perguntas frequentes</h3></div>
          <details class="faq" open>
            <summary>Por que pagamento manual?</summary>
            <p>Garantimos atendimento humanizado, sem fricção de checkout, sem taxas extras e com flexibilidade de PIX, transferência ou criptomoedas.</p>
          </details>
          <details class="faq">
            <summary>Quanto tempo demora a liberação?</summary>
            <p>Após confirmação do pagamento, a maioria dos pedidos é entregue em até 30 minutos. Bots e cursos podem ser ativados na hora.</p>
          </details>
          <details class="faq">
            <summary>Posso pedir reembolso?</summary>
            <p>Reembolsos seguem nossa política — até 7 dias para produtos digitais não consumidos. Abra um ticket explicando o caso.</p>
          </details>
        </div>
      `;
      Icons.hydrate(content);

      content.querySelector('#copy-invite').addEventListener('click', () => UI.copy(invite));
    },
  };
  global.DiscordPage = DiscordPage;
})(window);
