const Pet = require('../models/Pet');

const EVOLUTION_STAGES = {
  egg: { minExp: 0, maxExp: 50 },
  baby: { minExp: 51, maxExp: 200 },
  teen: { minExp: 201, maxExp: 500 },
  adult: { minExp: 501, maxExp: 1000 },
  legendary: { minExp: 1001, maxExp: Infinity }
};

const EXP_REWARDS = {
  flashcard_session: 10,
  test_pass: 20,
  test_perfect: 50,
  daily_streak: 5,
  milestone: 30
};

const getStageForExp = (exp) => {
  for (const [stage, range] of Object.entries(EVOLUTION_STAGES)) {
    if (exp >= range.minExp && exp <= range.maxExp) {
      return stage;
    }
  }
  return 'legendary';
};

const addExp = async (userId, action) => {
  const pet = await Pet.findOne({ userId });
  if (!pet) return null;

  const expGain = EXP_REWARDS[action] || 0;
  pet.exp += expGain;
  pet.level = Math.floor(pet.exp / 50) + 1;

  const newStage = getStageForExp(pet.exp);
  const evolved = newStage !== pet.stage;
  pet.stage = newStage;

  // Increase happiness
  pet.happiness = Math.min(100, pet.happiness + 5);
  pet.lastFed = new Date();

  await pet.save();
  return { pet, expGain, evolved, newStage };
};

const decreaseHappiness = async (userId) => {
  const pet = await Pet.findOne({ userId });
  if (!pet) return null;

  const hoursSinceLastFed = (Date.now() - pet.lastFed.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastFed > 48) {
    pet.happiness = Math.max(0, pet.happiness - 10);
    await pet.save();
  }

  return pet;
};

module.exports = { addExp, decreaseHappiness, getStageForExp, EVOLUTION_STAGES, EXP_REWARDS };
