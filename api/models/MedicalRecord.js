const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true, trim: true },
  treatment: { type: String, trim: true },
  vet: { type: String, trim: true },
  followUpDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
