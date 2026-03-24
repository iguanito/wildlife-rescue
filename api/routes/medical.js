const router = require('express').Router();
const MedicalRecord = require('../models/MedicalRecord');
const requireRole = require('../middleware/authorize');

// PATCH /api/medical/:id — mark follow-up as completed (staff/vet/admin only; per D-A3)
router.patch('/:id', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { followUpCompleted: true },
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/medical/:id
router.put('/:id', requireRole('vet', 'admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/medical/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
