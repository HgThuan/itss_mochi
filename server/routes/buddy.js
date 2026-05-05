const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const StudyBuddy = require('../models/StudyBuddy');
const Deck = require('../models/Deck');
const Streak = require('../models/Streak');
const { protect } = require('../middleware/auth');

// POST /api/buddy/create - Create study group
router.post('/create', protect, async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const inviteCode = uuidv4().slice(0, 8).toUpperCase();

    const group = await StudyBuddy.create({
      ownerId: req.user._id,
      inviteCode,
      members: [req.user._id],
      groupName
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/buddy/join/:code - Join group via code
router.post('/join/:code', protect, async (req, res) => {
  try {
    const group = await StudyBuddy.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    group.members.push(req.user._id);
    await group.save();

    await group.populate('members', 'username email');
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/buddy/groups - Get user's groups
router.get('/groups', protect, async (req, res) => {
  try {
    const groups = await StudyBuddy.find({ members: req.user._id })
      .populate('members', 'username email')
      .populate('ownerId', 'username')
      .populate('sharedDecks', 'title language cardCount');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/buddy/share-deck - Share deck with group
router.post('/share-deck', protect, async (req, res) => {
  try {
    const { groupId, deckId } = req.body;

    const group = await StudyBuddy.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    if (!group.sharedDecks.includes(deckId)) {
      group.sharedDecks.push(deckId);
      // Make deck public within group context
      deck.isPublic = true;
      await deck.save();
      await group.save();
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/buddy/leaderboard/:groupId - Group leaderboard
router.get('/leaderboard/:groupId', protect, async (req, res) => {
  try {
    const group = await StudyBuddy.findById(req.params.groupId)
      .populate('members', 'username');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const leaderboard = [];
    for (const member of group.members) {
      const streak = await Streak.findOne({ userId: member._id });
      leaderboard.push({
        userId: member._id,
        username: member.username,
        currentStreak: streak ? streak.currentStreak : 0,
        longestStreak: streak ? streak.longestStreak : 0,
        totalMinutes: streak ? streak.dailyLogs.reduce((sum, l) => sum + l.minutesStudied, 0) : 0
      });
    }

    // Sort by current streak then total minutes
    leaderboard.sort((a, b) => b.currentStreak - a.currentStreak || b.totalMinutes - a.totalMinutes);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
