require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  devId: process.env.DEV_ID || '',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/nexabot',
  prefix: process.env.PREFIX || '!',

  colors: {
    primary: 0x7C3AED,
    success: 0x22C55E,
    error: 0xEF4444,
    warning: 0xF59E0B,
    info: 0x3B82F6,
    moderation: 0xFF6B6B,
    ticket: 0x06B6D4,
    rcon: 0x10B981,
  },

  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    ban: '🔨',
    kick: '👢',
    mute: '🔇',
    warn: '⚡',
    ticket: '🎟️',
    lock: '🔒',
    unlock: '🔓',
    trash: '🗑️',
    config: '⚙️',
    shield: '🛡️',
    star: '⭐',
    log: '📋',
    dev: '🧑‍💻',
    rcon: '🌐',
    admin: '👑',
  },
};
