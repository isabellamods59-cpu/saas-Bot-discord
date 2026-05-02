-- =====================================================================
-- Nexa Serviços — Seed inicial (4 bots Discord)
-- =====================================================================
-- Como aplicar (DEPOIS de schema.sql):
--   Dashboard → SQL Editor → "New query" → cole este arquivo → RUN
-- Para resetar produtos antes de re-aplicar:
--   delete from public.products;
-- =====================================================================

insert into public.products (name, slug, category, short_description, description, price, icon, badge, recommended, features) values

-- ===== BOTS DISCORD =====
('Bot Ticket', 'bot-ticket', 'bots',
 'Sistema profissional de tickets multi-categoria.',
 'Bot completo de tickets com transcrições automáticas em HTML, múltiplas categorias, atendentes designados, sistema de avaliação 5 estrelas e estatísticas detalhadas. Painel web de configuração.',
 8.99, 'tag', 'Mais barato', false,
 '["Painel web de configuração", "Múltiplas categorias", "Transcrições em HTML", "Atendentes designados", "Sistema de avaliação 5 estrelas", "Estatísticas em tempo real"]'::jsonb),

('Bot Suporte', 'bot-suporte', 'bots',
 'Bot de FAQ + atendimento automatizado 24/7.',
 'Bot de suporte com base de conhecimento em IA, FAQ inteligente, encaminhamento automático para humanos e métricas de satisfação. Reduz drasticamente carga da equipe.',
 11.50, 'help', 'Recomendado', false,
 '["FAQ com IA local", "Atendimento 24/7", "Encaminhamento automático", "Histórico de conversas", "Métricas NPS", "Comandos /faq personalizados"]'::jsonb),

('Bot Moderação', 'bot-moderacao', 'bots',
 'Anti-raid + AutoMod + moderação completa.',
 'Bot avançado anti-raid com captcha, AutoMod customizável, anti-spam, blacklist de palavras, raid mode automático e logs de auditoria detalhados.',
 13.50, 'shield', 'Popular', true,
 '["Captcha de verificação", "AutoMod customizável", "Anti-spam inteligente", "Blacklist de palavras", "Raid mode automático", "Logs de auditoria"]'::jsonb),

('Bot VIP', 'bot-vip', 'bots',
 'Bot all-in-one premium: tickets + moderação + economia + level + boas-vindas.',
 'Pacote completo com TODAS as funcionalidades premium: sistema de tickets, moderação anti-raid, sistema de economia, sistema de level/XP, mensagens de boas-vindas customizadas, painel admin web e suporte vitalício.',
 22.50, 'crown', 'Premium', true,
 '["Tickets + Moderação + Economia", "Sistema de level/XP", "Boas-vindas customizadas", "Painel admin web", "Atualizações vitalícias", "Suporte prioritário no Discord"]'::jsonb)

on conflict (slug) do nothing;
