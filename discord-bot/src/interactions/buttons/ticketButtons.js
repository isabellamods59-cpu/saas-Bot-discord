const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, ticketLog } = require('../../utils/logger');
const { getSettings } = require('../../utils/getSettings');
const Ticket = require('../../database/schemas/Ticket');
const config = require('../../config');

module.exports = async (interaction, client) => {
  const { customId } = interaction;

  if (customId === 'ticket_reopen') {
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Ticket não encontrado.')], ephemeral: true });

    ticket.status = 'open';
    ticket.closedAt = null;
    ticket.closedBy = null;
    await ticket.save();

    await interaction.update({
      embeds: [new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} Ticket reaberto por ${interaction.user}.`)],
      components: [],
    });

    return;
  }

  if (customId === 'ticket_delete') {
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
    if (ticket) {
      ticket.status = 'deleted';
      await ticket.save();
    }

    await interaction.reply({ embeds: [successEmbed('Ticket será deletado em 5 segundos...')] });

    const logEmbed = ticketLog('Ticket Deletado', interaction.user, { channel: interaction.channel.name });
    await sendLog(interaction.guild, logEmbed, 'ticket');

    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    return;
  }

  if (customId === 'ticket_transcript') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const sorted = [...messages.values()].reverse();

      let transcript = `=== TRANSCRIPT: ${interaction.channel.name} ===\n`;
      transcript += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
      transcript += `Servidor: ${interaction.guild.name}\n`;
      transcript += '='.repeat(50) + '\n\n';

      for (const msg of sorted) {
        const time = msg.createdAt.toLocaleString('pt-BR');
        transcript += `[${time}] ${msg.author.tag}: ${msg.content || '[embed/arquivo]'}\n`;
        if (msg.attachments.size > 0) {
          msg.attachments.forEach(a => { transcript += `  📎 ${a.url}\n`; });
        }
      }

      const settings = await getSettings(interaction.guild.id);
      if (settings.ticketLogChannel) {
        const logChannel = interaction.guild.channels.cache.get(settings.ticketLogChannel);
        if (logChannel) {
          const buffer = Buffer.from(transcript, 'utf-8');
          await logChannel.send({
            embeds: [new EmbedBuilder()
              .setColor(config.colors.ticket)
              .setTitle(`📋 Transcript — ${interaction.channel.name}`)
              .setDescription(`Gerado por ${interaction.user}`)
              .setTimestamp()],
            files: [{ attachment: buffer, name: `transcript-${interaction.channel.name}.txt` }],
          });
        }
      }

      await interaction.editReply({ embeds: [successEmbed('Transcript salvo com sucesso!')] });
    } catch (err) {
      console.error('[TRANSCRIPT] Erro:', err);
      await interaction.editReply({ embeds: [errorEmbed('Erro ao gerar transcript.')] });
    }
    return;
  }

  if (customId === 'ticket_close_confirm') {
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Ticket não encontrado.')], ephemeral: true });

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closedBy = interaction.user.id;
    await ticket.save();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reabrir').setStyle(ButtonStyle.Success).setEmoji('🔓'),
      new ButtonBuilder().setCustomId('ticket_delete').setLabel('Deletar').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
      new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📋'),
    );

    const rateRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rate_1').setLabel('1').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
      new ButtonBuilder().setCustomId('rate_2').setLabel('2').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
      new ButtonBuilder().setCustomId('rate_3').setLabel('3').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
      new ButtonBuilder().setCustomId('rate_4').setLabel('4').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
      new ButtonBuilder().setCustomId('rate_5').setLabel('5').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
    );

    await interaction.update({
      embeds: [new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`${config.emojis.lock} Ticket Fechado`)
        .setDescription(`Fechado por ${interaction.user}.\nAvalie o atendimento com as estrelas abaixo.`)
        .setTimestamp()],
      components: [row, rateRow],
    });

    const logEmbed = ticketLog('Ticket Fechado', interaction.user, { channel: interaction.channel.name });
    await sendLog(interaction.guild, logEmbed, 'ticket');
    return;
  }
};
