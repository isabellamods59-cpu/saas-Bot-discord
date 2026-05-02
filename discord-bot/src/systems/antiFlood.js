const { errorEmbed } = require('../utils/embeds');
const { sendLog, saveLog, modLog } = require('../utils/logger');
const Punishment = require('../database/schemas/Punishment');

module.exports = {
  async check(message, settings) {
    const { maxChars, punishment } = settings.antiFlood;

    if (message.content.length < maxChars) return false;

    await message.delete().catch(() => {});

    const member = message.member;
    const reason = `Flood detectado (${message.content.length} caracteres, max: ${maxChars})`;

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
            embeds: [errorEmbed(`${member}, mensagens muito longas não são permitidas.`)],
          });
          break;

        case 'mute':
          await member.timeout(60000, reason);
          break;

        case 'delete':
          await message.channel.send({
            embeds: [errorEmbed(`${member}, mensagem removida por flood.`)],
          });
          break;
      }
    } catch (err) {
      console.error('[ANTI-FLOOD] Erro:', err.message);
    }

    const logEmbed = modLog('Anti-Flood', message.client.user, member.user, reason);
    await sendLog(message.guild, logEmbed, 'moderation');
    await saveLog({
      guildId: message.guild.id,
      action: `Anti-Flood: ${punishment}`,
      category: 'protection',
      targetId: member.id,
      targetTag: member.user.tag,
    });

    return true;
  },
};
