const { Schema, model } = require('mongoose');

const actionLogSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  category: {
    type: String,
    enum: ['moderation', 'ticket', 'config', 'protection', 'rcon', 'system'],
    default: 'system',
  },
  executorId: { type: String },
  executorTag: { type: String },
  targetId: { type: String },
  targetTag: { type: String },
  details: { type: String },
  extra: { type: Schema.Types.Mixed },
}, { timestamps: true });

actionLogSchema.index({ guildId: 1, createdAt: -1 });

module.exports = model('ActionLog', actionLogSchema);
