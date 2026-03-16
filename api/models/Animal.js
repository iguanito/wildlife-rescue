const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  species: { type: String, required: true, trim: true },
  intakeDate: { type: Date, required: true, default: Date.now },
  status: {
    type: String,
    enum: ['intake', 'treatment', 'ready-for-adoption', 'released', 'deceased'],
    default: 'intake',
  },
  notes: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Animal', animalSchema);
