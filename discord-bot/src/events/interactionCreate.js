const { InteractionType } = require('discord.js');
const { checkCooldown } = require('../utils/cooldown');
const { errorEmbed } = require('../utils/embeds');
const { saveLog } = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      const cooldown = command.cooldown || 3;
      const { onCooldown, remaining } = checkCooldown(
        interaction.user.id,
        interaction.commandName,
        cooldown,
      );

      if (onCooldown) {
        return interaction.reply({
          embeds: [errorEmbed(`Aguarde **${remaining}s** antes de usar este comando novamente.`)],
          ephemeral: true,
        });
      }

      try {
        await command.execute(interaction, client);

        await saveLog({
          guildId: interaction.guildId,
          action: `Comando /${interaction.commandName}`,
          category: 'system',
          executorId: interaction.user.id,
          executorTag: interaction.user.tag,
          details: `Comando executado em #${interaction.channel?.name || 'DM'}`,
        });
      } catch (err) {
        console.error(`[CMD] Erro em /${interaction.commandName}:`, err);
        const reply = {
          embeds: [errorEmbed('Ocorreu um erro ao executar este comando.')],
          ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    // Button interactions
    if (interaction.isButton()) {
      const buttonId = interaction.customId;

      // Ticket buttons
      if (buttonId.startsWith('ticket_')) {
        const ticketHandler = require('../interactions/buttons/ticketButtons');
        return ticketHandler(interaction, client);
      }

      // Admin panel buttons
      if (buttonId.startsWith('admin_')) {
        const adminHandler = require('../interactions/buttons/adminButtons');
        return adminHandler(interaction, client);
      }

      // Dev panel buttons
      if (buttonId.startsWith('dev_')) {
        const devHandler = require('../interactions/buttons/devButtons');
        return devHandler(interaction, client);
      }

      // Rating buttons
      if (buttonId.startsWith('rate_')) {
        const rateHandler = require('../interactions/buttons/rateButtons');
        return rateHandler(interaction, client);
      }
    }

    // Select menu interactions
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('admin_select_')) {
        const adminMenu = require('../interactions/menus/adminMenus');
        return adminMenu(interaction, client);
      }

      if (interaction.customId === 'ticket_category_select') {
        const ticketMenu = require('../interactions/menus/ticketMenus');
        return ticketMenu(interaction, client);
      }
    }

    // Modal interactions
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId.startsWith('modal_')) {
        const modalHandler = require('../interactions/modals/modalHandler');
        return modalHandler(interaction, client);
      }
    }
  },
};
