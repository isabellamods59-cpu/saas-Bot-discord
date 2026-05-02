const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { punishmentEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');
const { canModerate } = require('../../utils/permissions');
const Punishment = require('../../database/schemas/Punishment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Expulsar um usuário do servidor')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para expulsar').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da expulsão'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const reason = interaction.options.getString('motivo') || 'Sem motivo informado';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Usuário não encontrado.')], ephemeral: true });
    }

    if (!canModerate(interaction.member, target)) {
      return interaction.reply({ embeds: [errorEmbed('Você não pode expulsar este usuário.')], ephemeral: true });
    }

    if (!target.kickable) {
      return interaction.reply({ embeds: [errorEmbed('Não consigo expulsar este usuário.')], ephemeral: true });
    }

    try {
      await target.user.send({
        embeds: [punishmentEmbed('kick', interaction.user, target.user, reason)],
      }).catch(() => {});

      await target.kick(`${reason} | Por: ${interaction.user.tag}`);

      await Punishment.create({
        guildId: interaction.guild.id,
        odId: target.id,
        odTag: target.user.tag,
        type: 'kick',
        reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
      });

      await interaction.reply({
        embeds: [punishmentEmbed('kick', interaction.user, target.user, reason)],
      });

      const logEmbed = modLog('Kick', interaction.user, target.user, reason);
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Kick',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        targetId: target.id,
        targetTag: target.user.tag,
        details: reason,
      });
    } catch (err) {
      console.error('[KICK] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao expulsar o usuário.')], ephemeral: true });
    }
  },
};
