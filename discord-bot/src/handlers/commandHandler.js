const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = async (client) => {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath).filter(f =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
  );

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const command = require(path.join(categoryPath, file));
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`[CMD] ✅ /${command.data.name} carregado (${category})`);
      }
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log(`[CMD] Registrando ${commands.length} comandos slash...`);
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    console.log(`[CMD] ✅ ${commands.length} comandos registrados com sucesso!`);
  } catch (err) {
    console.error('[CMD] ❌ Erro ao registrar comandos:', err);
  }
};
