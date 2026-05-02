# Nexa Serviços — Plataforma SaaS

> Plataforma premium para vender **bots Discord** (Ticket, Suporte, Moderação, VIP). Stack 100% **HTML/CSS/JS puro** com backend opcional em **Supabase** (auth + Postgres). Em **Português (Brasil)**, com fluxo de pagamento manual via tickets do Discord.

![Nexa Serviços](assets/favicon.svg)

## Visão geral

Nexa Serviços é uma SPA estática multi-página inspirada em SaaS modernos como Discord e Stripe. Funciona em dois modos:

| Modo | Quando | Onde os dados ficam |
|---|---|---|
| **Live** (produção) | `js/config.js` tem `SUPABASE_URL` e `SUPABASE_ANON_KEY` | Supabase (Postgres + Auth) |
| **Preview** (offline) | Sem credenciais | LocalStorage do navegador |

- Tema escuro com gradientes roxos / accent ciano e dourado
- Layout responsivo (mobile + desktop)
- Sidebar colapsável, topbar com busca, central de notificações, troca de tema
- Toasts, modais, skeleton loaders, micro-interações
- Autenticação com **username único** e proteção de páginas
- Sistema completo de pedidos com status (Pendente, Aprovado, Entregue, Cancelado)
- Painel admin com CRUD de usuários, pedidos, produtos
- Log de atividades + central de notificações

## Como rodar

Não há dependências. Sirva a pasta com qualquer HTTP server:

```bash
python3 -m http.server 8080
# acesse http://localhost:8080
```

```bash
npx serve .
# ou: npx http-server . -p 8080
```

## Configurar Supabase (modo Live)

Pré-requisito: tenha um projeto criado em [supabase.com](https://supabase.com).

1. **Crie `js/config.js`** copiando de `js/config.example.js` (esse arquivo já é gitignored, suas credenciais não vão pro repo):
   ```js
   window.NEXA_CONFIG = {
     SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
     SUPABASE_ANON_KEY: 'eyJ...',           // anon public (Settings → API)
     ADMIN_EMAIL: 'devbot2026@nexaservicos.app', // email que vira admin automaticamente
     DISCORD_INVITE: 'https://discord.gg/FtWhZEyne',
     BRAND: { name: 'Nexa Serviços', tagline: '...' },
   };
   ```
2. **Aplique o schema**: Supabase Dashboard → SQL Editor → cole `supabase/schema.sql` → **Run**. Cria tabelas `profiles`, `products`, `purchases`, `activity_logs`, `notifications` + RLS policies + triggers.
3. **Aplique o seed**: cole `supabase/seed.sql` → **Run**. Popula os 4 bots iniciais.
4. **Crie o admin**: registre-se em `register.html` usando o email exato de `ADMIN_EMAIL`. O trigger `handle_new_user` marca seu perfil como admin automaticamente.

Veja `supabase/README.md` pra detalhes (RLS, criação manual de admin, troubleshooting).

## Catálogo

4 bots Discord premium:

| Bot               | Preço     | Resumo                                                |
|-------------------|-----------|-------------------------------------------------------|
| **Bot Ticket**    | R$ 8,99   | Tickets multi-categoria com transcrições em HTML.    |
| **Bot Suporte**   | R$ 11,50  | FAQ inteligente + atendimento automático 24/7.       |
| **Bot Moderação** | R$ 13,50  | Anti-raid, AutoMod, captcha e logs de auditoria.     |
| **Bot VIP**       | R$ 22,50  | All-in-one: tickets + moderação + economia + level.   |

## Estrutura de pastas

```
.
├── index.html / register.html              ← Auth
├── dashboard.html                          ← Visão geral do usuário
├── store.html                              ← Marketplace
├── purchases.html                          ← Pedidos do usuário
├── discord.html                            ← Suporte / convite
├── profile.html / settings.html            ← Perfil & preferências
├── admin.html                              ← CRUD de usuários, pedidos, produtos
├── css/
│   ├── theme.css                           ← Tokens, cores, fontes
│   ├── components.css                      ← Botões, inputs, tabelas, modais
│   ├── layout.css                          ← Sidebar + topbar + shell
│   ├── pages.css                           ← Estilos por página
│   └── auth.css                            ← Login/cadastro
├── js/
│   ├── config.js (gitignored)              ← Suas credenciais
│   ├── config.example.js                   ← Template
│   ├── icons.js                            ← Biblioteca de SVGs
│   ├── supabase.js                         ← Wrapper das tabelas
│   ├── db.js                               ← Abstração que escolhe Supabase OU LocalStorage
│   ├── auth.js                             ← Login/registro/sessão
│   ├── ui.js / router.js                   ← Shell, toasts, modais, proteção
│   ├── activity.js / notifications.js      ← Logs e centro de notificações
│   ├── dashboard.js / store.js / etc.      ← Lógica por página
│   └── admin.js                            ← Painel administrativo
├── supabase/
│   ├── schema.sql                          ← Tabelas, RLS, triggers
│   ├── seed.sql                            ← Catálogo inicial
│   └── README.md                           ← Guia passo a passo
└── assets/
    └── favicon.svg
```

## Funcionalidades

**Autenticação** — Cadastro com username único, login por usuário ou email, sessão persistente, logout, proteção de rotas, role admin/user.

**Dashboard** — Saudação personalizada, métricas (pedidos, pendentes, entregues, total investido), gráfico de vendas semanais, atividade recente, sugestões de produtos.

**Marketplace** — Filtros por categoria/preço/popularidade, busca por nome ou descrição, modal de produto com features detalhadas, botão "Comprar e abrir ticket" que cria pedido + abre Discord.

**Pedidos** — Histórico filtrável por status e categoria, badges coloridos, modal de detalhes, cancelamento de pendentes.

**Suporte Discord** — Convite copiável, passo a passo de ticket, formas de pagamento aceitas.

**Painel Admin** — Estatísticas globais, gestão de usuários (promover/remover/excluir), gestão de pedidos (mudar status), CRUD de produtos.

## Pagamento

Todo pagamento é **manual via Discord**:

1. Usuário clica em "Comprar e abrir ticket" → pedido fica `pendente` em "Minhas compras"
2. O Discord oficial abre automaticamente em nova aba
3. O usuário abre um ticket no servidor e combina pagamento (PIX, cartão, etc.)
4. Admin marca o pedido como `aprovado` no painel quando recebe
5. Admin entrega manualmente e marca como `entregue`

Não há gateways automáticos por design — tudo passa pelo time humano.

## Licença

Projeto privado da Nexa Serviços.
