-- =====================================================================
-- NexaBots V2 — Seed inicial
-- =====================================================================
-- Como aplicar (DEPOIS de schema.sql):
--   Dashboard → SQL Editor → "New query" → cole este arquivo → RUN
-- =====================================================================

insert into public.products (name, slug, category, short_description, description, price, icon, badge, recommended, features) values
-- ===== BOTS DISCORD =====
('Nexa Music', 'nexa-music', 'bots',
 'Tocador de música premium com filas e equalização.',
 'Bot de música premium com suporte a Spotify, YouTube, SoundCloud, Apple Music. Filtros pro DJ, filas avançadas, letras em tempo real e equalizador 8 bandas.',
 29.90, 'music', 'Top 1', false,
 '["Suporte multi-plataforma", "Filtros e equalizador", "Filas avançadas", "Hospedagem 24/7", "Comandos slash"]'::jsonb),

('Nexa Guardian', 'nexa-guardian', 'bots',
 'Sistema completo de moderação automática anti-raid.',
 'Moderação inteligente com anti-raid, anti-spam, captcha, AutoMod customizável e logs de auditoria detalhados.',
 39.90, 'shield2', 'Mais vendido', true,
 '["Anti-raid e anti-spam", "Captcha de verificação", "Logs detalhados", "AutoMod customizável", "Banimento programado"]'::jsonb),

('Nexa Economy', 'nexa-economy', 'bots',
 'Economia virtual completa com loja e ranking.',
 'Sistema completo de economia: loja, banco, daily, work, gambling e ranking global por servidor.',
 24.90, 'coin', null, false,
 '["Daily / Work / Gambling", "Loja personalizada", "Banco com juros", "Ranking global", "Itens negociáveis"]'::jsonb),

('Nexa Tickets', 'nexa-tickets', 'bots',
 'Sistema profissional de tickets multi-categoria.',
 'Tickets com transcrições automáticas, categorias, atendentes designados, ratings e estatísticas.',
 19.90, 'tag', null, false,
 '["Múltiplas categorias", "Transcrições automáticas", "Atendentes designados", "Sistema de avaliação", "Tags e prioridades"]'::jsonb),

('Nexa Levels', 'nexa-levels', 'bots',
 'Sistema de níveis e XP com cards customizados.',
 'XP por mensagem e voz, cards customizados, ranking, recompensas automáticas e backgrounds personalizados.',
 22.90, 'trendingUp', null, false,
 '["XP por chat e voz", "Cards customizáveis", "Recompensas por nível", "Ranking global", "Backgrounds premium"]'::jsonb),

-- ===== CURSOS =====
('Curso Discord.js Avançado', 'curso-discord-js', 'cursos',
 'Aprenda a criar bots profissionais do zero ao deploy.',
 'Curso completo de 40h com Discord.js v14, slash commands, banco de dados, deploy 24/7 e monetização.',
 197.00, 'book', 'Lançamento', false,
 '["40 horas de conteúdo", "Discord.js v14", "Slash commands", "Banco de dados", "Deploy 24/7"]'::jsonb),

('Curso Comunidade do Zero', 'curso-comunidade', 'cursos',
 'Construa uma comunidade Discord de 10k+ membros.',
 'Estratégias práticas de growth, engajamento, eventos, parcerias e monetização de comunidade Discord.',
 147.00, 'users', null, false,
 '["Strategy de growth", "Sistema de eventos", "Parcerias e mídia", "Monetização", "Suporte vitalício"]'::jsonb),

('Curso Bot SaaS', 'curso-bot-saas', 'cursos',
 'Transforme seu bot em produto vendável.',
 'Aprenda a transformar seu bot em SaaS: arquitetura, dashboard web, billing, suporte e marketing.',
 297.00, 'crown', null, true,
 '["Arquitetura SaaS", "Dashboard web", "Sistema de billing", "Marketing digital", "Mentoria mensal"]'::jsonb),

-- ===== JOGOS =====
('Conta Roblox Premium', 'conta-roblox', 'jogos',
 'Conta Roblox com 1000+ Robux e badges raras.',
 'Conta verificada com 1000 Robux, vários jogos pagos e badges colecionáveis raras.',
 89.00, 'gamepad', null, false,
 '["1000+ Robux", "Badges raras", "Jogos pagos", "E-mail original", "Garantia 30 dias"]'::jsonb),

('Steam Wallet R$50', 'steam-50', 'jogos',
 'Crédito Steam de R$50 — entrega via gift code.',
 'Gift code da Steam Wallet entregue em até 24h após confirmação do pagamento.',
 50.00, 'gift', null, false,
 '["Crédito de R$ 50,00", "Entrega digital", "Resgate imediato", "Suporte rápido"]'::jsonb),

('Valorant Pontos', 'valorant-pontos', 'jogos',
 '1000 VP no Valorant — entrega rápida.',
 '1000 Valorant Points entregues via redeem code da Riot Games.',
 79.90, 'sparkle', null, false,
 '["1000 VP", "Code Riot oficial", "Entrega em 1h", "Funciona Brasil/LATAM"]'::jsonb),

-- ===== NITRO =====
('Discord Nitro 1 Mês', 'nitro-mensal', 'nitro',
 'Discord Nitro completo por 1 mês.',
 'Nitro Full mensal com perks completos: emojis cross-server, upload 500MB, HD, boost grátis e mais.',
 25.00, 'sparkle', null, false,
 '["Emojis cross-server", "Upload 500MB", "Streams em HD", "2 boosts inclusos", "Perfil personalizado"]'::jsonb),

('Discord Nitro 1 Ano', 'nitro-anual', 'nitro',
 'Discord Nitro completo por 12 meses.',
 'Nitro Full por 1 ano inteiro — economia de 35% versus mensal. Perks completos.',
 195.00, 'crown', 'Melhor oferta', true,
 '["12 meses Nitro Full", "Economia de 35%", "24 boosts inclusos", "Suporte prioritário", "Garantia oficial"]'::jsonb),

('Nitro Basic 1 Mês', 'nitro-basic-mensal', 'nitro',
 'Nitro Basic mensal — perks essenciais.',
 'Nitro Basic com upload 50MB, emojis cross-server e perfil customizado.',
 12.00, 'zap', null, false,
 '["Upload 50MB", "Emojis cross-server", "Perfil customizado", "Streams melhoradas"]'::jsonb),

-- ===== LOJAS PRONTAS =====
('Loja Discord Premium', 'loja-premium', 'lojas',
 'Servidor Discord completo de loja, pronto pra vender.',
 'Servidor Discord configurado: sistema de tickets, painel de produtos, bots integrados e templates de mensagens.',
 297.00, 'store', 'Pacote completo', true,
 '["Servidor estruturado", "Sistema de tickets", "Bots integrados", "Templates prontos", "Treinamento incluso"]'::jsonb),

('Loja Whitelabel', 'loja-whitelabel', 'lojas',
 'Plataforma SaaS whitelabel com sua marca.',
 'Plataforma de e-commerce SaaS personalizada, com seu logo, suas cores e seu domínio.',
 1497.00, 'shield', null, false,
 '["Domínio próprio", "Logo e branding", "Painel admin", "Hospedagem 1 ano", "Suporte vitalício"]'::jsonb),

('Loja Lite', 'loja-lite', 'lojas',
 'Site simples e funcional para vender no Discord.',
 'Site one-page integrado ao Discord com checkout e ticket automático.',
 197.00, 'shoppingBag', null, false,
 '["Site one-page", "Integração Discord", "Checkout pronto", "Suporte via ticket"]'::jsonb)

on conflict (slug) do nothing;
