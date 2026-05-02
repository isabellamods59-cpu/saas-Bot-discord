const { Schema, model } = require('mongoose');

const ticketSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  userTag: { type: String },
  category: { type: String, default: 'geral' },
  status: {
    type: String,
    enum: ['open', 'closed', 'deleted'],
    default: 'open',
  },
  claimedBy: { type: String, default: null },
  rating: { type: Number, min: 1, max: 5, default: null },
  messages: { type: Number, default: 0 },
  closedAt: { type: Date, default: null },
  closedBy: { type: String, default: null },
  transcriptUrl: { type: String, default: null },
}, { timestamps: true });

module.exports = model('Ticket', ticketSchema);
