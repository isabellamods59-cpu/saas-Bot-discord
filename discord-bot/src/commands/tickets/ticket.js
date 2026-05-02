const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
} = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, ticketLog } = require('../../utils/logger');
const { getSettings } = require('../../utils/getSettings');
const Ticket = require('../../database/schemas/Ticket');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎟️ Sistema de tickets')
    .addSubcommand(sub =>
      sub.setName('painel')
        .setDescription('📋 Enviar painel de abertura de tickets'))
    .addSubcommand(sub =>
      sub.setName('fechar')
        .setDescription('🔒 Fechar o ticket atual'))
    .addSubcommand(sub =>
      sub.setName('deletar')
        .setDescription('🗑️ Deletar o ticket atual'))
    .addSubcommand(sub =>
      sub.setName('adicionar')
        .setDescription('➕ Adicionar usuário ao ticket')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remover')
        .setDescription('➖ Remover usuário do ticket')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getSettings(interaction.guild.id);

    if (!settings.modules.tickets) {
      return interaction.reply({ embeds: [errorEmbed('O sistema de tickets está desativado.')], ephemeral: true });
    }

    switch (sub) {
      case 'painel':
        return sendTicketPanel(interaction, settings);
      case 'fechar':
        return closeTicket(interaction);
      case 'deletar':
        return deleteTicket(interaction);
      case 'adicionar':
        return addUserToTicket(interaction);
      case 'remover':
        return removeUserFromTicket(interaction);
    }
  },
};

async function sendTicketPanel(interaction, settings) {
  const categories = settings.tickets.categories.length > 0
    ? settings.tickets.categories
    : [
      { name: 'Suporte', emoji: '💬', description: 'Dúvidas e ajuda geral' },
      { name: 'Compra', emoji: '🛒', description: 'Compras e pagamentos' },
      { name: 'Denúncia', emoji: '🚨', description: 'Reportar problemas' },
      { name: 'Outro', emoji: '📝', description: 'Outros assuntos' },
    ];

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`${config.emojis.ticket} Central de Tickets`)
    .setDescription(
      '**Precisa de ajuda?** Abra um ticket!\n\n' +
      'Selecione a categoria do seu ticket abaixo.\n' +
      'Nossa equipe responderá o mais rápido possível.\n\n' +
      categories.map(c => `${c.emoji} **${c.name}** — ${c.description}`).join('\n'),
    )
    .setFooter({ text: 'NexaBot • Sistema de Tickets' })
    .setTimestamp();

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_category_select')
    .setPlaceholder('📂 Selecione a categoria do ticket')
    .addOptions(categories.map(c => ({
      label: c.name,
      value: c.name.toLowerCase(),
      description: c.description,
      emoji: c.emoji,
    })));

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.channel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ embeds: [successEmbed('Painel de tickets enviado!')], ephemeral: true });
}

async function closeTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('Este canal não é um ticket aberto.')], ephemeral: true });
  }

  ticket.status = 'closed';
  ticket.closedAt = new Date();
  ticket.closedBy = interaction.user.id;
  await ticket.save();

  const embed = new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle(`${config.emojis.lock} Ticket Fechado`)
    .setDescription(`Ticket fechado por ${interaction.user}.\nO ticket será deletado em 10 segundos.`)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reabrir').setStyle(ButtonStyle.Success).setEmoji('🔓'),
    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Deletar').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
    new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📋'),
  );

  // Avaliação
  const rateRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('rate_1').setLabel('1').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
    new ButtonBuilder().setCustomId('rate_2').setLabel('2').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
    new ButtonBuilder().setCustomId('rate_3').setLabel('3').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
    new ButtonBuilder().setCustomId('rate_4').setLabel('4').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
    new ButtonBuilder().setCustomId('rate_5').setLabel('5').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
  );

  await interaction.reply({ embeds: [embed], components: [row, rateRow] });

  const logEmbed = ticketLog('Ticket Fechado', interaction.user, { channel: interaction.channel.name });
  await sendLog(interaction.guild, logEmbed, 'ticket');
  await saveLog({
    guildId: interaction.guild.id,
    action: 'Ticket fechado',
    category: 'ticket',
    executorId: interaction.user.id,
    executorTag: interaction.user.tag,
    targetId: ticket.userId,
  });
}

async function deleteTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('Este canal não é um ticket.')], ephemeral: true });
  }

  ticket.status = 'deleted';
  await ticket.save();

  await interaction.reply({ embeds: [successEmbed('Ticket será deletado em 5 segundos...')] });

  const logEmbed = ticketLog('Ticket Deletado', interaction.user, { channel: interaction.channel.name });
  await sendLog(interaction.guild, logEmbed, 'ticket');
  await saveLog({
    guildId: interaction.guild.id,
    action: 'Ticket deletado',
    category: 'ticket',
    executorId: interaction.user.id,
    executorTag: interaction.user.tag,
  });

  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

async function addUserToTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('Este canal não é um ticket.')], ephemeral: true });
  }

  const user = interaction.options.getMember('usuario');
  await interaction.channel.permissionOverwrites.edit(user, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  await interaction.reply({ embeds: [successEmbed(`${user} foi adicionado ao ticket.`)] });
}

async function removeUserFromTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed('Este canal não é um ticket.')], ephemeral: true });
  }

  const user = interaction.options.getMember('usuario');
  await interaction.channel.permissionOverwrites.delete(user);

  await interaction.reply({ embeds: [successEmbed(`${user} foi removido do ticket.`)] });
}
