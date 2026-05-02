/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  NexaBot — Bot Discord Avançado
 *  Modular • Profissional • Seguro
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./src/config');
const connectDB = require('./src/database/connect');
const loadCommands = require('./src/handlers/commandHandler');
const loadEvents = require('./src/handlers/eventHandler');
require('./src/handlers/antiCrash');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User,
    Partials.Reaction,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.config = config;

(async () => {
  await connectDB();
  await loadCommands(client);
  await loadEvents(client);
  await client.login(config.token);
})();

module.exports = client;
