# Nexa Serviços — Plataforma SaaS para Bots de Discord

> Plataforma premium completa, em **HTML/CSS/JS puro**, para gerenciar e comercializar bots de Discord. Inteiramente em **Português (Brasil)**, com banco de dados em **LocalStorage**, autenticação, dashboard, planos, painel admin e fluxo manual de pagamentos via Discord (sistema de tickets).

![Nexa Serviços](assets/favicon.svg)

## Visão geral

Nexa Serviços é uma SPA estática (multi-página) inspirada em SaaS modernos como Discord, Loritta e Stripe. Não usa frameworks, não exige instalação e funciona 100% no navegador.

- Tema escuro com gradientes roxos / accent ciano e rosa
- Layout responsivo (mobile + desktop)
- Sidebar colapsável, topbar com busca, central de notificações, troca de tema
- Toasts, modais, skeleton loaders, micro-interações
- Sistema de autenticação com **username único** e proteção de páginas
- Sistema completo de pedidos com status (Pendente, Aprovado, Entregue, Cancelado)
- Painel admin com CRUD de usuários, pedidos, planos e bots
- Log de atividades + central de notificações

## Como rodar

Não há dependências. Basta abrir o projeto no navegador:

### Opção 1 — abrir direto no navegador
```
open index.html
```

### Opção 2 — servir com qualquer HTTP server
```bash
python3 -m http.server 8080
# então acesse http://localhost:8080
```

```bash
npx serve .
# ou: npx http-server . -p 8080
```

## Conta de demonstração

Ao abrir pela primeira vez, o sistema cria automaticamente um usuário administrador:

| Campo | Valor |
|---|---|
| Usuário | `admin` |
| Senha | `admin123` |

Você também pode criar uma conta nova pela tela de cadastro.

## Estrutura de pastas

```
.
├── index.html          ← Login (entrada)
├── register.html       ← Cadastro
├── dashboard.html      ← Dashboard com stats e atividade
├── plans.html          ← Catálogo de planos
├── purchases.html      ← Histórico de compras do usuário
├── store.html          ← Loja de bots
├── discord.html        ← Suporte / Tickets manuais
├── profile.html        ← Perfil do usuário
├── settings.html       ← Configurações
├── admin.html          ← Painel administrativo (somente admins)
├── css/
│   ├── theme.css       ← Tokens, cores, fontes, fundos
│   ├── components.css  ← Botões, inputs, tabelas, modais, toasts...
│   ├── layout.css      ← Sidebar + Topbar + Content shell
│   ├── pages.css       ← Estilos específicos de páginas
│   └── auth.css        ← Login/Register layout
├── js/
│   ├── icons.js        ← Biblioteca de ícones SVG
│   ├── db.js           ← LocalStorage abstrac (Mongo/Firebase-like)
│   ├── seed.js         ← Seed dos dados iniciais
│   ├── activity.js     ← Log de atividades
│   ├── notifications.js← Central de notificações
│   ├── auth.js         ← Login / Cadastro / Sessão
│   ├── ui.js           ← Toasts, modais, formatação, tema, sidebar
│   ├── router.js       ← Proteção de rotas, sidebar/topbar
│   ├── dashboard.js    ← Lógica do dashboard
│   ├── plans.js        ← Lógica da página de planos
│   ├── purchases.js    ← Lógica da página de compras
│   ├── store.js        ← Lógica da loja
│   ├── discord.js      ← Página de suporte Discord
│   ├── profile.js      ← Edição de perfil
│   ├── settings.js     ← Tela de configurações
│   └── admin.js        ← Painel administrativo
└── assets/
    └── favicon.svg
```

## Funcionalidades

### Autenticação
- Cadastro com **nome de usuário único**, validação de e-mail e senha (>= 6)
- Login por usuário **ou** e-mail
- Sessão persistente em LocalStorage (válida por 7 dias)
- Logout com confirmação
- Páginas protegidas — usuários não autenticados são redirecionados para o login
- Páginas administrativas exigem `role === 'admin'`

### Dashboard
- Saudação personalizada (bom dia / boa tarde / boa noite)
- Cards de estatísticas: total de compras, bots ativos, investimento, entregas
- Gráfico de barras simulado (engajamento semanal)
- Atalhos rápidos para áreas principais
- Histórico de últimos pedidos
- Feed de atividade recente

### Planos
- Renderização dinâmica dos planos cadastrados
- Toggle Mensal / Anual (com 20% de desconto anual)
- Plano recomendado em destaque
- Modal de checkout que cria um pedido pendente
- FAQ embutido

### Compras
- Histórico completo de pedidos do usuário
- Filtros por status: Pendente, Aprovado, Entregue, Cancelado
- Busca por nome do plano
- Badges coloridos por status
- Modal com detalhes completos do pedido
- Cancelamento de pedidos pendentes

### Loja
- Catálogo de bots premium (música, moderação, economia, tickets, etc.)
- Filtros por categoria
- Busca em tempo real
- Modal de checkout para compra individual

### Suporte Discord (Tickets)
- CTA grande para entrar no servidor
- Passo a passo para abrir um ticket
- Detalhes sobre formas de pagamento aceitas (PIX, cartão, boleto, crypto)
- Link de convite copiável

### Perfil
- Edição de nome de exibição, e-mail e bio
- Avatar com 6 gradientes pré-definidos
- Alteração de senha com validação da senha atual
- Atividade recente da conta

### Configurações
- Toggle de tema (escuro / claro)
- Toggle de sidebar recolhida
- Preferências de notificações
- Exportar dados como JSON
- Limpar atividade
- Resetar plataforma

### Painel Admin (somente admins)
- 5 abas: Usuários, Compras, Planos, Bots, Atividade
- CRUD completo de usuários (editar, excluir, promover a admin)
- CRUD completo de pedidos (mudar status, excluir)
- CRUD completo de planos (criar, editar, marcar como recomendado, excluir)
- CRUD completo de bots da loja
- Log de atividade global da plataforma
- Estatísticas agregadas em tempo real

## Restrições importantes

Conforme escopo do projeto:

- ❌ **Não usa Firebase** ou qualquer banco externo
- ❌ **Não implementa pagamentos automáticos** (PIX API, Stripe, etc.)
- ❌ **Não implementa entrega automática de bots**
- ✅ **Pagamentos são manuais** via tickets no Discord

## Tecnologias

- HTML5 semântico
- CSS3 com variáveis customizadas, grid, flex e backdrop-filter
- JavaScript vanilla (ES6+) modular
- Sem build, sem npm, sem dependências runtime
- Tipografia: [Inter](https://rsms.me/inter/)

## Licença

MIT — use, modifique e distribua à vontade.
