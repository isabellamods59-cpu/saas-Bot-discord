const { Schema, model } = require('mongoose');

const punishmentSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  odId: { type: String, required: true, index: true },
  odTag: { type: String },
  type: {
    type: String,
    required: true,
    enum: ['ban', 'kick', 'mute', 'warn', 'unban', 'unmute'],
  },
  reason: { type: String, default: 'Sem motivo informado' },
  moderatorId: { type: String, required: true },
  moderatorTag: { type: String },
  duration: { type: String, default: null },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

punishmentSchema.index({ guildId: 1, odId: 1, type: 1 });

module.exports = model('Punishment', punishmentSchema);
