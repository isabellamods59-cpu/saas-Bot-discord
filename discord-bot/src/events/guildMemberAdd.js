const { EmbedBuilder } = require('discord.js');
const { getSettings } = require('../utils/getSettings');
const { sendLog, saveLog } = require('../utils/logger');
const config = require('../config');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    const settings = await getSettings(member.guild.id);

    // Anti-raid check
    if (settings.modules.protection && settings.antiRaid.enabled) {
      const antiRaid = require('../systems/antiRaid');
      const blocked = await antiRaid.checkJoin(member, settings);
      if (blocked) return;
    }

    // Auto-roles
    if (settings.modules.autoRoles && settings.autoRoles.length > 0) {
      try {
        for (const roleId of settings.autoRoles) {
          const role = member.guild.roles.cache.get(roleId);
          if (role && role.position < member.guild.members.me.roles.highest.position) {
            await member.roles.add(role).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[AUTO-ROLE] Erro:', err.message);
      }
    }

    // Mensagem de boas-vindas
    if (settings.modules.welcome && settings.welcomeChannel) {
      const channel = member.guild.channels.cache.get(settings.welcomeChannel);
      if (channel) {
        const msg = settings.welcomeMessage
          .replace(/{user}/g, `<@${member.id}>`)
          .replace(/{username}/g, member.user.username)
          .replace(/{tag}/g, member.user.tag)
          .replace(/{server}/g, member.guild.name)
          .replace(/{memberCount}/g, member.guild.memberCount);

        const embed = new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle('👋 Novo Membro!')
          .setDescription(msg)
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .setTimestamp()
          .setFooter({ text: `${member.guild.name} • Membro #${member.guild.memberCount}` });

        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Log
    if (settings.modules.logs) {
      const logEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('📥 Membro Entrou')
        .addFields(
          { name: '👤 Usuário', value: `${member} (${member.user.tag})`, inline: true },
          { name: '🆔 ID', value: member.id, inline: true },
          { name: '📅 Conta Criada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      await sendLog(member.guild, logEmbed);
      await saveLog({
        guildId: member.guild.id,
        action: 'Membro entrou',
        category: 'system',
        targetId: member.id,
        targetTag: member.user.tag,
      });
    }
  },
};
