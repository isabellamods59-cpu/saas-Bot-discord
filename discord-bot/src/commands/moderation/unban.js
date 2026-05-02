const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, punishmentEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');
const Punishment = require('../../database/schemas/Punishment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('🔓 Desbanir um usuário')
    .addStringOption(opt => opt.setName('id').setDescription('ID do usuário para desbanir').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do unban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,

  async execute(interaction) {
    const userId = interaction.options.getString('id');
    const reason = interaction.options.getString('motivo') || 'Sem motivo informado';

    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban) {
        return interaction.reply({ embeds: [errorEmbed('Este usuário não está banido.')], ephemeral: true });
      }

      await interaction.guild.bans.remove(userId, reason);

      await Punishment.create({
        guildId: interaction.guild.id,
        odId: userId,
        odTag: ban.user.tag,
        type: 'unban',
        reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
      });

      await interaction.reply({
        embeds: [punishmentEmbed('unban', interaction.user, ban.user, reason)],
      });

      const logEmbed = modLog('Unban', interaction.user, ban.user, reason);
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Unban',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        targetId: userId,
        targetTag: ban.user.tag,
        details: reason,
      });
    } catch (err) {
      console.error('[UNBAN] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao desbanir o usuário. Verifique o ID.')], ephemeral: true });
    }
  },
};
