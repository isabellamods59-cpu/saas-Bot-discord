/* ============================================================
   NexaBots — Plans page
   ============================================================ */
(function (global) {
  'use strict';

  function init() {
    const user = Auth.currentUser();
    if (!user) return;
    const main = document.querySelector('.content');
    if (!main) return;

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Planos NexaBots</h1>
          <p class="subtitle">Escolha o plano perfeito para sua comunidade. Cancele quando quiser.</p>
        </div>
        <div class="tabs" id="period-tabs" style="margin-top:8px;">
          <button class="tab active" data-period="mês">Mensal</button>
          <button class="tab" data-period="ano">Anual <span class="badge badge-purple no-dot" style="margin-left:6px;font-size:10px;">-20%</span></button>
        </div>
      </div>

      <div class="alert info mb-6">
        ${Icons.svg('info')}
        <div>
          <div class="alert-title">Pagamento manual via Discord</div>
          <div class="alert-body">Após selecionar um plano, você será orientado a abrir um ticket no nosso Discord. Nossa equipe finalizará o pagamento e ativará seu bot manualmente.</div>
        </div>
      </div>

      <div class="grid grid-plans" id="plans-grid"></div>

      <div class="mt-6">
        <div class="card">
          <div class="card-title">${Icons.svg('help')} Perguntas frequentes</div>
          <div class="card-subtitle">Tudo que você precisa saber antes de contratar</div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <details class="card" open>
              <summary style="cursor:pointer;font-weight:600;">Posso trocar de plano depois?</summary>
              <p class="muted" style="margin-top:8px;">Sim! Você pode fazer upgrade ou downgrade a qualquer momento, sem custos extras. A diferença é proporcional.</p>
            </details>
            <details class="card">
              <summary style="cursor:pointer;font-weight:600;">Como funciona o pagamento?</summary>
              <p class="muted" style="margin-top:8px;">Pagamentos são processados manualmente via Discord. Após selecionar um plano, abra um ticket e nossa equipe enviará as instruções (PIX, cartão, etc.).</p>
            </details>
            <details class="card">
              <summary style="cursor:pointer;font-weight:600;">Existe garantia de devolução?</summary>
              <p class="muted" style="margin-top:8px;">Sim, oferecemos 7 dias de garantia incondicional. Se o produto não atender suas expectativas, devolvemos 100% do valor.</p>
            </details>
            <details class="card">
              <summary style="cursor:pointer;font-weight:600;">A hospedagem está inclusa?</summary>
              <p class="muted" style="margin-top:8px;">Sim, todos os planos incluem hospedagem 24/7 em servidores premium localizados no Brasil.</p>
            </details>
          </div>
        </div>
      </div>
    `;

    let currentPeriod = 'mês';
    function renderPlans() {
      const plans = DB.plans.all();
      const grid = main.querySelector('#plans-grid');
      grid.innerHTML = plans.map((p, idx) => {
        const isYearly = currentPeriod === 'ano';
        const price = isYearly ? p.price * 12 * 0.8 : p.price;
        const period = isYearly ? 'ano' : 'mês';
        return `
          <div class="card plan-card ${p.recommended ? 'recommended' : ''} animate-in" style="animation-delay:${idx * 50}ms">
            <span class="plan-tag">${UI.escapeHtml(p.name)}</span>
            <p class="muted" style="font-size:13.5px;margin:0;">${UI.escapeHtml(p.tagline)}</p>
            <div class="plan-price">
              <span class="currency">R$</span>${price.toFixed(2).replace('.', ',')}
              <span class="period">/${period}</span>
            </div>
            <ul class="plan-features">
              ${p.features.map((f) => `<li>${UI.escapeHtml(f)}</li>`).join('')}
            </ul>
            <button class="btn ${p.recommended ? 'btn-primary' : 'btn-ghost'} btn-block" data-plan="${p.id}">
              ${Icons.svg('shoppingBag')} Contratar agora
            </button>
          </div>
        `;
      }).join('');
      Icons.hydrate(grid);
    }
    renderPlans();

    main.querySelectorAll('#period-tabs .tab').forEach((t) => {
      t.addEventListener('click', () => {
        main.querySelectorAll('#period-tabs .tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        currentPeriod = t.dataset.period;
        renderPlans();
      });
    });

    main.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plan]');
      if (!btn) return;
      const planId = btn.dataset.plan;
      const plan = DB.plans.get(planId);
      if (!plan) return;
      openPlanCheckout(plan, currentPeriod);
    });
    Icons.hydrate(main);
  }

  function openPlanCheckout(plan, period) {
    const isYearly = period === 'ano';
    const price = isYearly ? plan.price * 12 * 0.8 : plan.price;
    const m = UI.openModal({
      title: 'Contratar plano ' + plan.name,
      body: `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="card" style="padding:18px;">
            <div class="flex justify-between items-center">
              <div>
                <div style="font-weight:700;font-size:16px;">${UI.escapeHtml(plan.name)}</div>
                <div class="muted" style="font-size:13px;">${UI.escapeHtml(plan.tagline)}</div>
              </div>
              <div class="plan-price" style="font-size:24px;">
                <span class="currency" style="font-size:13px;">R$</span>${price.toFixed(2).replace('.', ',')}
                <span class="period" style="font-size:11px;">/${isYearly ? 'ano' : 'mês'}</span>
              </div>
            </div>
            <ul class="plan-features mt-4" style="margin-top:10px;">
              ${plan.features.slice(0, 4).map((f) => `<li>${UI.escapeHtml(f)}</li>`).join('')}
            </ul>
          </div>
          <div class="alert info">
            ${Icons.svg('info')}
            <div>
              <div class="alert-title">Próximos passos</div>
              <div class="alert-body">Ao confirmar, criaremos um pedido <strong>pendente</strong> e você será orientado a abrir um ticket no nosso Discord para finalizar o pagamento manualmente. Nossa equipe ativará tudo em poucos minutos.</div>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" data-close>Cancelar</button>
        <button class="btn btn-primary" data-confirm>${Icons.svg('checkCircle')} Confirmar pedido</button>
      `,
    });
    Icons.hydrate(m.root);
    m.root.querySelector('[data-confirm]').addEventListener('click', () => {
      const user = Auth.currentUser();
      const order = DB.orders.insert({
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        period: isYearly ? 'ano' : 'mês',
        price,
        status: 'pendente',
        notes: '',
      });
      Activity.log({ userId: user.id, type: 'order', message: `Novo pedido criado: ${plan.name} (${isYearly ? 'anual' : 'mensal'}).`, data: { orderId: order.id } });
      Notifications.push({ userId: user.id, title: 'Pedido criado', message: `Seu pedido do plano ${plan.name} está pendente. Abra um ticket no Discord para finalizar.`, type: 'info' });
      m.close();
      UI.toast.success('Pedido criado! Abra um ticket no Discord para finalizar.', 'Pedido pendente');
      setTimeout(() => window.location.assign('discord.html'), 600);
    });
  }

  global.Plans = { init };
})(window);
