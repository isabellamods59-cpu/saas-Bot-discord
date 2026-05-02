const {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { isDev } = require('../../utils/permissions');
const ActionLog = require('../../database/schemas/ActionLog');
const config = require('../../config');
const mongoose = require('mongoose');

module.exports = async (interaction, client) => {
  if (!isDev(interaction.user.id)) {
    return interaction.reply({ embeds: [errorEmbed('Acesso negado.')], ephemeral: true });
  }

  const { customId } = interaction;

  switch (customId) {
    case 'dev_restart': {
      await interaction.reply({ embeds: [successEmbed('Reiniciando o bot...')], ephemeral: true });
      setTimeout(() => process.exit(0), 2000);
      break;
    }

    case 'dev_reload_commands': {
      await interaction.deferReply({ ephemeral: true });
      try {
        const loadCommands = require('../../handlers/commandHandler');
        await loadCommands(client);
        await interaction.editReply({ embeds: [successEmbed('Comandos recarregados com sucesso!')] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed(`Erro: ${err.message}`)] });
      }
      break;
    }

    case 'dev_clear_cache': {
      client.users.cache.sweep(() => true);
      await interaction.reply({ embeds: [successEmbed('Cache limpo!')], ephemeral: true });
      break;
    }

    case 'dev_logs': {
      await interaction.deferReply({ ephemeral: true });
      const logs = await ActionLog.find().sort({ createdAt: -1 }).limit(15);
      const logText = logs.length > 0
        ? logs.map(l => `\`${l.createdAt.toLocaleString('pt-BR')}\` [${l.category}] ${l.action}`).join('\n')
        : 'Nenhum log encontrado.';

      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle('📋 Últimos Logs')
        .setDescription(logText)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'dev_broadcast': {
      const modal = new ModalBuilder()
        .setCustomId('modal_dev_broadcast')
        .setTitle('📢 Mensagem Global');

      const msgInput = new TextInputBuilder()
        .setCustomId('broadcast_message')
        .setLabel('Mensagem')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Digite a mensagem que será enviada para todos os servidores...')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(msgInput));
      await interaction.showModal(modal);
      break;
    }

    case 'dev_eval': {
      const modal = new ModalBuilder()
        .setCustomId('modal_dev_eval')
        .setTitle('🧑‍💻 Eval / Debug');

      const codeInput = new TextInputBuilder()
        .setCustomId('eval_code')
        .setLabel('Código JavaScript')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('console.log("Hello World")')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
      await interaction.showModal(modal);
      break;
    }

    case 'dev_db_stats': {
      await interaction.deferReply({ ephemeral: true });
      try {
        const dbState = mongoose.connection.readyState;
        const states = { 0: 'Desconectado', 1: 'Conectado', 2: 'Conectando', 3: 'Desconectando' };

        const collections = mongoose.connection.db ? await mongoose.connection.db.listCollections().toArray() : [];

        const embed = new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle('🗄️ Status do Banco de Dados')
          .addFields(
            { name: '📡 Status', value: states[dbState] || 'Desconhecido', inline: true },
            { name: '📂 Coleções', value: `${collections.length}`, inline: true },
            { name: '🗃️ Lista', value: collections.map(c => `\`${c.name}\``).join(', ') || 'Nenhuma' },
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed(`Erro: ${err.message}`)] });
      }
      break;
    }

    case 'dev_guilds': {
      await interaction.deferReply({ ephemeral: true });
      const guilds = client.guilds.cache.map(g =>
        `**${g.name}** — ${g.memberCount} membros (\`${g.id}\`)`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle('🏠 Servidores')
        .setDescription(guilds || 'Nenhum servidor.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }
  }
};
