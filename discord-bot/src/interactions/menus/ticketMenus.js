const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, ticketLog } = require('../../utils/logger');
const { getSettings } = require('../../utils/getSettings');
const Ticket = require('../../database/schemas/Ticket');
const config = require('../../config');

module.exports = async (interaction, client) => {
  const category = interaction.values[0];
  const settings = await getSettings(interaction.guild.id);

  // Verificar limite de tickets
  const openTickets = await Ticket.countDocuments({
    guildId: interaction.guild.id,
    userId: interaction.user.id,
    status: 'open',
  });

  if (openTickets >= settings.tickets.maxPerUser) {
    return interaction.reply({
      embeds: [errorEmbed(`Você já possui **${openTickets}** ticket(s) aberto(s). Máximo: **${settings.tickets.maxPerUser}**`)],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}-${Date.now().toString(36)}`,
      type: ChannelType.GuildText,
      parent: settings.ticketCategory || null,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
          ],
        },
        ...settings.tickets.supportRoles.map(roleId => ({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        })),
      ],
    });

    await Ticket.create({
      guildId: interaction.guild.id,
      channelId: ticketChannel.id,
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      category,
    });

    const categoryData = settings.tickets.categories.find(c => c.name.toLowerCase() === category) ||
      { name: category, emoji: '🎟️' };

    const embed = new EmbedBuilder()
      .setColor(config.colors.ticket)
      .setTitle(`${categoryData.emoji} Ticket — ${categoryData.name}`)
      .setDescription(
        `Olá ${interaction.user}! Bem-vindo ao seu ticket.\n\n` +
        '**Descreva seu problema ou solicitação abaixo.**\n' +
        'Nossa equipe responderá o mais rápido possível.\n\n' +
        `📂 **Categoria:** ${categoryData.name}\n` +
        `📅 **Aberto em:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      )
      .setFooter({ text: 'NexaBot • Tickets' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
    );

    await ticketChannel.send({
      content: `${interaction.user} ${settings.tickets.supportRoles.map(r => `<@&${r}>`).join(' ')}`,
      embeds: [embed],
      components: [row],
    });

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} Ticket criado! Vá para ${ticketChannel}`)],
    });

    const logEmbed = ticketLog('Ticket Aberto', interaction.user, { category: categoryData.name, channel: `#${ticketChannel.name}` });
    await sendLog(interaction.guild, logEmbed, 'ticket');
    await saveLog({
      guildId: interaction.guild.id,
      action: 'Ticket aberto',
      category: 'ticket',
      executorId: interaction.user.id,
      executorTag: interaction.user.tag,
      details: `Categoria: ${categoryData.name}`,
    });
  } catch (err) {
    console.error('[TICKET] Erro ao criar ticket:', err);
    await interaction.editReply({ embeds: [errorEmbed('Erro ao criar ticket.')] });
  }
};
