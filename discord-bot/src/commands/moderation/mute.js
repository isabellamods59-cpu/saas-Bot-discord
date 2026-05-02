const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const { punishmentEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');
const { canModerate } = require('../../utils/permissions');
const Punishment = require('../../database/schemas/Punishment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Silenciar um usuário')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para silenciar').setRequired(true))
    .addStringOption(opt => opt.setName('duracao').setDescription('Duração (ex: 10m, 1h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do mute'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const duration = interaction.options.getString('duracao');
    const reason = interaction.options.getString('motivo') || 'Sem motivo informado';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Usuário não encontrado.')], ephemeral: true });
    }

    if (!canModerate(interaction.member, target)) {
      return interaction.reply({ embeds: [errorEmbed('Você não pode silenciar este usuário.')], ephemeral: true });
    }

    const durationMs = ms(duration);
    if (!durationMs || durationMs < 1000 || durationMs > 2419200000) {
      return interaction.reply({ embeds: [errorEmbed('Duração inválida. Use: 10m, 1h, 1d (máx 28 dias)')], ephemeral: true });
    }

    try {
      await target.timeout(durationMs, `${reason} | Por: ${interaction.user.tag}`);

      await Punishment.create({
        guildId: interaction.guild.id,
        odId: target.id,
        odTag: target.user.tag,
        type: 'mute',
        reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        duration,
        expiresAt: new Date(Date.now() + durationMs),
      });

      await target.user.send({
        embeds: [punishmentEmbed('mute', interaction.user, target.user, reason, { duration })],
      }).catch(() => {});

      await interaction.reply({
        embeds: [punishmentEmbed('mute', interaction.user, target.user, reason, { duration })],
      });

      const logEmbed = modLog('Mute', interaction.user, target.user, reason, { duration });
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Mute',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        targetId: target.id,
        targetTag: target.user.tag,
        details: `${reason} | Duração: ${duration}`,
      });
    } catch (err) {
      console.error('[MUTE] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao silenciar o usuário.')], ephemeral: true });
    }
  },
};
