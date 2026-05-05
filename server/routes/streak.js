const express = require('express');
const router = express.Router();
const Streak = require('../models/Streak');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateStreak, logStudySession, MILESTONES } = require('../services/streakService');

// GET /api/streak - Get current streak
router.get('/', protect, async (req, res) => {
  try {
    let streak = await Streak.findOne({ userId: req.user._id });
    if (!streak) {
      streak = await Streak.create({ userId: req.user._id });
    }
    const user = await User.findById(req.user._id);

    // Get today's log
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayLog = streak.dailyLogs.find(log => {
      return new Date(log.date).toISOString().split('T')[0] === todayStr;
    });

    res.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      freezesOwned: streak.freezesOwned,
      dailyGoalMinutes: user.dailyGoalMinutes,
      todayMinutes: todayLog ? todayLog.minutesStudied : 0,
      todayGoalMet: todayLog ? todayLog.goalMet : false,
      milestones: streak.milestones,
      recentLogs: streak.dailyLogs.slice(-7)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/streak/log - Log study session
router.post('/log', protect, async (req, res) => {
  try {
    const { minutes } = req.body;
    if (!minutes || minutes <= 0) {
      return res.status(400).json({ message: 'Minutes must be positive' });
    }

    const result = await updateStreak(req.user._id);
    const streak = await logStudySession(req.user._id, minutes);

    res.json({
      streak,
      newMilestones: result.newMilestones || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/streak/buy-freeze - Buy streak freeze
router.post('/buy-freeze', protect, async (req, res) => {
  try {
    const FREEZE_COST = 50;
    const user = await User.findById(req.user._id);

    if (user.coins < FREEZE_COST) {
      return res.status(400).json({ message: `Not enough coins. Need ${FREEZE_COST} coins.` });
    }

    user.coins -= FREEZE_COST;
    await user.save();

    const streak = await Streak.findOne({ userId: req.user._id });
    streak.freezesOwned += 1;
    await streak.save();

    res.json({
      message: 'Streak freeze purchased!',
      coins: user.coins,
      freezesOwned: streak.freezesOwned
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/streak/use-freeze - Use streak freeze manually
router.post('/use-freeze', protect, async (req, res) => {
  try {
    const streak = await Streak.findOne({ userId: req.user._id });

    if (streak.freezesOwned <= 0) {
      return res.status(400).json({ message: 'No freeze available' });
    }

    streak.freezesOwned -= 1;
    streak.freezeUsedDates.push(new Date());
    await streak.save();

    res.json({
      message: 'Streak freeze used!',
      freezesOwned: streak.freezesOwned
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/streak/claim-milestone - Claim milestone reward
router.post('/claim-milestone', protect, async (req, res) => {
  try {
    const { days } = req.body;
    const streak = await Streak.findOne({ userId: req.user._id });
    const milestone = streak.milestones.find(m => m.days === days && !m.rewardClaimed);

    if (!milestone) {
      return res.status(400).json({ message: 'Milestone not found or already claimed' });
    }

    const milestoneConfig = MILESTONES.find(m => m.days === days);
    const user = await User.findById(req.user._id);
    user.coins += milestoneConfig.reward;
    await user.save();

    milestone.rewardClaimed = true;
    await streak.save();

    res.json({
      message: `Milestone claimed! +${milestoneConfig.reward} coins`,
      badge: milestoneConfig.badge,
      coins: user.coins
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/streak/milestones - Get all milestones
router.get('/milestones', protect, async (req, res) => {
  try {
    const streak = await Streak.findOne({ userId: req.user._id });
    const achievedDays = streak ? streak.milestones.map(m => m.days) : [];

    const milestones = MILESTONES.map(m => ({
      ...m,
      achieved: achievedDays.includes(m.days),
      achievedAt: streak?.milestones.find(sm => sm.days === m.days)?.achievedAt,
      rewardClaimed: streak?.milestones.find(sm => sm.days === m.days)?.rewardClaimed || false
    }));

    res.json(milestones);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
