# Supabase setup — Nexa Serviços

Tudo que você precisa pra conectar a Nexa Serviços ao Supabase em produção.

## 1. Crie um projeto Supabase

1. Vá em [supabase.com](https://supabase.com) → **Sign in** com Google/GitHub.
2. **New project** → escolha:
   - Nome: `nexa-servicos` (ou qualquer)
   - Senha do banco: gere uma forte e guarde no seu password manager
   - Região: `South America (São Paulo)` (mais próximo do Brasil)
   - Plano: **Free** já é suficiente
3. Aguarde 1-2 minutos enquanto o Supabase provisiona.

## 2. Aplique o schema

1. **SQL Editor** (ícone `< >` na sidebar) → **New query**.
2. Cole o conteúdo de [`schema.sql`](./schema.sql) e clique **RUN**.
3. Esperado: `Success. No rows returned`. Cria 5 tabelas (profiles, products, purchases, activity_logs, notifications) e ~15 RLS policies.

## 3. Carregue o catálogo

1. **SQL Editor** → **New query**.
2. Cole [`seed.sql`](./seed.sql) e rode.
3. Confira em **Table Editor** → `products` que existem **4 bots** (Ticket R$ 8,99 / Suporte R$ 11,50 / Moderação R$ 13,50 / VIP R$ 22,50).

## 4. Pegue suas chaves

1. **Settings** (engrenagem) → **API**.
2. Copie:
   - **Project URL** → `https://abcdefgh.supabase.co`
   - **anon public** key → JWT longo começando com `eyJ...`
3. Cole as duas em `js/config.js` (criado a partir de `js/config.example.js` — esse arquivo é gitignored):
   ```js
   window.NEXA_CONFIG = {
     SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
     SUPABASE_ANON_KEY: 'eyJhbGc...',
     ADMIN_EMAIL: 'devbot2026@nexaservicos.app',
     DISCORD_INVITE: 'https://discord.gg/FtWhZEyne',
   };
   ```

> **Nunca** coloque a `service_role` key aqui. O cliente é público e a anon key respeita as RLS policies. Se você expor a service_role por engano, role ela imediatamente em **Settings → API → Roll service_role key**.

## 5. Crie a conta admin

O sistema promove a admin automaticamente qualquer usuário com email igual ao `ADMIN_EMAIL` configurado.

A conta padrão é:

| Campo    | Valor                              |
|----------|------------------------------------|
| Username | `DevBot2026`                       |
| Email    | `devbot2026@nexaservicos.app`      |
| Senha    | (você escolhe — mín. 6 caracteres) |

### Como criar:

1. Antes de criar a conta, no Supabase: **Authentication → Providers → Email** → desabilite **Confirm email** (assim o cadastro entra direto, sem precisar de link de confirmação).
2. Acesse `register.html` da app.
3. Preencha:
   - Nome: o que quiser (ex: "Dev Bot")
   - **Username: `DevBot2026`** (case-insensitive — pode digitar como quiser)
   - **Email: `devbot2026@nexaservicos.app`** (precisa bater EXATAMENTE com `ADMIN_EMAIL` no config)
   - Senha: escolha uma forte (mínimo 6 caracteres). Sugestão: `dev15bot` ou similar.
4. Pronto: o trigger `handle_new_user` marca seu perfil como admin no momento do registro. Você consegue logar com `DevBot2026` (username) ou `devbot2026@nexaservicos.app` (email) + a senha.

### Promover outro usuário a admin (opcional)

Se quiser promover uma conta existente: **Table Editor** → `profiles` → encontre o usuário → mude `role` de `user` pra `admin`.

## 6. Configurações recomendadas de Auth

Para uma experiência sem fricção em produção:

- **Authentication → Providers → Email**: desabilite **Confirm email** se quiser permitir login imediato após cadastro. (Mantenha ligado se quiser validação de email — mas aí o admin também precisa confirmar.)
- **Authentication → URL Configuration**:
   - **Site URL**: `https://seudominio.com` (em produção) ou `http://localhost:8080` (em dev)
   - **Redirect URLs**: adicione todos os domínios que vai usar
- **Settings → Auth → Email Templates**: customize os templates de confirmação/reset com sua marca.

## 7. Verificar tudo

Em ordem, teste:

1. Acesse `register.html` → cadastre **dois** usuários: o admin (com `ADMIN_EMAIL`) e um usuário comum.
2. Acesse `index.html` → entre como usuário comum.
3. Acesse `store.html` → veja os 4 bots.
4. Compre um produto → veja em `purchases.html` como `pendente`. O Discord abre numa nova aba.
5. Saia, entre como admin → `admin.html` deve mostrar o usuário e o pedido.
6. Mude o status do pedido pra `aprovado` → o usuário recebe notificação.

## Estrutura

| Tabela              | Função                                                |
|---------------------|-------------------------------------------------------|
| `profiles`          | Perfil público (1-1 com `auth.users`)                 |
| `products`          | Catálogo (4 bots Discord)                             |
| `purchases`         | Pedidos de cada usuário                               |
| `activity_logs`     | Histórico de eventos para auditoria                   |
| `notifications`     | Central de notificações in-app                        |

## RLS — segurança

- **profiles**: leitura pública (perfis aparecem em rankings/comentários), escrita só do próprio dono ou admin.
- **products**: leitura pública (só os ativos), escrita só admin.
- **purchases**: usuário só vê os próprios pedidos; só pode editar enquanto está pendente; admin vê e edita tudo.
- **activity_logs**: usuário só vê seu próprio log; admin vê tudo.
- **notifications**: usuário só vê / marca como lidas as próprias.

## Solução de problemas

| Sintoma                                            | Causa provável                              | Como corrigir                                                          |
|----------------------------------------------------|---------------------------------------------|------------------------------------------------------------------------|
| `Configuração do banco está incompleta`            | `schema.sql` ainda não foi rodado           | Aplique `schema.sql` no SQL Editor                                     |
| Login dá `Email ou senha incorretos`               | Email não existe ou senha errada            | Verifique em `Authentication → Users` se a conta existe                |
| Cadastro dá `Email já está cadastrado`             | Já existe conta com esse email              | Faça login em vez de cadastrar                                         |
| Cadastro dá `O username escolhido já está em uso`  | Conflito UNIQUE no `profiles.username`      | Escolha outro username                                                 |
| Loja vazia                                         | `seed.sql` não foi rodado, ou RLS bloqueia  | Rode `seed.sql`; confira que `products_select_active` policy existe    |
| Admin não vê todos os pedidos                      | Conta não foi marcada como admin            | Em `profiles`, mude `role` pra `admin`                                 |
