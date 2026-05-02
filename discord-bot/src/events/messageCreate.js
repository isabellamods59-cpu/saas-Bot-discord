const { getSettings } = require('../utils/getSettings');
const antiSpam = require('../systems/antiSpam');
const antiLink = require('../systems/antiLink');
const antiFlood = require('../systems/antiFlood');
const antiMention = require('../systems/antiMention');
const bannedWords = require('../systems/bannedWords');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const settings = await getSettings(message.guild.id);
    if (!settings) return;

    const member = message.member;
    if (!member) return;

    // Pular whitelist
    if (
      settings.whitelist.users.includes(member.id) ||
      member.roles.cache.some(r => settings.whitelist.roles.includes(r.id)) ||
      settings.whitelist.channels.includes(message.channel.id)
    ) return;

    // Pular administradores
    if (member.permissions.has('Administrator')) return;

    // Sistemas de proteção
    if (settings.modules.protection) {
      if (settings.antiSpam.enabled) {
        const blocked = await antiSpam.check(message, settings);
        if (blocked) return;
      }

      if (settings.antiLink.enabled) {
        const blocked = await antiLink.check(message, settings);
        if (blocked) return;
      }

      if (settings.antiFlood.enabled) {
        const blocked = await antiFlood.check(message, settings);
        if (blocked) return;
      }

      if (settings.antiMassMention.enabled) {
        const blocked = await antiMention.check(message, settings);
        if (blocked) return;
      }

      if (settings.bannedWords.enabled) {
        const blocked = await bannedWords.check(message, settings);
        if (blocked) return;
      }
    }

    // Prefixo opcional
    const prefix = client.config.prefix;
    if (message.content.startsWith(prefix)) {
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const cmdName = args.shift().toLowerCase();
      const command = client.commands.get(cmdName);
      if (command && command.prefixExecute) {
        try {
          await command.prefixExecute(message, args, client);
        } catch (err) {
          console.error(`[PREFIX] Erro em ${cmdName}:`, err);
        }
      }
    }
  },
};
