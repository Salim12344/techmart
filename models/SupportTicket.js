import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ['general', 'order-issue', 'payment', 'account', 'other'], default: 'general' },
  messages: [{
    sender: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'order' },
}, { timestamps: true });

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);
