const {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getSettings } = require('../../utils/getSettings');
const { isAdmin } = require('../../utils/permissions');
const { saveLog } = require('../../utils/logger');
const config = require('../../config');

module.exports = async (interaction, client) => {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Apenas administradores podem usar isto.')], ephemeral: true });
  }

  const value = interaction.values[0];
  const settings = await getSettings(interaction.guild.id);

  // Options that need modals
  const modalOptions = {
    welcome_message: { title: 'Mensagem de Boas-vindas', field: 'welcomeMessage', placeholder: 'Use {user}, {username}, {tag}, {server}, {memberCount}' },
    leave_message: { title: 'Mensagem de Saída', field: 'leaveMessage', placeholder: 'Use {user}, {username}, {tag}, {server}, {memberCount}' },
  };

  if (modalOptions[value]) {
    const opt = modalOptions[value];
    const modal = new ModalBuilder()
      .setCustomId(`modal_admin_${value}`)
      .setTitle(opt.title);

    const input = new TextInputBuilder()
      .setCustomId('value')
      .setLabel(opt.title)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(opt.placeholder)
      .setValue(settings[opt.field] || '')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // Channel settings
  const channelMap = {
    welcome_channel: 'welcomeChannel',
    leave_channel: 'leaveChannel',
    log_channel: 'logChannel',
    mod_log_channel: 'modLogChannel',
    ticket_log_channel: 'ticketLogChannel',
  };

  if (channelMap[value]) {
    const modal = new ModalBuilder()
      .setCustomId(`modal_admin_channel_${value}`)
      .setTitle('Definir Canal');

    const input = new TextInputBuilder()
      .setCustomId('channel_id')
      .setLabel('ID do Canal (copie com botão direito)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 1234567890123456789')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // Protection settings
  const protectionMap = {
    anti_spam: 'antiSpam',
    anti_link: 'antiLink',
    anti_raid: 'antiRaid',
    anti_flood: 'antiFlood',
    anti_mention: 'antiMassMention',
    banned_words: 'bannedWords',
    auto_mod: 'moderation',
  };

  if (protectionMap[value]) {
    const key = protectionMap[value];
    const current = settings[key] || settings.moderation;

    if (key === 'bannedWords') {
      const modal = new ModalBuilder()
        .setCustomId('modal_admin_banned_words')
        .setTitle('Palavras Proibidas');

      const input = new TextInputBuilder()
        .setCustomId('words')
        .setLabel('Palavras (uma por linha)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('palavra1\npalavra2\npalavra3')
        .setValue((settings.bannedWords.words || []).join('\n'))
        .setRequired(false);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // Toggle the protection system
    const isEnabled = current.enabled !== undefined ? current.enabled : false;
    if (current.enabled !== undefined) {
      current.enabled = !isEnabled;
    }
    await settings.save();

    const status = current.enabled ? '🟢 Ativado' : '🔴 Desativado';
    await interaction.reply({
      embeds: [successEmbed(`**${value.replace(/_/g, ' ').toUpperCase()}** — ${status}`)],
      ephemeral: true,
    });

    await saveLog({
      guildId: interaction.guild.id,
      action: `Toggle ${value}: ${current.enabled ? 'ativado' : 'desativado'}`,
      category: 'config',
      executorId: interaction.user.id,
      executorTag: interaction.user.tag,
    });
    return;
  }

  // Auto roles
  if (value === 'auto_roles') {
    const modal = new ModalBuilder()
      .setCustomId('modal_admin_auto_roles')
      .setTitle('Cargos Automáticos');

    const input = new TextInputBuilder()
      .setCustomId('role_ids')
      .setLabel('IDs dos cargos (um por linha)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('1234567890\n0987654321')
      .setValue((settings.autoRoles || []).join('\n'))
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  await interaction.reply({ embeds: [errorEmbed('Opção não reconhecida.')], ephemeral: true });
};
