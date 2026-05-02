const { EmbedBuilder } = require('discord.js');
const GuildSettings = require('../database/schemas/GuildSettings');
const ActionLog = require('../database/schemas/ActionLog');
const config = require('../config');

async function sendLog(guild, embed, type = 'general') {
  try {
    const settings = await GuildSettings.findOne({ guildId: guild.id });
    if (!settings) return;

    let channelId;
    if (type === 'moderation' && settings.modLogChannel) {
      channelId = settings.modLogChannel;
    } else if (type === 'ticket' && settings.ticketLogChannel) {
      channelId = settings.ticketLogChannel;
    } else if (settings.logChannel) {
      channelId = settings.logChannel;
    }

    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[LOG] Erro ao enviar log:', err.message);
  }
}

async function saveLog(data) {
  try {
    await ActionLog.create(data);
  } catch (err) {
    console.error('[LOG] Erro ao salvar log:', err.message);
  }
}

function modLog(action, moderator, target, reason, extra = {}) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.moderation)
    .setTitle(`${config.emojis.log} Log de Moderação`)
    .addFields(
      { name: '📌 Ação', value: action, inline: true },
      { name: '👮 Moderador', value: `${moderator}`, inline: true },
      { name: '🎯 Alvo', value: `${target}`, inline: true },
      { name: '📝 Motivo', value: reason || 'Sem motivo informado' },
    )
    .setTimestamp()
    .setFooter({ text: 'NexaBot • Sistema de Logs' });

  if (extra.duration) {
    embed.addFields({ name: '⏱️ Duração', value: extra.duration, inline: true });
  }

  return embed;
}

function ticketLog(action, user, details = {}) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.ticket)
    .setTitle(`${config.emojis.ticket} Log de Ticket`)
    .addFields(
      { name: '📌 Ação', value: action, inline: true },
      { name: '👤 Usuário', value: `${user}`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'NexaBot • Sistema de Tickets' });

  if (details.category) {
    embed.addFields({ name: '📂 Categoria', value: details.category, inline: true });
  }
  if (details.channel) {
    embed.addFields({ name: '💬 Canal', value: details.channel, inline: true });
  }

  return embed;
}

function systemLog(action, details) {
  return new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(`${config.emojis.config} Log do Sistema`)
    .setDescription(`**${action}**\n${details || ''}`)
    .setTimestamp()
    .setFooter({ text: 'NexaBot • Sistema' });
}

module.exports = { sendLog, saveLog, modLog, ticketLog, systemLog };
