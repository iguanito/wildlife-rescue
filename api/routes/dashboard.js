const router = require('express').Router();
const MedicalRecord = require('../models/MedicalRecord');
const Animal = require('../models/Animal');

// GET /api/dashboard/today — today's follow-up tasks (per D-A1, D-A2)
// Visible to all authenticated roles; no requireRole needed (dashboard GET is read-only)
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const tasks = await MedicalRecord.aggregate([
      {
        $match: {
          followUpDate: { $gte: today, $lt: tomorrow },
          followUpCompleted: false
        }
      },
      {
        $lookup: {
          from: 'animals',
          localField: 'animal',
          foreignField: '_id',
          as: 'animalData'
        }
      },
      { $unwind: '$animalData' },
      { $match: { 'animalData.status': 'in-center' } },
      {
        $project: {
          _id: 1,
          followUpDate: 1,
          description: 1,
          'animalData._id': 1,
          'animalData.givenName': 1,
          'animalData.commonName': 1
        }
      },
      { $sort: { followUpDate: 1 } }
    ]);

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/status — animal counts by status (per D-D1, D-D2, D-D3)
// Always returns exactly 3 entries; zero-count statuses included (per D-D3)
router.get('/status', async (req, res) => {
  try {
    const counts = await Animal.aggregate([
      { $match: { status: { $in: ['in-center', 'released', 'deceased'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Ensure all 3 statuses present even with zero count (per D-D3 / RESEARCH.md Pitfall 2)
    const allStatuses = ['in-center', 'released', 'deceased'];
    const countMap = {};
    counts.forEach(({ _id, count }) => { countMap[_id] = count; });
    const result = allStatuses.map(status => ({
      status,
      count: countMap[status] || 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
