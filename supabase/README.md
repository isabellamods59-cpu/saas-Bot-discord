# Supabase setup — NexaBots V2

Tudo que você precisa pra conectar a NexaBots ao Supabase.

## 1. Crie um projeto Supabase

1. Vá em https://supabase.com → **Sign in** com Google/GitHub.
2. **New project** → escolha:
   - Nome: `nexabots` (ou qualquer)
   - Senha do banco: gere uma forte (você não vai usar diretamente)
   - Região: `South America (São Paulo)` (mais próximo do Brasil)
   - Plano: **Free** já é suficiente.
3. Aguarde 1-2 minutos enquanto o Supabase provisiona.

## 2. Aplique o schema

1. No projeto, abra **SQL Editor** (ícone `< >` na sidebar) → **New query**.
2. Copie e cole o conteúdo de [`schema.sql`](./schema.sql).
3. Clique em **RUN**. Você deve ver `Success. No rows returned`.

## 3. Carregue os produtos iniciais

1. **SQL Editor** → **New query**.
2. Cole [`seed.sql`](./seed.sql) e rode.
3. Confira em **Table Editor** → `products` que existem ~17 produtos cadastrados.

## 4. Pegue suas chaves

1. **Settings** (engrenagem) → **API**.
2. Copie:
   - **Project URL** → `https://abcdefgh.supabase.co`
   - **anon public** key → JWT longo começando com `eyJ...`
3. Cole essas duas chaves em `js/config.js` na raiz do projeto.

## 5. (Opcional) Crie o admin

Por padrão o sistema marca como admin qualquer usuário com email `admin@nexabots.app`. Você tem duas opções:

### Opção A — registre normalmente
- Acesse `register.html` e cadastre uma conta com email `admin@nexabots.app` (qualquer username/senha de 6+ caracteres).
- Pronto: o trigger `handle_new_user` já vai marcar como admin.

### Opção B — promova um usuário existente
- **Table Editor** → `profiles` → encontre seu usuário → mude `role` de `user` pra `admin`.

## 6. (Opcional) Configurações de Auth

Para experiência mais suave em desenvolvimento:

- **Authentication** → **Providers** → **Email**: desabilite **Confirm email** (senão o usuário precisa confirmar antes de logar).
- **Authentication** → **URL Configuration**: adicione seu domínio local em **Site URL** (ex: `http://localhost:8080`).

## Estrutura

| Tabela           | Função                                           |
|------------------|--------------------------------------------------|
| `profiles`       | Perfil público (1-1 com `auth.users`)            |
| `products`       | Catálogo unificado (bots, cursos, jogos, ...)    |
| `purchases`      | Pedidos de cada usuário                          |
| `activity_logs`  | Histórico de eventos para auditoria              |
| `notifications`  | Central de notificações in-app                   |

## RLS — segurança

- **profiles**: leitura pública (perfis), escrita só do próprio dono ou admin.
- **products**: leitura pública (apenas ativos), escrita só admin.
- **purchases**: usuário só vê os próprios pedidos; admin vê tudo.
- **activity_logs**: usuário só vê seu próprio log; admin vê tudo.
- **notifications**: usuário só vê / marca como lidas as próprias.
