const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { addExp, decreaseHappiness, EVOLUTION_STAGES, EXP_REWARDS } = require('../services/petService');

// GET /api/pet - Get user's pet
router.get('/', protect, async (req, res) => {
  try {
    let pet = await Pet.findOne({ userId: req.user._id });

    if (!pet) {
      return res.json({ hasPet: false, pet: null });
    }

    // Check happiness decay
    await decreaseHappiness(req.user._id);
    pet = await Pet.findOne({ userId: req.user._id });

    res.json({
      hasPet: true,
      pet,
      stages: EVOLUTION_STAGES,
      nextStageExp: getNextStageExp(pet.exp)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

function getNextStageExp(currentExp) {
  const stages = Object.entries(EVOLUTION_STAGES);
  for (const [stage, range] of stages) {
    if (currentExp <= range.maxExp) {
      return range.maxExp;
    }
  }
  return null;
}

// POST /api/pet/create - Create/adopt a pet
router.post('/create', protect, async (req, res) => {
  try {
    const existingPet = await Pet.findOne({ userId: req.user._id });
    if (existingPet) {
      return res.status(400).json({ message: 'You already have a pet!' });
    }

    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const pet = await Pet.create({
      userId: req.user._id,
      name,
      type
    });

    res.status(201).json({ pet });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/pet/feed - Feed pet (costs coins)
router.post('/feed', protect, async (req, res) => {
  try {
    const FEED_COST = 10;
    const user = await User.findById(req.user._id);

    if (user.coins < FEED_COST) {
      return res.status(400).json({ message: 'Not enough coins to feed pet' });
    }

    const pet = await Pet.findOne({ userId: req.user._id });
    if (!pet) {
      return res.status(404).json({ message: 'No pet found' });
    }

    user.coins -= FEED_COST;
    await user.save();

    pet.happiness = Math.min(100, pet.happiness + 15);
    pet.lastFed = new Date();
    pet.exp += 5;
    await pet.save();

    res.json({
      message: 'Pet fed successfully!',
      pet,
      coins: user.coins
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/pet/add-exp - Add exp to pet (used internally after study)
router.post('/add-exp', protect, async (req, res) => {
  try {
    const { action } = req.body;
    const result = await addExp(req.user._id, action);

    if (!result) {
      return res.status(404).json({ message: 'No pet found' });
    }

    res.json({
      pet: result.pet,
      expGain: result.expGain,
      evolved: result.evolved,
      newStage: result.newStage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
