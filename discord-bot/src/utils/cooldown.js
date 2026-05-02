const { Collection } = require('discord.js');

const cooldowns = new Collection();

function checkCooldown(userId, commandName, cooldownSeconds = 3) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const timestamps = cooldowns.get(commandName);
  const now = Date.now();
  const cooldownMs = cooldownSeconds * 1000;

  if (timestamps.has(userId)) {
    const expiration = timestamps.get(userId) + cooldownMs;
    if (now < expiration) {
      const remaining = ((expiration - now) / 1000).toFixed(1);
      return { onCooldown: true, remaining };
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownMs);
  return { onCooldown: false, remaining: 0 };
}

module.exports = { checkCooldown };
