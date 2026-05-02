const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Bloquear envio de mensagens no canal')
    .addChannelOption(opt => opt.setName('canal').setDescription('Canal para bloquear'))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal') || interaction.channel;
    const reason = interaction.options.getString('motivo') || 'Sem motivo informado';

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
      });

      await interaction.reply({
        embeds: [successEmbed(`${channel} foi **bloqueado**. Motivo: ${reason}`)],
      });

      const logEmbed = modLog('Lock', interaction.user, { tag: `#${channel.name}` }, reason);
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Lock',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        details: `#${channel.name} — ${reason}`,
      });
    } catch (err) {
      console.error('[LOCK] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao bloquear o canal.')], ephemeral: true });
    }
  },
};
