/* ============================================================
   NexaBots — Seed initial data (plans, bots, admin user)
   Runs once on first load. Idempotent.
   ============================================================ */
(function (global) {
  'use strict';

  function seedPlans() {
    if (DB.plans.count() > 0) return;
    DB.plans.replaceAll([
      {
        id: 'plan_starter',
        name: 'Starter',
        price: 19.90,
        period: 'mês',
        recommended: false,
        tagline: 'Para começar com qualidade',
        features: [
          '1 bot simples (música ou moderação)',
          'Configuração básica',
          'Suporte via Discord',
          'Atualizações de segurança',
          'Hospedagem 24/7 inclusa',
        ],
        createdAt: DB.nowISO(),
      },
      {
        id: 'plan_pro',
        name: 'Pro',
        price: 49.90,
        period: 'mês',
        recommended: true,
        tagline: 'O queridinho dos servidores médios',
        features: [
          'Até 3 bots configurados',
          'Comandos personalizados',
          'Painel web simples',
          'Logs e auditoria',
          'Suporte prioritário',
          'Backup automático',
        ],
        createdAt: DB.nowISO(),
      },
      {
        id: 'plan_premium',
        name: 'Premium',
        price: 99.90,
        period: 'mês',
        recommended: false,
        tagline: 'Para comunidades em crescimento',
        features: [
          'Até 6 bots multifuncionais',
          'Sistema de tickets avançado',
          'Economia, níveis e XP',
          'Integrações com APIs',
          'Painel admin completo',
          'Suporte 24/7 prioritário',
        ],
        createdAt: DB.nowISO(),
      },
      {
        id: 'plan_ultimate',
        name: 'Ultimate',
        price: 199.90,
        period: 'mês',
        recommended: false,
        tagline: 'Solução completa para comunidades grandes',
        features: [
          'Bots ilimitados',
          'Suite completa NexaBots',
          'Implementação personalizada',
          'Domínio próprio',
          'Gerente de conta dedicado',
          'SLA garantido 99.9%',
          'White-label disponível',
        ],
        createdAt: DB.nowISO(),
      },
    ]);
  }

  function seedBots() {
    if (DB.bots.count() > 0) return;
    DB.bots.replaceAll([
      { id: 'bot_music',    name: 'Nexa Music',     icon: 'music',       price: 29.90, tag: 'Música',     desc: 'Tocador de música premium com filas, playlists, equalização e suporte a Spotify, YouTube e SoundCloud.', popularity: 'Top 1' },
      { id: 'bot_mod',      name: 'Nexa Guardian',  icon: 'shield2',     price: 39.90, tag: 'Moderação',  desc: 'Sistema completo de moderação automática com anti-raid, anti-spam, captcha e logs detalhados.', popularity: 'Mais vendido' },
      { id: 'bot_econ',     name: 'Nexa Economy',   icon: 'coin',        price: 24.90, tag: 'Economia',   desc: 'Economia virtual completa com loja, bank, daily, work, gambling e ranking global.' },
      { id: 'bot_ticket',   name: 'Nexa Tickets',   icon: 'tag',         price: 19.90, tag: 'Tickets',    desc: 'Sistema profissional de tickets com transcrições automáticas, categorias e atendentes.' },
      { id: 'bot_levels',   name: 'Nexa Levels',    icon: 'trendingUp',  price: 17.90, tag: 'Níveis',     desc: 'Sistema de XP e níveis com cards personalizados, recompensas e ranking dinâmico.' },
      { id: 'bot_giveaway', name: 'Nexa Giveaways', icon: 'gift',        price: 14.90, tag: 'Sorteios',   desc: 'Sorteios automatizados com requisitos, múltiplos vencedores e reroll instantâneo.' },
      { id: 'bot_logs',     name: 'Nexa Logs',      icon: 'activity',    price: 12.90, tag: 'Logs',       desc: 'Auditoria completa de mensagens, membros, canais, cargos e ações administrativas.' },
      { id: 'bot_games',    name: 'Nexa Games',     icon: 'gamepad',     price: 22.90, tag: 'Jogos',      desc: 'Mais de 30 minigames interativos: trivia, blackjack, hangman, conexão e muito mais.' },
    ]);
  }

  function seedAdmin() {
    const existing = DB.users.find((u) => u.username === 'admin');
    if (existing) return;
    DB.users.insert({
      username: 'admin',
      email: 'admin@nexabots.app',
      password: hashPassword('admin123'),
      role: 'admin',
      avatar: 'gradient-1',
      displayName: 'Administrador',
      bio: 'Conta padrão de administrador.',
    });
  }

  // Tiny insecure hash (NOT for production — purely for demo).
  function hashPassword(raw) {
    let hash = 5381;
    const salt = 'nexabots-salt-v1';
    const s = salt + ':' + raw;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) + hash) + s.charCodeAt(i);
      hash = hash & 0xffffffff;
    }
    return 'h$' + (hash >>> 0).toString(16) + '$' + s.length.toString(36);
  }

  function init() {
    seedPlans();
    seedBots();
    seedAdmin();
    DB.setVersion('1.0.0');
  }

  global.Seed = { init, hashPassword };

  // Auto-run once
  init();
})(window);
