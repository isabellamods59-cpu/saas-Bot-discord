const { Schema, model } = require('mongoose');

const guildSettingsSchema = new Schema({
  guildId: { type: String, required: true, unique: true },

  // Canais
  welcomeChannel: { type: String, default: null },
  leaveChannel: { type: String, default: null },
  logChannel: { type: String, default: null },
  modLogChannel: { type: String, default: null },
  ticketLogChannel: { type: String, default: null },
  ticketCategory: { type: String, default: null },

  // Mensagens
  welcomeMessage: {
    type: String,
    default: '👋 Bem-vindo(a) ao servidor, {user}! Agora somos {memberCount} membros.',
  },
  leaveMessage: {
    type: String,
    default: '😢 {user} saiu do servidor. Agora somos {memberCount} membros.',
  },

  // Cargos automáticos
  autoRoles: [{ type: String }],

  // Moderação
  moderation: {
    enabled: { type: Boolean, default: true },
    autoWarnThreshold: { type: Number, default: 3 },
    autoPunishment: { type: String, enum: ['mute', 'kick', 'ban'], default: 'mute' },
    muteDuration: { type: String, default: '1h' },
  },

  // Anti-spam
  antiSpam: {
    enabled: { type: Boolean, default: false },
    maxMessages: { type: Number, default: 5 },
    interval: { type: Number, default: 5000 },
    punishment: { type: String, enum: ['warn', 'mute', 'kick', 'ban'], default: 'warn' },
  },

  // Anti-link
  antiLink: {
    enabled: { type: Boolean, default: false },
    whitelistedDomains: [{ type: String }],
    punishment: { type: String, enum: ['warn', 'mute', 'kick', 'delete'], default: 'delete' },
  },

  // Anti-raid
  antiRaid: {
    enabled: { type: Boolean, default: false },
    maxJoinsPerMinute: { type: Number, default: 10 },
    action: { type: String, enum: ['kick', 'ban', 'lockdown'], default: 'kick' },
  },

  // Anti-flood
  antiFlood: {
    enabled: { type: Boolean, default: false },
    maxChars: { type: Number, default: 2000 },
    punishment: { type: String, enum: ['warn', 'mute', 'delete'], default: 'delete' },
  },

  // Anti-menção em massa
  antiMassMention: {
    enabled: { type: Boolean, default: false },
    maxMentions: { type: Number, default: 5 },
    punishment: { type: String, enum: ['warn', 'mute', 'kick', 'ban'], default: 'mute' },
  },

  // Palavras proibidas
  bannedWords: {
    enabled: { type: Boolean, default: false },
    words: [{ type: String }],
    punishment: { type: String, enum: ['warn', 'mute', 'delete'], default: 'delete' },
  },

  // Tickets
  tickets: {
    enabled: { type: Boolean, default: true },
    maxPerUser: { type: Number, default: 3 },
    categories: [{
      name: { type: String },
      emoji: { type: String, default: '🎟️' },
      description: { type: String },
    }],
    supportRoles: [{ type: String }],
  },

  // RCON Minecraft
  rcon: {
    enabled: { type: Boolean, default: false },
    host: { type: String, default: '' },
    port: { type: Number, default: 25575 },
    password: { type: String, default: '' },
    chatChannel: { type: String, default: null },
  },

  // Whitelist
  whitelist: {
    users: [{ type: String }],
    roles: [{ type: String }],
    channels: [{ type: String }],
  },

  // Módulos ativos
  modules: {
    welcome: { type: Boolean, default: true },
    leave: { type: Boolean, default: true },
    moderation: { type: Boolean, default: true },
    tickets: { type: Boolean, default: true },
    protection: { type: Boolean, default: true },
    rcon: { type: Boolean, default: false },
    logs: { type: Boolean, default: true },
    autoRoles: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = model('GuildSettings', guildSettingsSchema);
