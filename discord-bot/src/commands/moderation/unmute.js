const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { punishmentEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');
const Punishment = require('../../database/schemas/Punishment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔊 Remover silenciamento de um usuário')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para desmutar').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('Motivo'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 3,

  async execute(interaction) {
    const target = interaction.options.getMember('usuario');
    const reason = interaction.options.getString('motivo') || 'Sem motivo informado';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Usuário não encontrado.')], ephemeral: true });
    }

    if (!target.isCommunicationDisabled()) {
      return interaction.reply({ embeds: [errorEmbed('Este usuário não está silenciado.')], ephemeral: true });
    }

    try {
      await target.timeout(null, `${reason} | Por: ${interaction.user.tag}`);

      await Punishment.create({
        guildId: interaction.guild.id,
        odId: target.id,
        odTag: target.user.tag,
        type: 'unmute',
        reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
      });

      await interaction.reply({
        embeds: [punishmentEmbed('unmute', interaction.user, target.user, reason)],
      });

      const logEmbed = modLog('Unmute', interaction.user, target.user, reason);
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Unmute',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        targetId: target.id,
        targetTag: target.user.tag,
        details: reason,
      });
    } catch (err) {
      console.error('[UNMUTE] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao desmutar o usuário.')], ephemeral: true });
    }
  },
};
