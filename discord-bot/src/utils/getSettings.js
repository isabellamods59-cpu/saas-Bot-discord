const GuildSettings = require('../database/schemas/GuildSettings');

async function getSettings(guildId) {
  let settings = await GuildSettings.findOne({ guildId });
  if (!settings) {
    settings = await GuildSettings.create({ guildId });
  }
  return settings;
}

module.exports = { getSettings };
