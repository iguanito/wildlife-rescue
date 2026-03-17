const router = require('express').Router();
const Species = require('../models/Species');

// GET /api/species?q=query&group=Bird
router.get('/', async (req, res) => {
  try {
    const { q, group } = req.query;
    const filter = {};
    if (group) filter.group = group;
    if (q) {
      filter.$or = [
        { commonName: new RegExp(q, 'i') },
        { scientificName: new RegExp(q, 'i') },
      ];
    }
    const species = await Species.find(filter).limit(10).sort({ commonName: 1 });
    res.json(species);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
