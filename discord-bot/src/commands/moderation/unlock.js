const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Desbloquear envio de mensagens no canal')
    .addChannelOption(opt => opt.setName('canal').setDescription('Canal para desbloquear'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal') || interaction.channel;

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null,
      });

      await interaction.reply({
        embeds: [successEmbed(`${channel} foi **desbloqueado**.`)],
      });

      const logEmbed = modLog('Unlock', interaction.user, { tag: `#${channel.name}` }, 'Canal desbloqueado');
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Unlock',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        details: `#${channel.name}`,
      });
    } catch (err) {
      console.error('[UNLOCK] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao desbloquear o canal.')], ephemeral: true });
    }
  },
};
