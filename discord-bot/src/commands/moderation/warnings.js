const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../../utils/embeds');
const Punishment = require('../../database/schemas/Punishment');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('📋 Ver avisos de um usuário')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para verificar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');

    try {
      const warnings = await Punishment.find({
        guildId: interaction.guild.id,
        odId: target.id,
        type: 'warn',
      }).sort({ createdAt: -1 }).limit(10);

      if (warnings.length === 0) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`${config.emojis.success} **${target.tag}** não possui avisos.`)],
          ephemeral: true,
        });
      }

      const totalWarnings = await Punishment.countDocuments({
        guildId: interaction.guild.id,
        odId: target.id,
        type: 'warn',
      });

      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`${config.emojis.warn} Avisos de ${target.tag}`)
        .setThumbnail(target.displayAvatarURL({ size: 128 }))
        .setDescription(`Total de avisos: **${totalWarnings}**`)
        .setTimestamp()
        .setFooter({ text: 'NexaBot • Moderação' });

      warnings.forEach((w, i) => {
        embed.addFields({
          name: `#${i + 1} — ${w.createdAt.toLocaleDateString('pt-BR')}`,
          value: `**Motivo:** ${w.reason}\n**Por:** <@${w.moderatorId}>`,
        });
      });

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[WARNINGS] Erro:', err);
      await interaction.reply({ embeds: [errorEmbed('Erro ao buscar avisos.')], ephemeral: true });
    }
  },
};
