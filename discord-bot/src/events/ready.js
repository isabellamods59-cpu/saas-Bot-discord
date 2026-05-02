const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🤖 NexaBot Online!`);
    console.log(`  📛 ${client.user.tag}`);
    console.log(`  🏠 ${client.guilds.cache.size} servidor(es)`);
    console.log(`  👥 ${client.users.cache.size} usuário(s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const activities = [
      { name: '🛡️ Protegendo servidores', type: ActivityType.Watching },
      { name: '/paineladmin • Configurar', type: ActivityType.Playing },
      { name: `${client.guilds.cache.size} servidores`, type: ActivityType.Watching },
      { name: '🎟️ Tickets • Suporte', type: ActivityType.Listening },
    ];

    let i = 0;
    setInterval(() => {
      client.user.setPresence({
        activities: [activities[i % activities.length]],
        status: 'online',
      });
      i++;
    }, 15000);
  },
};
