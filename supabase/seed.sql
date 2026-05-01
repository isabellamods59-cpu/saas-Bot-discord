-- =====================================================================
-- Nexa Serviços V2 — Seed inicial
-- =====================================================================
-- Como aplicar (DEPOIS de schema.sql):
--   Dashboard → SQL Editor → "New query" → cole este arquivo → RUN
-- =====================================================================

insert into public.products (name, slug, category, short_description, description, price, icon, badge, recommended, features) values
-- ===== BOTS DISCORD =====
('Nexa Tickets', 'nexa-tickets', 'bots',
 'Sistema profissional de tickets multi-categoria.',
 'Bot completo de tickets com transcrições automáticas em HTML, múltiplas categorias, atendentes designados, sistema de avaliação e estatísticas.',
 5.99, 'tag', 'Mais barato', false,
 '["Múltiplas categorias", "Transcrições em HTML", "Atendentes designados", "Sistema de avaliação", "Tags e prioridades", "Painel de configuração"]'::jsonb),

('Nexa Levels', 'nexa-levels', 'bots',
 'Sistema de níveis e XP com cards customizados.',
 'Acompanhe a progressão dos seus membros com XP por chat e voz, cards visuais customizáveis, ranking global e recompensas automáticas a cada nível.',
 7.99, 'trendingUp', null, false,
 '["XP por chat e voz", "Cards customizáveis", "Recompensas por nível", "Ranking global", "Backgrounds premium", "Comandos slash"]'::jsonb),

('Nexa Economy', 'nexa-economy', 'bots',
 'Economia virtual completa com loja, banco e jogos.',
 'Sistema completo de economia virtual: daily, work, slot, loja personalizada, banco com juros, ranking global e itens negociáveis entre membros.',
 9.99, 'coin', null, false,
 '["Daily / Work / Slot", "Loja personalizada", "Banco com juros", "Ranking global", "Itens negociáveis", "Multi-servidor"]'::jsonb),

('Nexa Music', 'nexa-music', 'bots',
 'Tocador de música premium com filas e equalizador.',
 'Bot de música premium com suporte a Spotify, YouTube, SoundCloud e Apple Music. Equalizador 8 bandas, filtros pro DJ, letras em tempo real e qualidade lossless.',
 9.99, 'music', 'Top 1', false,
 '["Spotify / YouTube / SoundCloud", "Equalizador 8 bandas", "Filtros pro DJ", "Letras em tempo real", "Hospedagem 24/7", "Comandos slash"]'::jsonb),

('Nexa Guardian', 'nexa-guardian', 'bots',
 'Sistema completo de moderação e anti-raid.',
 'Moderação inteligente com proteção anti-raid, anti-spam, captcha de verificação, AutoMod customizável, logs detalhados e banimento programado.',
 12.99, 'shield2', 'Mais vendido', true,
 '["Anti-raid e anti-spam", "Captcha de verificação", "Logs de auditoria", "AutoMod customizável", "Banimento programado", "Filtros de palavras"]'::jsonb),

-- ===== CURSOS =====
('Curso Discord.js Avançado', 'curso-discord-js', 'cursos',
 'Aprenda a criar bots profissionais do zero ao deploy.',
 'Curso de 40h com Discord.js v14, slash commands, banco de dados PostgreSQL, deploy 24/7 na cloud e estratégias de monetização.',
 49.90, 'book', 'Lançamento', false,
 '["40h de conteúdo", "Discord.js v14", "Slash commands", "Banco de dados", "Deploy 24/7", "Suporte vitalício"]'::jsonb),

('Curso Comunidade do Zero', 'curso-comunidade', 'cursos',
 'Construa uma comunidade Discord de 10k+ membros.',
 'Estratégias práticas de growth, engajamento, sistemas de eventos, parcerias com criadores e monetização da sua comunidade Discord.',
 39.90, 'users', null, false,
 '["Estratégias de growth", "Sistema de eventos", "Parcerias e mídia", "Monetização", "Templates prontos", "Suporte vitalício"]'::jsonb),

('Curso Bot SaaS', 'curso-bot-saas', 'cursos',
 'Transforme seu bot em produto vendável.',
 'Aprenda a transformar seu bot em SaaS: arquitetura escalável, dashboard web, sistema de billing, suporte ao cliente e marketing digital.',
 79.90, 'crown', null, true,
 '["Arquitetura SaaS", "Dashboard web", "Sistema de billing", "Marketing digital", "Mentoria mensal", "Templates de código"]'::jsonb),

