const mongoose = require('mongoose');

const speciesSchema = new mongoose.Schema({
  commonName: { type: String, required: true, trim: true },
  scientificName: { type: String, required: true, trim: true },
  group: { type: String, required: true, enum: ['Mammal', 'Bird', 'Reptile', 'Amphibian'] },
}, { timestamps: true });

speciesSchema.index({ commonName: 'text', scientificName: 'text' });
speciesSchema.index({ group: 1 });

module.exports = mongoose.model('Species', speciesSchema);
