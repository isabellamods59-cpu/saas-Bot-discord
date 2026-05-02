const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendLog, saveLog, modLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🗑️ Limpar mensagens do canal')
    .addIntegerOption(opt =>
      opt.setName('quantidade').setDescription('Quantidade de mensagens (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(opt => opt.setName('usuario').setDescription('Filtrar por usuário'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,

  async execute(interaction) {
    const amount = interaction.options.getInteger('quantidade');
    const targetUser = interaction.options.getUser('usuario');

    try {
      await interaction.deferReply({ ephemeral: true });

      let messages;
      if (targetUser) {
        const fetched = await interaction.channel.messages.fetch({ limit: 100 });
        messages = fetched.filter(m => m.author.id === targetUser.id);
        const toDelete = [...messages.values()].slice(0, amount);
        await interaction.channel.bulkDelete(toDelete, true);
        messages = { size: toDelete.length };
      } else {
        const deleted = await interaction.channel.bulkDelete(amount, true);
        messages = deleted;
      }

      const count = messages.size !== undefined ? messages.size : amount;

      await interaction.editReply({
        embeds: [successEmbed(`**${count}** mensagens foram deletadas.${targetUser ? ` (de ${targetUser})` : ''}`)],
      });

      const logEmbed = modLog('Clear', interaction.user, targetUser || { tag: 'Todos' },
        `${count} mensagens deletadas em #${interaction.channel.name}`);
      await sendLog(interaction.guild, logEmbed, 'moderation');
      await saveLog({
        guildId: interaction.guild.id,
        action: 'Clear',
        category: 'moderation',
        executorId: interaction.user.id,
        executorTag: interaction.user.tag,
        details: `${count} mensagens em #${interaction.channel.name}`,
      });
    } catch (err) {
      console.error('[CLEAR] Erro:', err);
      await interaction.editReply({ embeds: [errorEmbed('Erro ao limpar mensagens.')] });
    }
  },
};