-- ===== JOGOS =====
('Conta Roblox Premium', 'conta-roblox', 'jogos',
 'Conta Roblox verificada com 1000+ Robux e badges raras.',
 'Conta verificada com 1000 Robux, vários jogos pagos já comprados, badges colecionáveis raras e e-mail original.',
 29.90, 'gamepad', null, false,
 '["1000+ Robux", "Badges raras", "Jogos pagos inclusos", "E-mail original", "Garantia 30 dias", "Suporte rápido"]'::jsonb),

('Steam Wallet R$ 50', 'steam-50', 'jogos',
 'Crédito Steam de R$ 50 — entrega digital.',
 'Gift code da Steam Wallet de R$ 50, entregue em até 24h após confirmação do pagamento. Resgate imediato na sua conta.',
 39.90, 'gift', null, false,
 '["Crédito de R$ 50,00", "Entrega digital", "Resgate imediato", "Suporte rápido", "Garantia oficial"]'::jsonb),

('Valorant 1000 VP', 'valorant-pontos', 'jogos',
 '1000 VP no Valorant — entrega rápida via code Riot.',
 '1000 Valorant Points entregues via redeem code oficial da Riot Games, com ativação em até 1h.',
 24.99, 'sparkle', null, false,
 '["1000 VP", "Code Riot oficial", "Entrega em 1h", "Funciona Brasil/LATAM", "Suporte rápido"]'::jsonb),

-- ===== NITRO =====
('Nitro Basic 1 Mês', 'nitro-basic-mensal', 'nitro',
 'Nitro Basic mensal — perks essenciais.',
 'Nitro Basic com upload de 50MB, emojis cross-server, perfil customizado e streams melhoradas. Ativação em até 1h.',
 7.99, 'zap', null, false,
 '["Upload de 50MB", "Emojis cross-server", "Perfil customizado", "Streams melhoradas", "Ativação em 1h"]'::jsonb),

('Discord Nitro 1 Mês', 'nitro-mensal', 'nitro',
 'Discord Nitro Full por 1 mês.',
 'Nitro Full mensal com perks completos: emojis cross-server, upload 500MB, streams em HD, 2 server boosts grátis e perfil personalizado.',
 14.99, 'sparkle', null, false,
 '["Emojis cross-server", "Upload de 500MB", "Streams em HD", "2 boosts inclusos", "Perfil personalizado", "Custom tags"]'::jsonb),

('Discord Nitro 1 Ano', 'nitro-anual', 'nitro',
 'Nitro Full por 12 meses — economia de 50%.',
 'Nitro Full por um ano inteiro. Economia de 50% comparado ao mensal. Perks completos + 24 boosts inclusos.',
 89.90, 'crown', 'Melhor oferta', true,
 '["12 meses Nitro Full", "Economia de 50%", "24 boosts inclusos", "Suporte prioritário", "Garantia oficial"]'::jsonb),

-- ===== LOJAS PRONTAS =====
('Loja Lite', 'loja-lite', 'lojas',
 'Site simples e funcional para vender no Discord.',
 'Site one-page integrado ao Discord com checkout pronto e abertura de ticket automática para entrega manual.',
 39.90, 'shoppingBag', null, false,
 '["Site one-page", "Integração Discord", "Checkout pronto", "Suporte via ticket", "Setup em 24h"]'::jsonb),

('Loja Discord Premium', 'loja-premium', 'lojas',
 'Servidor Discord completo de loja, pronto pra vender.',
 'Servidor Discord pré-configurado com sistema de tickets, painel de produtos, bots integrados, templates de mensagens e treinamento incluso.',
 79.90, 'store', 'Pacote completo', true,
 '["Servidor estruturado", "Sistema de tickets", "Bots integrados", "Templates prontos", "Treinamento incluso", "Suporte 30 dias"]'::jsonb),

('Loja Whitelabel', 'loja-whitelabel', 'lojas',
 'Plataforma SaaS whitelabel com sua marca.',
 'Plataforma de e-commerce whitelabel completamente personalizada — seu logo, suas cores, seu domínio. Hospedagem 1 ano + suporte vitalício.',
 199.00, 'shield', null, false,
 '["Domínio próprio", "Logo e branding", "Painel admin completo", "Hospedagem 1 ano", "Suporte vitalício", "Treinamento incluso"]'::jsonb)

on conflict (slug) do nothing;
