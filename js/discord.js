/* ============================================================
   NexaBots — Discord support / Ticket page
   ============================================================ */
(function (global) {
  'use strict';

  const DISCORD_INVITE = 'https://discord.gg/nexabots';

  function init() {
    const main = document.querySelector('.content');
    if (!main) return;

    main.innerHTML = `
      <section class="discord-hero">
        <span class="icon-circle">${Icons.svg('discord')}</span>
        <h1>Suporte oficial NexaBots</h1>
        <p>Aqui você fala diretamente com nossa equipe. Pagamentos, dúvidas técnicas, configurações personalizadas — tudo é resolvido via tickets no nosso servidor do Discord.</p>
        <a href="${DISCORD_INVITE}" target="_blank" rel="noopener" class="btn-discord">
          ${Icons.svg('discord')} Entrar no servidor Discord
        </a>
        <div style="margin-top:14px;font-size:13px;color:var(--text-3);">Atendimento humano • 24 horas por dia, 7 dias por semana</div>
      </section>

      <h2 class="section-title mt-6">${Icons.svg('book')} Como abrir um ticket</h2>
      <div class="steps">
        <div class="step animate-in" style="animation-delay:.05s">
          <span class="step-num">1</span>
          <div class="step-title">Entre no servidor</div>
          <div class="step-desc">Clique no botão acima para entrar no nosso servidor oficial do Discord.</div>
        </div>
        <div class="step animate-in" style="animation-delay:.1s">
          <span class="step-num">2</span>
          <div class="step-title">Vá ao canal #abrir-ticket</div>
          <div class="step-desc">Procure o canal <span class="code">#abrir-ticket</span> na lista de canais.</div>
        </div>
        <div class="step animate-in" style="animation-delay:.15s">
          <span class="step-num">3</span>
          <div class="step-title">Clique em "Abrir ticket"</div>
          <div class="step-desc">Selecione a categoria <strong>Pagamento</strong> ou <strong>Suporte</strong> e descreva sua solicitação.</div>
        </div>
        <div class="step animate-in" style="animation-delay:.2s">
          <span class="step-num">4</span>
          <div class="step-title">Aguarde o atendimento</div>
          <div class="step-desc">Nossa equipe responde em poucos minutos com instruções de pagamento e ativação.</div>
        </div>
      </div>

      <div class="grid mt-6" style="grid-template-columns: 1.2fr 1fr; gap:16px;">
        <div class="card">
          <div class="card-title">${Icons.svg('dollar')} Como funciona o pagamento?</div>
          <div class="card-subtitle">Pagamentos são processados manualmente, com toda segurança</div>
          <ul style="display:flex;flex-direction:column;gap:10px;font-size:14px;color:var(--text-2);">
            <li class="flex gap-3" style="align-items:flex-start;"><span class="badge badge-purple no-dot" style="font-size:12px;">PIX</span> <span>Aceito 100%. Recebimento instantâneo. Confirme no ticket.</span></li>
            <li class="flex gap-3" style="align-items:flex-start;"><span class="badge badge-info no-dot" style="font-size:12px;">Cartão</span> <span>Visa, Mastercard, Elo. Cobrança via link seguro.</span></li>
            <li class="flex gap-3" style="align-items:flex-start;"><span class="badge no-dot" style="font-size:12px;">Boleto</span> <span>Disponível mediante combinação prévia (planos anuais).</span></li>
            <li class="flex gap-3" style="align-items:flex-start;"><span class="badge badge-pink no-dot" style="font-size:12px;">Crypto</span> <span>USDT (TRC20) e Bitcoin sob demanda.</span></li>
          </ul>
          <div class="alert warning mt-4">
            ${Icons.svg('warn')}
            <div>
              <div class="alert-title">Não compartilhe dados sensíveis</div>
              <div class="alert-body">Nossa equipe nunca vai pedir sua senha ou código de segurança. Comprovantes de pagamento são suficientes.</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">${Icons.svg('headset')} Canais úteis</div>
          <div class="card-subtitle">Use os canais certos para agilizar seu atendimento</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div class="alert info"><span data-icon="info"></span><div><div class="alert-title">#abrir-ticket</div><div class="alert-body">Para pagamentos, ativações e dúvidas comerciais.</div></div></div>
            <div class="alert info"><span data-icon="info"></span><div><div class="alert-title">#suporte-tecnico</div><div class="alert-body">Bug, problema técnico ou configuração avançada.</div></div></div>
            <div class="alert info"><span data-icon="info"></span><div><div class="alert-title">#anuncios</div><div class="alert-body">Acompanhe novidades, atualizações e promoções.</div></div></div>
          </div>
        </div>
      </div>

      <div class="card mt-6 glass">
        <div class="card-title">${Icons.svg('copy')} Convite rápido</div>
        <div class="card-subtitle">Copie e compartilhe o link do nosso servidor</div>
        <div class="flex gap-2" style="margin-top:8px;flex-wrap:wrap;">
          <input class="input" value="${DISCORD_INVITE}" readonly style="flex:1;min-width:240px;" id="invite-link" />
          <button class="btn btn-ghost" data-copy>${Icons.svg('copy')} Copiar</button>
          <a class="btn btn-primary" href="${DISCORD_INVITE}" target="_blank" rel="noopener">${Icons.svg('arrowUpRight')} Abrir</a>
        </div>
      </div>
    `;

    main.querySelector('[data-copy]').addEventListener('click', () => UI.copy(DISCORD_INVITE));
    Icons.hydrate(main);
  }

  global.DiscordPage = { init };
})(window);
