const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { punishmentEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');
const { getSettings } = require('../../utils/getSettings');
const Punishment = require('../../database/schemas/Punishment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚡ Dar um aviso a um usuário')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para avisar').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do aviso'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 3,

  async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const reason = interaction.options.getString('motivo') || 'Sem motivo informado';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Usuário não encontrado.')], ephemeral: true });
    }

    if (target.user.bot) {
      return interaction.reply({ embeds: [errorEmbed('Não é possível avisar bots.')], ephemeral: true });
    }

    try {
      await Punishment.create({
        guildId: interaction.guild.id,
        odId: target.id,
        odTag: target.user.tag,
        type: 'warn',
        reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
      });

      const warnings = await Punishment.countDocuments({
        guildId: interaction.guild.id,
        odId: target.id,
        type: 'warn',
      });

      await target.user.send({
        embeds: [punishmentEmbed('warn', interaction.user, target.user, reason, { warnings })],
      }).catch(() => {});

      await interaction.reply({
        embeds: [punishmentEmbed('warn', interaction.user, target.user, reason, { warnings })],
      });

      // Auto-punição
      const settings = await getSettings(interaction.guild.id);
      if (settings.moderation.enabled && warnings >= settings.moderation.autoWarnThreshold) {
        const autoPunishment = settings.moderation.autoPunishment;
        const muteMs = require('ms')(settings.moderation.muteDuration || '1h');

        switch (autoPunishment) {
          case 'mute':
            if (target.moderatable) {
              await target.timeout(muteMs, `Auto-punição: ${warnings} avisos`);
            }
            break;
          case 'kick':
            if (target.kickable) {
              await target.kick(`Auto-punição: ${warnings} avisos`);
            }
            break;
          case 'ban':
            if (target.bannable) {
              await target.ban({ reason: `Auto-punição: ${warnings} avisos` });
            }
            break;
        }

        await interaction.followUp({
          embeds: [errorEmbed(`${target} atingiu **${warnings}** avisos e recebeu auto-punição: **${autoPunishment}**`)],
        });
      }

      const logEmbed = modLog('Warn', interaction.user, target.user, reason);
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Warn',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        targetId: target.id,
        targetTag: target.user.tag,
        details: `${reason} | Total: ${warnings}`,
      });
    } catch (err) {
      console.error('[WARN] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao aplicar o aviso.')], ephemeral: true });
    }
  },
};
