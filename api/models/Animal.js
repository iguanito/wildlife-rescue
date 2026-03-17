const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  givenName: { type: String, trim: true },
  commonName: { type: String, trim: true },
  scientificName: { type: String, trim: true },
  animalGroup: { type: String, trim: true },
  estimatedDateOfBirth: { type: Date },
  ageAtAdmission: { type: String, trim: true },
  sex: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
  microchipNumber: { type: String, trim: true },
  placement: { type: String, trim: true },
  intakeDate: { type: Date, required: true, default: Date.now },
  status: {
    type: String,
    enum: ['in-center', 'released', 'deceased'],
    default: 'in-center',
  },
  otherDetails: { type: String, trim: true },

  // Rescue info
  incomeReasons: { type: String, trim: true },
  rescueDate: { type: Date },
  whereFound: { type: String, trim: true },
  distanceFromCenter: { type: Number },
  latitude: { type: Number },
  longitude: { type: Number },
  captureNeeded: { type: Boolean, default: false },
  whoBrought: { type: String, trim: true },
  whoCalled: { type: String, trim: true },
  callDetails: { type: String, trim: true },
  otherRescueDetails: { type: String, trim: true },

  // Clinical info
  arrivalWeight: { type: Number },
  hadTreatment: { type: Boolean, default: false },
  underVigilance: { type: Boolean, default: false },
  inClinic: { type: Boolean, default: false },
  firstExamination: { type: String, trim: true },
  clinicalEvolution: { type: String, trim: true },
  necropsyDetails: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Animal', animalSchema);
