const { Collection } = require('discord.js');
const { errorEmbed } = require('../utils/embeds');
const { sendLog, saveLog, modLog } = require('../utils/logger');
const Punishment = require('../database/schemas/Punishment');

const messageCache = new Collection();

async function applyPunishment(message, settings, reason) {
  const { punishment } = settings.antiSpam;
  const member = message.member;

  try {
    switch (punishment) {
      case 'warn':
        await Punishment.create({
          guildId: message.guild.id,
          odId: member.id,
          odTag: member.user.tag,
          type: 'warn',
          reason,
          moderatorId: message.client.user.id,
          moderatorTag: message.client.user.tag,
        });
        await message.channel.send({
          embeds: [errorEmbed(`${member}, você foi avisado por **spam**.`)],
        });
        break;

      case 'mute':
        await member.timeout(60000, reason);
        break;

      case 'kick':
        await member.kick(reason);
        break;

      case 'ban':
        await member.ban({ reason });
        break;
    }

    const logEmbed = modLog('Anti-Spam', message.client.user, member.user, reason);
    await sendLog(message.guild, logEmbed, 'moderation');
    await saveLog({
      guildId: message.guild.id,
      action: `Anti-Spam: ${punishment}`,
      category: 'protection',
      targetId: member.id,
      targetTag: member.user.tag,
      details: reason,
    });
  } catch (err) {
    console.error('[ANTI-SPAM] Erro ao aplicar punição:', err.message);
  }
}

module.exports = {
  async check(message, settings) {
    const key = `${message.guild.id}-${message.author.id}`;
    const { maxMessages, interval } = settings.antiSpam;

    if (!messageCache.has(key)) {
      messageCache.set(key, []);
    }

    const timestamps = messageCache.get(key);
    const now = Date.now();

    timestamps.push(now);

    const filtered = timestamps.filter(t => now - t < interval);
    messageCache.set(key, filtered);

    if (filtered.length >= maxMessages) {
      messageCache.delete(key);
      await message.delete().catch(() => {});
      await applyPunishment(message, settings, `Spam detectado (${maxMessages} msgs em ${interval / 1000}s)`);
      return true;
    }

    return false;
  },
};
