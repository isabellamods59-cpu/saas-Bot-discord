const { EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getSettings } = require('../../utils/getSettings');
const { isAdmin } = require('../../utils/permissions');
const { saveLog } = require('../../utils/logger');
const config = require('../../config');

const moduleMap = {
  admin_toggle_welcome: { key: 'welcome', name: 'Boas-vindas' },
  admin_toggle_leave: { key: 'leave', name: 'Saída' },
  admin_toggle_moderation: { key: 'moderation', name: 'Moderação' },
  admin_toggle_tickets: { key: 'tickets', name: 'Tickets' },
  admin_toggle_protection: { key: 'protection', name: 'Proteção' },
  admin_toggle_rcon: { key: 'rcon', name: 'RCON' },
  admin_toggle_logs: { key: 'logs', name: 'Logs' },
  admin_toggle_autoroles: { key: 'autoRoles', name: 'Auto-Roles' },
};

module.exports = async (interaction, client) => {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('Apenas administradores podem usar isto.')], ephemeral: true });
  }

  const { customId } = interaction;

  if (customId === 'admin_refresh') {
    const command = client.commands.get('paineladmin');
    if (command) {
      const settings = await getSettings(interaction.guild.id);
      const payload = command.buildPanel(interaction, settings);
      await interaction.update(payload);
    }
    return;
  }

  const moduleInfo = moduleMap[customId];
  if (!moduleInfo) return;

  const settings = await getSettings(interaction.guild.id);
  settings.modules[moduleInfo.key] = !settings.modules[moduleInfo.key];
  await settings.save();

  const status = settings.modules[moduleInfo.key];
  const emoji = status ? '🟢' : '🔴';
  const statusText = status ? 'ativado' : 'desativado';

  await interaction.reply({
    embeds: [successEmbed(`${emoji} Módulo **${moduleInfo.name}** ${statusText}!`)],
    ephemeral: true,
  });

  await saveLog({
    guildId: interaction.guild.id,
    action: `Toggle: ${moduleInfo.name} → ${statusText}`,
    category: 'config',
    executorId: interaction.user.id,
    executorTag: interaction.user.tag,
  });
};
