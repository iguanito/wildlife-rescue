const mongoose = require('mongoose');

const careLogSchema = new mongoose.Schema({
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  date: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now },
  feeding: { type: String, trim: true },
  weight: { type: String, trim: true },
  observation: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

careLogSchema.index({ animal: 1, date: -1 });

module.exports = mongoose.model('CareLog', careLogSchema);
