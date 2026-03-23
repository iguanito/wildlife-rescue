const mongoose = require('mongoose');

const careLogSchema = new mongoose.Schema({
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  date: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now },
  type: { type: String, enum: ['feeding', 'weight', 'observation'], required: true },
  value: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

careLogSchema.index({ animal: 1, date: -1, type: 1 });

module.exports = mongoose.model('CareLog', careLogSchema);
