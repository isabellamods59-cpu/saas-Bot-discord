const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../utils/getSettings');
const { sendLog, saveLog } = require('../utils/logger');
const config = require('../config');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member, client) {
    const settings = await getSettings(member.guild.id);

    // Mensagem de saída
    if (settings.modules.leave && settings.leaveChannel) {
      const channel = member.guild.channels.cache.get(settings.leaveChannel);
      if (channel) {
        const msg = settings.leaveMessage
          .replace(/{user}/g, `<@${member.id}>`)
          .replace(/{username}/g, member.user.username)
          .replace(/{tag}/g, member.user.tag)
          .replace(/{server}/g, member.guild.name)
          .replace(/{memberCount}/g, member.guild.memberCount);

        const embed = new EmbedBuilder()
          .setColor(config.colors.error)
          .setTitle('😢 Membro Saiu')
          .setDescription(msg)
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .setTimestamp()
          .setFooter({ text: `${member.guild.name} • ${member.guild.memberCount} membros` });

        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Log
    if (settings.modules.logs) {
      const logEmbed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle('📤 Membro Saiu')
        .addFields(
          { name: '👤 Usuário', value: `${member.user.tag}`, inline: true },
          { name: '🆔 ID', value: member.id, inline: true },
          { name: '📅 Entrou em', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconhecido', inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      await sendLog(member.guild, logEmbed);
      await saveLog({
        guildId: member.guild.id,
        action: 'Membro saiu',
        category: 'system',
        targetId: member.id,
        targetTag: member.user.tag,
      });
    }
  },
};
