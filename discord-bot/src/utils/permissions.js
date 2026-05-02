const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isMod(member) {
  return (
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers)
  );
}

function isDev(userId) {
  return userId === config.devId;
}

function canModerate(moderator, target) {
  if (!target.manageable) return false;
  if (moderator.id === target.id) return false;
  if (target.roles.highest.position >= moderator.roles.highest.position) return false;
  return true;
}

function hasPermission(member, permission) {
  return member.permissions.has(permission);
}

module.exports = { isAdmin, isMod, isDev, canModerate, hasPermission };
