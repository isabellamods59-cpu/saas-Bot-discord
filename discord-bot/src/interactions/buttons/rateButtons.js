const { EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const Ticket = require('../../database/schemas/Ticket');
const config = require('../../config');

module.exports = async (interaction, client) => {
  const { customId } = interaction;
  const rating = parseInt(customId.split('_')[1]);

  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('Ticket não encontrado.')], ephemeral: true });
  }

  if (ticket.userId !== interaction.user.id) {
    return interaction.reply({ embeds: [errorEmbed('Apenas o criador do ticket pode avaliar.')], ephemeral: true });
  }

  if (ticket.rating) {
    return interaction.reply({ embeds: [errorEmbed('Você já avaliou este ticket.')], ephemeral: true });
  }

  ticket.rating = rating;
  await ticket.save();

  const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.star} Avaliação Registrada`)
      .setDescription(`Obrigado pela avaliação!\n\n${stars} (${rating}/5)`)
      .setTimestamp()],
    ephemeral: true,
  });
};
