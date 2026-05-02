const { errorEmbed } = require('../utils/embeds');
const { sendLog, saveLog, modLog } = require('../utils/logger');
const Punishment = require('../database/schemas/Punishment');

const URL_REGEX = /https?:\/\/[^\s]+/gi;

module.exports = {
  async check(message, settings) {
    const urls = message.content.match(URL_REGEX);
    if (!urls || urls.length === 0) return false;

    const whitelisted = settings.antiLink.whitelistedDomains || [];
    const blocked = urls.filter(url => {
      try {
        const domain = new URL(url).hostname;
        return !whitelisted.some(w => domain.includes(w));
      } catch {
        return true;
      }
    });

    if (blocked.length === 0) return false;

    await message.delete().catch(() => {});

    const { punishment } = settings.antiLink;
    const member = message.member;
    const reason = 'Link não autorizado detectado';

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
            embeds: [errorEmbed(`${member}, links não são permitidos neste servidor.`)],
          });
          break;

        case 'mute':
          await member.timeout(60000, reason);
          break;

        case 'kick':
          await member.kick(reason);
          break;

        case 'delete':
          await message.channel.send({
            embeds: [errorEmbed(`${member}, links não são permitidos aqui.`)],
          });
          break;
      }
    } catch (err) {
      console.error('[ANTI-LINK] Erro:', err.message);
    }

    const logEmbed = modLog('Anti-Link', message.client.user, member.user, reason);
    await sendLog(message.guild, logEmbed, 'moderation');
    await saveLog({
      guildId: message.guild.id,
      action: `Anti-Link: ${punishment}`,
      category: 'protection',
      targetId: member.id,
      targetTag: member.user.tag,
      details: `Links bloqueados: ${blocked.join(', ')}`,
    });

    return true;
  },
};
