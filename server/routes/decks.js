const express = require('express');
const router = express.Router();
const Deck = require('../models/Deck');
const Card = require('../models/Card');
const { protect } = require('../middleware/auth');

// GET /api/decks - Get all decks for user
router.get('/', protect, async (req, res) => {
  try {
    const decks = await Deck.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(decks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/decks/public - Get public decks
router.get('/public', protect, async (req, res) => {
  try {
    const decks = await Deck.find({ isPublic: true })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(decks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/decks/:id - Get single deck with cards
router.get('/:id', protect, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Allow access if owner or public
    if (deck.userId.toString() !== req.user._id.toString() && !deck.isPublic) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const cards = await Card.find({ deckId: deck._id });
    res.json({ deck, cards });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/decks - Create new deck
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, language, isPublic } = req.body;

    const deck = await Deck.create({
      userId: req.user._id,
      title,
      description,
      language,
      isPublic: isPublic || false
    });

    res.status(201).json(deck);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/decks/:id - Update deck
router.put('/:id', protect, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    if (deck.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, language, isPublic } = req.body;
    deck.title = title || deck.title;
    deck.description = description || deck.description;
    deck.language = language || deck.language;
    deck.isPublic = isPublic !== undefined ? isPublic : deck.isPublic;

    await deck.save();
    res.json(deck);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/decks/:id - Delete deck and its cards
router.delete('/:id', protect, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    if (deck.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Card.deleteMany({ deckId: deck._id });
    await Deck.deleteOne({ _id: deck._id });

    res.json({ message: 'Deck deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
