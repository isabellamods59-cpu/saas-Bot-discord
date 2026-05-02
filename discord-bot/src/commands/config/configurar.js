const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');
const { getSettings } = require('../../utils/getSettings');
const { saveLog, sendLog, systemLog } = require('../../utils/logger');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurar')
    .setDescription('⚙️ Comandos de configuração rápida')
    .addSubcommand(sub =>
      sub.setName('boasvindas')
        .setDescription('Definir canal de boas-vindas')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(sub =>
      sub.setName('saida')
        .setDescription('Definir canal de saída')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(sub =>
      sub.setName('logs')
        .setDescription('Definir canal de logs')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(sub =>
      sub.setName('modlogs')
        .setDescription('Definir canal de logs de moderação')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(sub =>
      sub.setName('ticketlogs')
        .setDescription('Definir canal de logs de tickets')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(sub =>
      sub.setName('ticketcategoria')
        .setDescription('Definir categoria de tickets')
        .addChannelOption(opt => opt.setName('categoria').setDescription('Categoria').setRequired(true).addChannelTypes(ChannelType.GuildCategory)))
    .addSubcommand(sub =>
      sub.setName('autorole')
        .setDescription('Adicionar cargo automático')
        .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('msgboasvindas')
        .setDescription('Definir mensagem de boas-vindas')
        .addStringOption(opt => opt.setName('mensagem').setDescription('Use {user}, {username}, {tag}, {server}, {memberCount}').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('msgsaida')
        .setDescription('Definir mensagem de saída')
        .addStringOption(opt => opt.setName('mensagem').setDescription('Use {user}, {username}, {tag}, {server}, {memberCount}').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Ver todas as configurações'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getSettings(interaction.guild.id);

    switch (sub) {
      case 'boasvindas': {
        const channel = interaction.options.getChannel('canal');
        settings.welcomeChannel = channel.id;
        await settings.save();
        await interaction.reply({ embeds: [successEmbed(`Canal de boas-vindas definido para ${channel}`)], ephemeral: true });
        break;
      }
      case 'saida': {
        const channel = interaction.options.getChannel('canal');
        settings.leaveChannel = channel.id;
        await settings.save();
        await interaction.reply({ embeds: [successEmbed(`Canal de saída definido para ${channel}`)], ephemeral: true });
        break;
      }
      case 'logs': {
        const channel = interaction.options.getChannel('canal');
        settings.logChannel = channel.id;
        await settings.save();
        await interaction.reply({ embeds: [successEmbed(`Canal de logs definido para ${channel}`)], ephemeral: true });
        break;
      }
      case 'modlogs': {
        const channel = interaction.options.getChannel('canal');
        settings.modLogChannel = channel.id;
        await settings.save();
        await interaction.reply({ embeds: [successEmbed(`Canal de mod logs definido para ${channel}`)], ephemeral: true });
        break;
      }
      case 'ticketlogs': {
        const channel = interaction.options.getChannel('canal');
        settings.ticketLogChannel = channel.id;
        await settings.save();
        await interaction.reply({ embeds: [successEmbed(`Canal de ticket logs definido para ${channel}`)], ephemeral: true });
        break;
      }
      case 'ticketcategoria': {
        const category = interaction.options.getChannel('categoria');
        settings.ticketCategory = category.id;
        await settings.save();
        await interaction.reply({ embeds: [successEmbed(`Categoria de tickets definida para ${category}`)], ephemeral: true });
        break;
      }
      case 'autorole': {
        const role = interaction.options.getRole('cargo');
        if (!settings.autoRoles.includes(role.id)) {
          settings.autoRoles.push(role.id);
          settings.modules.autoRoles = true;
          await settings.save();
          await interaction.reply({ embeds: [successEmbed(`Cargo ${role} adicionado aos auto-roles.`)], ephemeral: true });
        } else {
          settings.autoRoles = settings.autoRoles.filter(r => r !== role.id);
          await settings.save();
          await interaction.reply({ embeds: [successEmbed(`Cargo ${role} removido dos auto-roles.`)], ephemeral: true });
        }
        break;
      }
      case 'msgboasvindas': {
        const msg = interaction.options.getString('mensagem');
        settings.welcomeMessage = msg;
        await settings.save();
        await interaction.reply({ embeds: [successEmbed(`Mensagem de boas-vindas atualizada:\n${msg}`)], ephemeral: true });
        break;
      }
      case 'msgsaida': {
        const msg = interaction.options.getString('mensagem');
        settings.leaveMessage = msg;
        await settings.save();
        await interaction.reply({ embeds: [successEmbed(`Mensagem de saída atualizada:\n${msg}`)], ephemeral: true });
        break;
      }
      case 'ver': {
        const embed = new EmbedBuilder()
          .setColor(config.colors.primary)
          .setTitle(`${config.emojis.config} Configurações do Servidor`)
          .addFields(
            { name: '👋 Boas-vindas', value: settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : 'Não definido', inline: true },
            { name: '📤 Saída', value: settings.leaveChannel ? `<#${settings.leaveChannel}>` : 'Não definido', inline: true },
            { name: '📋 Logs', value: settings.logChannel ? `<#${settings.logChannel}>` : 'Não definido', inline: true },
            { name: '🔨 Mod Logs', value: settings.modLogChannel ? `<#${settings.modLogChannel}>` : 'Não definido', inline: true },
            { name: '🎟️ Ticket Logs', value: settings.ticketLogChannel ? `<#${settings.ticketLogChannel}>` : 'Não definido', inline: true },
            { name: '📂 Ticket Categoria', value: settings.ticketCategory ? `<#${settings.ticketCategory}>` : 'Não definido', inline: true },
            { name: '🏷️ Auto-Roles', value: settings.autoRoles.length > 0 ? settings.autoRoles.map(r => `<@&${r}>`).join(', ') : 'Nenhum', inline: false },
            { name: '📝 Msg Boas-vindas', value: settings.welcomeMessage.substring(0, 100), inline: false },
            { name: '📝 Msg Saída', value: settings.leaveMessage.substring(0, 100), inline: false },
          )
          .setTimestamp()
          .setFooter({ text: 'NexaBot • Configurações' });
        await interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }
    }

    if (sub !== 'ver') {
      await saveLog({
        guildId: interaction.guild.id,
        action: `Configuração: ${sub}`,
        category: 'config',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
      });
    }
  },
};
