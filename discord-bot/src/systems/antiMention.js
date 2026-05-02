const { errorEmbed } = require('../utils/embeds');
const { sendLog, saveLog, modLog } = require('../utils/logger');
const Punishment = require('../database/schemas/Punishment');

module.exports = {
  async check(message, settings) {
    const { maxMentions, punishment } = settings.antiMassMention;
    const mentions = message.mentions.users.size + message.mentions.roles.size;

    if (mentions < maxMentions) return false;

    await message.delete().catch(() => {});

    const member = message.member;
    const reason = `Menção em massa detectada (${mentions} menções, max: ${maxMentions})`;

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
            embeds: [errorEmbed(`${member}, menções em massa não são permitidas.`)],
          });
          break;

        case 'mute':
          await member.timeout(300000, reason);
          break;

        case 'kick':
          await member.kick(reason);
          break;

        case 'ban':
          await member.ban({ reason });
          break;
      }
    } catch (err) {
      console.error('[ANTI-MENTION] Erro:', err.message);
    }

    const logEmbed = modLog('Anti-Menção', message.client.user, member.user, reason);
    await sendLog(message.guild, logEmbed, 'moderation');
    await saveLog({
      guildId: message.guild.id,
      action: `Anti-Menção: ${punishment}`,
      category: 'protection',
      targetId: member.id,
      targetTag: member.user.tag,
    });

    return true;
  },
};
