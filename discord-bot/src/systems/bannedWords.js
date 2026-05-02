const { errorEmbed } = require('../utils/embeds');
const { sendLog, saveLog, modLog } = require('../utils/logger');
const Punishment = require('../database/schemas/Punishment');

module.exports = {
  async check(message, settings) {
    const { words, punishment } = settings.bannedWords;
    if (!words || words.length === 0) return false;

    const content = message.content.toLowerCase();
    const found = words.filter(w => content.includes(w.toLowerCase()));

    if (found.length === 0) return false;

    await message.delete().catch(() => {});

    const member = message.member;
    const reason = `Palavra proibida detectada`;

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
            embeds: [errorEmbed(`${member}, sua mensagem continha conteúdo proibido.`)],
          });
          break;

        case 'mute':
          await member.timeout(60000, reason);
          break;

        case 'delete':
          await message.channel.send({
            embeds: [errorEmbed(`${member}, sua mensagem foi removida por conteúdo proibido.`)],
          });
          break;
      }
    } catch (err) {
      console.error('[BANNED-WORDS] Erro:', err.message);
    }

    const logEmbed = modLog('Anti-Palavrão', message.client.user, member.user, reason);
    await sendLog(message.guild, logEmbed, 'moderation');
    await saveLog({
      guildId: message.guild.id,
      action: `Anti-Palavrão: ${punishment}`,
      category: 'protection',
      targetId: member.id,
      targetTag: member.user.tag,
    });

    return true;
  },
};
