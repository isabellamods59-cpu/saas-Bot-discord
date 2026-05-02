const { EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getSettings } = require('../../utils/getSettings');
const { isDev } = require('../../utils/permissions');
const { saveLog } = require('../../utils/logger');
const config = require('../../config');

module.exports = async (interaction, client) => {
  const { customId } = interaction;

  // Admin: set message
  if (customId === 'modal_admin_welcome_message') {
    const value = interaction.fields.getTextInputValue('value');
    const settings = await getSettings(interaction.guild.id);
    settings.welcomeMessage = value;
    await settings.save();
    await interaction.reply({ embeds: [successEmbed(`Mensagem de boas-vindas atualizada:\n${value}`)], ephemeral: true });
    return;
  }

  if (customId === 'modal_admin_leave_message') {
    const value = interaction.fields.getTextInputValue('value');
    const settings = await getSettings(interaction.guild.id);
    settings.leaveMessage = value;
    await settings.save();
    await interaction.reply({ embeds: [successEmbed(`Mensagem de saída atualizada:\n${value}`)], ephemeral: true });
    return;
  }

  // Admin: set channels
  if (customId.startsWith('modal_admin_channel_')) {
    const channelId = interaction.fields.getTextInputValue('channel_id').trim();
    const type = customId.replace('modal_admin_channel_', '');
    const settings = await getSettings(interaction.guild.id);

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({ embeds: [errorEmbed('Canal não encontrado. Verifique o ID.')], ephemeral: true });
    }

    const fieldMap = {
      welcome_channel: 'welcomeChannel',
      leave_channel: 'leaveChannel',
      log_channel: 'logChannel',
      mod_log_channel: 'modLogChannel',
      ticket_log_channel: 'ticketLogChannel',
    };

    settings[fieldMap[type]] = channelId;
    await settings.save();

    await interaction.reply({
      embeds: [successEmbed(`Canal definido para ${channel}`)],
      ephemeral: true,
    });

    await saveLog({
      guildId: interaction.guild.id,
      action: `Canal ${type} definido`,
      category: 'config',
      executorId: interaction.user.id,
      executorTag: interaction.user.tag,
      details: `#${channel.name}`,
    });
    return;
  }

  // Admin: banned words
  if (customId === 'modal_admin_banned_words') {
    const words = interaction.fields.getTextInputValue('words')
      .split('\n')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    const settings = await getSettings(interaction.guild.id);
    settings.bannedWords.words = words;
    settings.bannedWords.enabled = words.length > 0;
    await settings.save();

    await interaction.reply({
      embeds: [successEmbed(`**${words.length}** palavras proibidas configuradas.`)],
      ephemeral: true,
    });
    return;
  }

  // Admin: auto roles
  if (customId === 'modal_admin_auto_roles') {
    const roleIds = interaction.fields.getTextInputValue('role_ids')
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const settings = await getSettings(interaction.guild.id);
    settings.autoRoles = roleIds;
    settings.modules.autoRoles = roleIds.length > 0;
    await settings.save();

    await interaction.reply({
      embeds: [successEmbed(`**${roleIds.length}** cargo(s) automático(s) configurado(s).`)],
      ephemeral: true,
    });
    return;
  }

  // Dev: broadcast
  if (customId === 'modal_dev_broadcast') {
    if (!isDev(interaction.user.id)) {
      return interaction.reply({ embeds: [errorEmbed('Acesso negado.')], ephemeral: true });
    }

    const message = interaction.fields.getTextInputValue('broadcast_message');
    await interaction.deferReply({ ephemeral: true });

    let sent = 0;
    for (const [, guild] of client.guilds.cache) {
      try {
        const channel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased());
        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('📢 Mensagem do Desenvolvedor')
            .setDescription(message)
            .setTimestamp()
            .setFooter({ text: 'NexaBot • Mensagem Global' });

          await channel.send({ embeds: [embed] });
          sent++;
        }
      } catch { /* skip */ }
    }

    await interaction.editReply({
      embeds: [successEmbed(`Mensagem enviada para **${sent}** servidor(es).`)],
    });
    return;
  }

  // Dev: eval
  if (customId === 'modal_dev_eval') {
    if (!isDev(interaction.user.id)) {
      return interaction.reply({ embeds: [errorEmbed('Acesso negado.')], ephemeral: true });
    }

    const code = interaction.fields.getTextInputValue('eval_code');
    await interaction.deferReply({ ephemeral: true });

    try {
      let result = eval(code);
      if (result instanceof Promise) result = await result;
      result = String(result).substring(0, 1900);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('🧑‍💻 Eval — Resultado')
        .addFields(
          { name: '📤 Input', value: `\`\`\`js\n${code.substring(0, 500)}\n\`\`\`` },
          { name: '📥 Output', value: `\`\`\`js\n${result}\n\`\`\`` },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle('🧑‍💻 Eval — Erro')
        .addFields(
          { name: '📤 Input', value: `\`\`\`js\n${code.substring(0, 500)}\n\`\`\`` },
          { name: '❌ Erro', value: `\`\`\`\n${err.message.substring(0, 500)}\n\`\`\`` },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
    return;
  }
};
