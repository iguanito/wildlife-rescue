const router = require('express').Router();
const Animal = require('../models/Animal');
const MedicalRecord = require('../models/MedicalRecord');
const CareLog = require('../models/CareLog');
const requireRole = require('../middleware/authorize');

// GET /api/animals
router.get('/', async (req, res) => {
  try {
    const { status, species, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (species) filter.species = new RegExp(species, 'i');
    if (search) filter.name = new RegExp(search, 'i');
    const animals = await Animal.find(filter).sort({ createdAt: -1 });
    res.json(animals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/animals
router.post('/', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const animal = await Animal.create(req.body);
    res.status(201).json(animal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/animals/:id
router.get('/:id', async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    res.json(animal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/animals/:id
router.put('/:id', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const animal = await Animal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    res.json(animal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/animals/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const animal = await Animal.findByIdAndDelete(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    await MedicalRecord.deleteMany({ animal: req.params.id });
    res.json({ message: 'Animal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/animals/:id/medical
router.get('/:id/medical', async (req, res) => {
  try {
    const records = await MedicalRecord.find({ animal: req.params.id })
      .sort({ date: -1 })
      .populate('createdBy', 'email role');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/animals/:id/medical
router.post('/:id/medical', requireRole('vet', 'admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.create({ ...req.body, animal: req.params.id, createdBy: req.user._id });
    const populated = await MedicalRecord.findById(record._id).populate('createdBy', 'email role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/animals/:id/carelogs
router.get('/:id/carelogs', async (req, res) => {
  try {
    const logs = await CareLog.find({ animal: req.params.id })
      .sort({ date: -1 })
      .populate('createdBy', 'email role');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/animals/:id/carelogs
router.post('/:id/carelogs', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const log = await CareLog.create({
      ...req.body,
      animal: req.params.id,
      createdBy: req.user._id,
    });
    const populated = await CareLog.findById(log._id).populate('createdBy', 'email role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/animals/:id/carelogs/:logId — vet/admin only
router.delete('/:id/carelogs/:logId', requireRole('vet', 'admin'), async (req, res) => {
  try {
    const log = await CareLog.findOneAndDelete({ _id: req.params.logId, animal: req.params.id });
    if (!log) return res.status(404).json({ error: 'Care log not found' });
    res.json({ message: 'Care log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/animals/:id/carelogs/:logId — vet/admin: any entry; staff: own entry within 24h
router.put('/:id/carelogs/:logId', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const log = await CareLog.findOne({ _id: req.params.logId, animal: req.params.id });
    if (!log) return res.status(404).json({ error: 'Care log not found' });

    const { role, _id: userId } = req.user;
    if (role === 'staff') {
      if (log.createdBy?.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'You can only edit your own entries' });
      }
      const ageMs = Date.now() - new Date(log.createdAt).getTime();
      if (ageMs > 24 * 60 * 60 * 1000) {
        return res.status(403).json({ error: 'Staff can only edit entries within 24 hours of creation' });
      }
    }

    const { date, type, value, notes } = req.body;
    const updated = await CareLog.findByIdAndUpdate(
      req.params.logId,
      { date, type, value, notes },
      { new: true, runValidators: true }
    ).populate('createdBy', 'email role');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
