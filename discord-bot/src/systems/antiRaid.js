const { Collection, EmbedBuilder } = require('discord.js');
const { sendLog, saveLog } = require('../utils/logger');
const config = require('../config');

const joinCache = new Collection();

module.exports = {
  async checkJoin(member, settings) {
    const guildId = member.guild.id;
    const { maxJoinsPerMinute, action } = settings.antiRaid;

    if (!joinCache.has(guildId)) {
      joinCache.set(guildId, []);
    }

    const joins = joinCache.get(guildId);
    const now = Date.now();

    joins.push({ userId: member.id, timestamp: now });

    const recentJoins = joins.filter(j => now - j.timestamp < 60000);
    joinCache.set(guildId, recentJoins);

    if (recentJoins.length < maxJoinsPerMinute) return false;

    // Raid detectado!
    console.log(`[ANTI-RAID] ⚠️ Raid detectado em ${member.guild.name}! ${recentJoins.length} joins/min`);

    const reason = `Anti-Raid: ${recentJoins.length} entradas em 1 minuto`;

    try {
      switch (action) {
        case 'kick':
          for (const join of recentJoins) {
            const m = member.guild.members.cache.get(join.userId);
            if (m && m.kickable) await m.kick(reason).catch(() => {});
          }
          break;

        case 'ban':
          for (const join of recentJoins) {
            const m = member.guild.members.cache.get(join.userId);
            if (m && m.bannable) await m.ban({ reason }).catch(() => {});
          }
          break;

        case 'lockdown':
          const channels = member.guild.channels.cache.filter(c => c.isTextBased());
          for (const [, channel] of channels) {
            await channel.permissionOverwrites.edit(member.guild.roles.everyone, {
              SendMessages: false,
            }).catch(() => {});
          }
          break;
      }
    } catch (err) {
      console.error('[ANTI-RAID] Erro ao aplicar ação:', err.message);
    }

    const logEmbed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(`${config.emojis.shield} RAID DETECTADO!`)
      .setDescription(`**${recentJoins.length}** entradas em 1 minuto.\nAção tomada: **${action}**`)
      .setTimestamp()
      .setFooter({ text: 'NexaBot • Anti-Raid' });

    await sendLog(member.guild, logEmbed);
    await saveLog({
      guildId: member.guild.id,
      action: 'Raid detectado',
      category: 'protection',
      details: `${recentJoins.length} entradas. Ação: ${action}`,
    });

    joinCache.delete(guildId);
    return true;
  },
};
