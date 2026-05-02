# 🤖 NexaBot — Bot Discord Avançado

> Bot Discord completo, modular e profissional. Desenvolvido em Node.js com discord.js v14.

## ✨ Funcionalidades

### 🛠️ Moderação Avançada
- `/ban`, `/unban`, `/kick`, `/mute`, `/unmute`
- `/warn`, `/warnings` — Sistema de avisos com auto-punição
- `/clear` — Limpar mensagens (filtro por usuário)
- `/lock`, `/unlock` — Bloquear/desbloquear canais
- `/slowmode` — Modo lento configurável

### 🛡️ Sistema de Proteção
- **Anti-Spam** — Detecção inteligente de spam
- **Anti-Link** — Bloqueio de links com whitelist de domínios
- **Anti-Raid** — Detecção automática de raids (kick/ban/lockdown)
- **Anti-Flood** — Limite de caracteres por mensagem
- **Anti-Menção em Massa** — Limite de menções
- **Anti-Palavrão** — Lista configurável de palavras proibidas
- **Whitelist** — Usuários/cargos/canais isentos

### 🎟️ Sistema de Tickets
- Painel interativo com categorias
- Criação automática de canais privados
- Transcript (salvar conversa)
- Avaliação por estrelas (1-5)
- Limite de tickets por usuário
- Logs completos de tickets

### 👑 Painel Admin (`/paineladmin`)
- Configurar canais (boas-vindas, saída, logs, mod logs, tickets)
- Configurar mensagens com variáveis
- Ativar/desativar módulos com botões
- Configurar proteção
- Cargos automáticos
- Interface com embeds, botões e menus

### 🧑‍💻 Painel Dev (`/devpainel`)
- Reiniciar bot
- Recarregar comandos
- Limpar cache
- Ver logs avançados
- Mensagem global para todos os servidores
- Eval/Debug
- Estatísticas do banco de dados
- Listar servidores

### 🌐 RCON Minecraft
- Conectar servidor via IP + senha
- Enviar comandos remotamente
- Ban/unban de jogadores via Discord
- Listar jogadores online
- Canal de integração chat

### ⚙️ Configuração por Servidor
- `/configurar` — Configuração rápida via comandos
- Todas configurações salvas no MongoDB
- Multi-guild independente
- Sistema de módulos ativáveis

### 📊 Sistema de Logs
- Entradas e saídas de membros
- Punições (ban, kick, mute, warn)
- Tickets (abertura, fechamento, avaliação)
- Comandos executados
- Alterações de configuração
- Eventos de proteção

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- MongoDB
- Token do bot Discord

### Passos

1. **Clone o repositório**
```bash
git clone <repo-url>
cd discord-bot
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o `.env`**
```bash
cp .env.example .env
# Edite o .env com seu token, client ID e dev ID
```

4. **Inicie o bot**
```bash
npm start
# ou para desenvolvimento:
npm run dev
```

## 📁 Estrutura do Projeto

```
discord-bot/
├── index.js                    # Entry point
├── package.json
├── .env.example
├── src/
│   ├── config.js               # Configurações globais
│   ├── handlers/
│   │   ├── commandHandler.js   # Carregador de comandos
│   │   ├── eventHandler.js     # Carregador de eventos
│   │   └── antiCrash.js        # Sistema anti-crash
│   ├── database/
│   │   ├── connect.js          # Conexão MongoDB
│   │   └── schemas/
│   │       ├── GuildSettings.js
│   │       ├── Punishment.js
│   │       ├── Ticket.js
│   │       └── ActionLog.js
│   ├── events/
│   │   ├── ready.js
│   │   ├── messageCreate.js
│   │   ├── interactionCreate.js
│   │   ├── guildMemberAdd.js
│   │   └── guildMemberRemove.js
│   ├── commands/
│   │   ├── moderation/        # 11 comandos
│   │   ├── admin/             # Painel admin
│   │   ├── dev/               # Painel dev
│   │   ├── tickets/           # Sistema de tickets
│   │   ├── rcon/              # Integração Minecraft
│   │   └── config/            # Configurações
│   ├── systems/
│   │   ├── antiSpam.js
│   │   ├── antiLink.js
│   │   ├── antiRaid.js
│   │   ├── antiFlood.js
│   │   ├── antiMention.js
│   │   └── bannedWords.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── permissions.js
│   │   ├── embeds.js
│   │   ├── cooldown.js
│   │   └── getSettings.js
│   └── interactions/
│       ├── buttons/
│       ├── menus/
│       └── modals/
```

## 🔧 Variáveis do `.env`

| Variável | Descrição |
|---|---|
| `DISCORD_TOKEN` | Token do bot |
| `CLIENT_ID` | ID do cliente/aplicação |
| `DEV_ID` | ID do desenvolvedor (acesso ao /devpainel) |
| `MONGO_URI` | URI do MongoDB |
| `PREFIX` | Prefixo opcional para comandos de texto |

## 📝 Variáveis de Mensagem

Use nas mensagens de boas-vindas e saída:
- `{user}` — Menção do usuário
- `{username}` — Nome do usuário
- `{tag}` — Tag completa (user#0000)
- `{server}` — Nome do servidor
- `{memberCount}` — Total de membros

## 🔒 Segurança

- Token armazenado em variável de ambiente
- Sistema anti-crash com tratamento global de erros
- Verificação de permissões em todos os comandos
- Proteção contra exploits (anti-spam, anti-raid, etc.)
- Sistema de whitelist para exceções
- Painel dev restrito por ID

## 📄 Licença

MIT
