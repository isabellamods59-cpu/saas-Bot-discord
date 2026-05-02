const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function successEmbed(description) {
  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setDescription(`${config.emojis.success} ${description}`);
}

function errorEmbed(description) {
  return new EmbedBuilder()
    .setColor(config.colors.error)
    .setDescription(`${config.emojis.error} ${description}`);
}

function warningEmbed(description) {
  return new EmbedBuilder()
    .setColor(config.colors.warning)
    .setDescription(`${config.emojis.warning} ${description}`);
}

function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(title)
    .setDescription(description || null)
    .setTimestamp()
    .setFooter({ text: 'NexaBot' });
}

function punishmentEmbed(type, moderator, target, reason, extra = {}) {
  const titles = {
    ban: `${config.emojis.ban} Usuário Banido`,
    unban: `${config.emojis.success} Usuário Desbanido`,
    kick: `${config.emojis.kick} Usuário Expulso`,
    mute: `${config.emojis.mute} Usuário Silenciado`,
    unmute: `${config.emojis.success} Usuário Desmutado`,
    warn: `${config.emojis.warn} Aviso Aplicado`,
  };

  const embed = new EmbedBuilder()
    .setColor(config.colors.moderation)
    .setTitle(titles[type] || `Punição: ${type}`)
    .addFields(
      { name: '👤 Usuário', value: `${target}`, inline: true },
      { name: '👮 Moderador', value: `${moderator}`, inline: true },
      { name: '📝 Motivo', value: reason || 'Sem motivo informado' },
    )
    .setTimestamp()
    .setFooter({ text: 'NexaBot • Moderação' });

  if (extra.duration) {
    embed.addFields({ name: '⏱️ Duração', value: extra.duration, inline: true });
  }
  if (extra.warnings !== undefined) {
    embed.addFields({ name: '⚡ Total de Avisos', value: `${extra.warnings}`, inline: true });
  }

  return embed;
}

module.exports = { successEmbed, errorEmbed, warningEmbed, infoEmbed, punishmentEmbed };
