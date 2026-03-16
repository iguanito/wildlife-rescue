const router = require('express').Router();
const Animal = require('../models/Animal');
const MedicalRecord = require('../models/MedicalRecord');

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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
    const records = await MedicalRecord.find({ animal: req.params.id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/animals/:id/medical
router.post('/:id/medical', async (req, res) => {
  try {
    const record = await MedicalRecord.create({ ...req.body, animal: req.params.id });
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
