const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('🐌 Definir modo lento no canal')
    .addIntegerOption(opt =>
      opt.setName('segundos').setDescription('Intervalo em segundos (0 para desativar)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(opt => opt.setName('canal').setDescription('Canal'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,

  async execute(interaction) {
    const seconds = interaction.options.getInteger('segundos');
    const channel = interaction.options.getChannel('canal') || interaction.channel;

    try {
      await channel.setRateLimitPerUser(seconds);

      const msg = seconds === 0
        ? `Modo lento **desativado** em ${channel}.`
        : `Modo lento definido para **${seconds}s** em ${channel}.`;

      await interaction.reply({ embeds: [successEmbed(msg)] });

      const logEmbed = modLog('Slowmode', interaction.user, { tag: `#${channel.name}` }, `${seconds}s`);
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Slowmode',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        details: `#${channel.name} — ${seconds}s`,
      });
    } catch (err) {
      console.error('[SLOWMODE] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao definir slowmode.')], ephemeral: true });
    }
  },
};
