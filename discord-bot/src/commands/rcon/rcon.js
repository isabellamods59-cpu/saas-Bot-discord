const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { Rcon } = require('rcon-client');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, systemLog } = require('../../utils/logger');
const { getSettings } = require('../../utils/getSettings');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rcon')
    .setDescription('🌐 Sistema RCON — integração com Minecraft')
    .addSubcommand(sub =>
      sub.setName('conectar')
        .setDescription('Conectar ao servidor Minecraft')
        .addStringOption(opt => opt.setName('host').setDescription('IP do servidor').setRequired(true))
        .addIntegerOption(opt => opt.setName('porta').setDescription('Porta RCON (padrão: 25575)')))
    .addSubcommand(sub =>
      sub.setName('comando')
        .setDescription('Enviar comando ao servidor')
        .addStringOption(opt => opt.setName('cmd').setDescription('Comando para executar').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Ver status da conexão RCON'))
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Banir jogador no Minecraft')
        .addStringOption(opt => opt.setName('jogador').setDescription('Nome do jogador').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do ban')))
    .addSubcommand(sub =>
      sub.setName('unban')
        .setDescription('Desbanir jogador no Minecraft')
        .addStringOption(opt => opt.setName('jogador').setDescription('Nome do jogador').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('lista')
        .setDescription('Listar jogadores online'))
    .addSubcommand(sub =>
      sub.setName('chat')
        .setDescription('Definir canal de integração chat')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal de chat').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 3,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getSettings(interaction.guild.id);

    switch (sub) {
      case 'conectar':
        return connectRcon(interaction, settings);
      case 'comando':
        return sendCommand(interaction, settings);
      case 'status':
        return rconStatus(interaction, settings);
      case 'ban':
        return rconBan(interaction, settings);
      case 'unban':
        return rconUnban(interaction, settings);
      case 'lista':
        return rconList(interaction, settings);
      case 'chat':
        return rconChat(interaction, settings);
    }
  },
};

async function connectRcon(interaction, settings) {
  const host = interaction.options.getString('host');
  const port = interaction.options.getInteger('porta') || 25575;

  // Store host/port temporarily for the modal callback
  const modal = new ModalBuilder()
    .setCustomId(`modal_rcon_connect_${host}_${port}`)
    .setTitle('🌐 Senha RCON');

  const passwordInput = new TextInputBuilder()
    .setCustomId('rcon_password')
    .setLabel('Senha RCON do servidor')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Digite a senha RCON...')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(passwordInput));
  await interaction.showModal(modal);
}

async function sendCommand(interaction, settings) {
  if (!settings.rcon.enabled || !settings.rcon.host) {
    return interaction.reply({ embeds: [errorEmbed('RCON não configurado. Use `/rcon conectar`.')], ephemeral: true });
  }

  const cmd = interaction.options.getString('cmd');
  await interaction.deferReply();

  try {
    const rcon = await Rcon.connect({
      host: settings.rcon.host,
      port: settings.rcon.port,
      password: settings.rcon.password,
    });

    const response = await rcon.send(cmd);
    await rcon.end();

    const embed = new EmbedBuilder()
      .setColor(config.colors.rcon)
      .setTitle(`${config.emojis.rcon} RCON — Comando Executado`)
      .addFields(
        { name: '📤 Comando', value: `\`${cmd}\`` },
        { name: '📥 Resposta', value: `\`\`\`\n${response || 'Sem resposta'}\n\`\`\`` },
      )
      .setTimestamp()
      .setFooter({ text: `Executado por ${interaction.user.tag}` });

    await interaction.editReply({ embeds: [embed] });

    await saveLog({
      guildId: interaction.guild.id,
      action: 'RCON comando',
      category: 'rcon',
      executorId: interaction.user.id,
      executorTag: interaction.user.tag,
      details: `Comando: ${cmd} | Resposta: ${response}`,
    });
  } catch (err) {
    await interaction.editReply({ embeds: [errorEmbed(`Erro RCON: ${err.message}`)] });
  }
}

async function rconStatus(interaction, settings) {
  if (!settings.rcon.host) {
    return interaction.reply({ embeds: [errorEmbed('RCON não configurado.')], ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  let online = false;
  try {
    const rcon = await Rcon.connect({
      host: settings.rcon.host,
      port: settings.rcon.port,
      password: settings.rcon.password,
    });
    await rcon.end();
    online = true;
  } catch { /* offline */ }

  const embed = new EmbedBuilder()
    .setColor(online ? config.colors.success : config.colors.error)
    .setTitle(`${config.emojis.rcon} Status RCON`)
    .addFields(
      { name: '🖥️ Host', value: `\`${settings.rcon.host}:${settings.rcon.port}\``, inline: true },
      { name: '📡 Status', value: online ? '🟢 Online' : '🔴 Offline', inline: true },
      { name: '💬 Canal de Chat', value: settings.rcon.chatChannel ? `<#${settings.rcon.chatChannel}>` : 'Não definido', inline: true },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function rconBan(interaction, settings) {
  if (!settings.rcon.enabled) {
    return interaction.reply({ embeds: [errorEmbed('RCON não configurado.')], ephemeral: true });
  }

  const player = interaction.options.getString('jogador');
  const reason = interaction.options.getString('motivo') || 'Banido via Discord';

  await interaction.deferReply();

  try {
    const rcon = await Rcon.connect({
      host: settings.rcon.host,
      port: settings.rcon.port,
      password: settings.rcon.password,
    });

    const response = await rcon.send(`ban ${player} ${reason}`);
    await rcon.end();

    await interaction.editReply({
      embeds: [successEmbed(`Jogador **${player}** banido no Minecraft.\n\`\`\`${response || 'Sem resposta'}\`\`\``)],
    });

    await saveLog({
      guildId: interaction.guild.id,
      action: 'RCON ban',
      category: 'rcon',
      executorId: interaction.user.id,
      executorTag: interaction.user.tag,
      details: `Jogador: ${player} | Motivo: ${reason}`,
    });
  } catch (err) {
    await interaction.editReply({ embeds: [errorEmbed(`Erro: ${err.message}`)] });
  }
}

async function rconUnban(interaction, settings) {
  if (!settings.rcon.enabled) {
    return interaction.reply({ embeds: [errorEmbed('RCON não configurado.')], ephemeral: true });
  }

  const player = interaction.options.getString('jogador');
  await interaction.deferReply();

  try {
    const rcon = await Rcon.connect({
      host: settings.rcon.host,
      port: settings.rcon.port,
      password: settings.rcon.password,
    });

    const response = await rcon.send(`pardon ${player}`);
    await rcon.end();

    await interaction.editReply({
      embeds: [successEmbed(`Jogador **${player}** desbanido no Minecraft.\n\`\`\`${response || 'Sem resposta'}\`\`\``)],
    });
  } catch (err) {
    await interaction.editReply({ embeds: [errorEmbed(`Erro: ${err.message}`)] });
  }
}

async function rconList(interaction, settings) {
  if (!settings.rcon.enabled) {
    return interaction.reply({ embeds: [errorEmbed('RCON não configurado.')], ephemeral: true });
  }

  await interaction.deferReply();

  try {
    const rcon = await Rcon.connect({
      host: settings.rcon.host,
      port: settings.rcon.port,
      password: settings.rcon.password,
    });

    const response = await rcon.send('list');
    await rcon.end();

    const embed = new EmbedBuilder()
      .setColor(config.colors.rcon)
      .setTitle(`${config.emojis.rcon} Jogadores Online`)
      .setDescription(`\`\`\`\n${response || 'Sem resposta'}\n\`\`\``)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({ embeds: [errorEmbed(`Erro: ${err.message}`)] });
  }
}

async function rconChat(interaction, settings) {
  const channel = interaction.options.getChannel('canal');

  settings.rcon.chatChannel = channel.id;
  await settings.save();

  await interaction.reply({
    embeds: [successEmbed(`Canal de integração chat definido para ${channel}`)],
    ephemeral: true,
  });
}
