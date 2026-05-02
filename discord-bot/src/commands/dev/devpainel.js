const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { errorEmbed } = require('../../utils/embeds');
const { isDev } = require('../../utils/permissions');
const config = require('../../config');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devpainel')
    .setDescription('🧑‍💻 Painel exclusivo do desenvolvedor'),
  cooldown: 10,

  async execute(interaction) {
    if (!isDev(interaction.user.id)) {
      return interaction.reply({
        embeds: [errorEmbed('Acesso negado. Este painel é exclusivo do desenvolvedor.')],
        ephemeral: true,
      });
    }

    const client = interaction.client;
    const uptime = formatUptime(client.uptime);
    const memUsage = process.memoryUsage();
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
    const usedMem = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const rss = (memUsage.rss / 1024 / 1024).toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.dev} Painel do Desenvolvedor`)
      .setDescription('Controle total do bot.')
      .addFields(
        {
          name: '📊 Estatísticas',
          value:
            `**Servidores:** ${client.guilds.cache.size}\n` +
            `**Usuários:** ${client.users.cache.size}\n` +
            `**Canais:** ${client.channels.cache.size}\n` +
            `**Comandos:** ${client.commands.size}\n` +
            `**Uptime:** ${uptime}`,
          inline: true,
        },
        {
          name: '💻 Sistema',
          value:
            `**Node.js:** ${process.version}\n` +
            `**Discord.js:** v${require('discord.js').version}\n` +
            `**OS:** ${os.platform()} ${os.arch()}\n` +
            `**RAM:** ${usedMem} MB / ${totalMem} MB\n` +
            `**RSS:** ${rss} MB`,
          inline: true,
        },
        {
          name: '🏓 Latência',
          value:
            `**API:** ${client.ws.ping}ms\n` +
            `**Bot:** ${Date.now() - interaction.createdTimestamp}ms`,
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({ text: `NexaBot • Dev: ${interaction.user.tag}` });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('dev_restart').setLabel('Reiniciar Bot').setStyle(ButtonStyle.Danger).setEmoji('🔄'),
      new ButtonBuilder().setCustomId('dev_reload_commands').setLabel('Recarregar Comandos').setStyle(ButtonStyle.Primary).setEmoji('📦'),
      new ButtonBuilder().setCustomId('dev_clear_cache').setLabel('Limpar Cache').setStyle(ButtonStyle.Secondary).setEmoji('🧹'),
      new ButtonBuilder().setCustomId('dev_logs').setLabel('Ver Logs').setStyle(ButtonStyle.Secondary).setEmoji('📋'),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('dev_broadcast').setLabel('Mensagem Global').setStyle(ButtonStyle.Primary).setEmoji('📢'),
      new ButtonBuilder().setCustomId('dev_eval').setLabel('Eval/Debug').setStyle(ButtonStyle.Danger).setEmoji('🧑‍💻'),
      new ButtonBuilder().setCustomId('dev_db_stats').setLabel('Stats do DB').setStyle(ButtonStyle.Secondary).setEmoji('🗄️'),
      new ButtonBuilder().setCustomId('dev_guilds').setLabel('Listar Servidores').setStyle(ButtonStyle.Secondary).setEmoji('🏠'),
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
  },
};

function formatUptime(ms) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
