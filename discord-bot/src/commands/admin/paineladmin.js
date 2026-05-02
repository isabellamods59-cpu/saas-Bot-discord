const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const { errorEmbed } = require('../../utils/embeds');
const { getSettings } = require('../../utils/getSettings');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('paineladmin')
    .setDescription('👑 Painel administrativo do bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 10,

  buildPanel(interaction, settings) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.admin} Painel Administrativo`)
      .setDescription(
        'Configure o bot para este servidor.\n' +
        'Use os botões e menus abaixo para gerenciar.\n\n' +
        `**Servidor:** ${interaction.guild.name}\n` +
        `**ID:** ${interaction.guild.id}\n` +
        `**Membros:** ${interaction.guild.memberCount}`,
      )
      .addFields(
        {
          name: '📊 Status dos Módulos',
          value:
            `${settings.modules.welcome ? '🟢' : '🔴'} Boas-vindas\n` +
            `${settings.modules.leave ? '🟢' : '🔴'} Saída\n` +
            `${settings.modules.moderation ? '🟢' : '🔴'} Moderação\n` +
            `${settings.modules.tickets ? '🟢' : '🔴'} Tickets\n` +
            `${settings.modules.protection ? '🟢' : '🔴'} Proteção\n` +
            `${settings.modules.rcon ? '🟢' : '🔴'} RCON\n` +
            `${settings.modules.logs ? '🟢' : '🔴'} Logs\n` +
            `${settings.modules.autoRoles ? '🟢' : '🔴'} Auto-Roles`,
          inline: true,
        },
        {
          name: '⚙️ Configurações',
          value:
            `📢 Boas-vindas: ${settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : 'Não definido'}\n` +
            `📤 Saída: ${settings.leaveChannel ? `<#${settings.leaveChannel}>` : 'Não definido'}\n` +
            `📋 Logs: ${settings.logChannel ? `<#${settings.logChannel}>` : 'Não definido'}\n` +
            `🔨 Mod Logs: ${settings.modLogChannel ? `<#${settings.modLogChannel}>` : 'Não definido'}\n` +
            `🎟️ Ticket Logs: ${settings.ticketLogChannel ? `<#${settings.ticketLogChannel}>` : 'Não definido'}`,
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'NexaBot • Painel Admin' });

    const configMenu = new StringSelectMenuBuilder()
      .setCustomId('admin_select_config')
      .setPlaceholder('⚙️ Configurar canais e mensagens')
      .addOptions([
        { label: 'Canal de Boas-vindas', value: 'welcome_channel', emoji: '👋', description: 'Definir canal de boas-vindas' },
        { label: 'Canal de Saída', value: 'leave_channel', emoji: '😢', description: 'Definir canal de saída' },
        { label: 'Canal de Logs', value: 'log_channel', emoji: '📋', description: 'Definir canal de logs' },
        { label: 'Canal de Mod Logs', value: 'mod_log_channel', emoji: '🔨', description: 'Definir canal de moderação' },
        { label: 'Canal de Ticket Logs', value: 'ticket_log_channel', emoji: '🎟️', description: 'Definir canal de tickets' },
        { label: 'Mensagem de Boas-vindas', value: 'welcome_message', emoji: '✏️', description: 'Configurar mensagem de boas-vindas' },
        { label: 'Mensagem de Saída', value: 'leave_message', emoji: '✏️', description: 'Configurar mensagem de saída' },
        { label: 'Cargos Automáticos', value: 'auto_roles', emoji: '🏷️', description: 'Configurar cargos automáticos' },
      ]);

    const protectionMenu = new StringSelectMenuBuilder()
      .setCustomId('admin_select_protection')
      .setPlaceholder('🛡️ Configurar proteção')
      .addOptions([
        { label: 'Anti-Spam', value: 'anti_spam', emoji: '🚫', description: 'Configurar anti-spam' },
        { label: 'Anti-Link', value: 'anti_link', emoji: '🔗', description: 'Configurar anti-link' },
        { label: 'Anti-Raid', value: 'anti_raid', emoji: '⚔️', description: 'Configurar anti-raid' },
        { label: 'Anti-Flood', value: 'anti_flood', emoji: '🌊', description: 'Configurar anti-flood' },
        { label: 'Anti-Menção em Massa', value: 'anti_mention', emoji: '📢', description: 'Configurar anti-menção' },
        { label: 'Palavras Proibidas', value: 'banned_words', emoji: '🤬', description: 'Configurar palavras proibidas' },
        { label: 'Moderação Auto', value: 'auto_mod', emoji: '🤖', description: 'Configurar auto-moderação' },
      ]);

    const row1 = new ActionRowBuilder().addComponents(configMenu);
    const row2 = new ActionRowBuilder().addComponents(protectionMenu);

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('admin_toggle_welcome').setLabel('Boas-vindas').setStyle(settings.modules.welcome ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('👋'),
      new ButtonBuilder().setCustomId('admin_toggle_moderation').setLabel('Moderação').setStyle(settings.modules.moderation ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('🔨'),
      new ButtonBuilder().setCustomId('admin_toggle_tickets').setLabel('Tickets').setStyle(settings.modules.tickets ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('🎟️'),
      new ButtonBuilder().setCustomId('admin_toggle_protection').setLabel('Proteção').setStyle(settings.modules.protection ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('🛡️'),
      new ButtonBuilder().setCustomId('admin_toggle_rcon').setLabel('RCON').setStyle(settings.modules.rcon ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('🌐'),
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('admin_toggle_logs').setLabel('Logs').setStyle(settings.modules.logs ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('📋'),
      new ButtonBuilder().setCustomId('admin_toggle_autoroles').setLabel('Auto-Roles').setStyle(settings.modules.autoRoles ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('🏷️'),
      new ButtonBuilder().setCustomId('admin_toggle_leave').setLabel('Saída').setStyle(settings.modules.leave ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('📤'),
      new ButtonBuilder().setCustomId('admin_refresh').setLabel('Atualizar').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
    );

    return { embeds: [embed], components: [row1, row2, row3, row4], ephemeral: true };
  },

  async execute(interaction) {
    const settings = await getSettings(interaction.guild.id);
    const payload = module.exports.buildPanel(interaction, settings);
    await interaction.reply(payload);
  },
};
