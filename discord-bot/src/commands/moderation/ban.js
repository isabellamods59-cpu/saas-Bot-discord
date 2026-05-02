const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { punishmentEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');
const { canModerate } = require('../../utils/permissions');
const Punishment = require('../../database/schemas/Punishment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Banir um usuário do servidor')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para banir').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do ban'))
    .addIntegerOption(opt => opt.setName('dias').setDescription('Dias de mensagens para deletar (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const reason = interaction.options.getString('motivo') || 'Sem motivo informado';
    const days = interaction.options.getInteger('dias') || 0;

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Usuário não encontrado no servidor.')], ephemeral: true });
    }

    if (!canModerate(interaction.member, target)) {
      return interaction.reply({ embeds: [errorEmbed('Você não pode banir este usuário.')], ephemeral: true });
    }

    if (!target.bannable) {
      return interaction.reply({ embeds: [errorEmbed('Não consigo banir este usuário.')], ephemeral: true });
    }

    try {
      // DM ao usuário
      await target.user.send({
        embeds: [punishmentEmbed('ban', interaction.user, target.user, reason)],
      }).catch(() => {});

      await target.ban({ deleteMessageDays: days, reason: `${reason} | Por: ${interaction.user.tag}` });

      await Punishment.create({
        guildId: interaction.guild.id,
        odId: target.id,
        odTag: target.user.tag,
        type: 'ban',
        reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
      });

      await interaction.reply({
        embeds: [punishmentEmbed('ban', interaction.user, target.user, reason)],
      });

      const logEmbed = modLog('Ban', interaction.user, target.user, reason);
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Ban',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        targetId: target.id,
        targetTag: target.user.tag,
        details: reason,
      });
    } catch (err) {
      console.error('[BAN] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao banir o usuário.')], ephemeral: true });
    }
  },
};
