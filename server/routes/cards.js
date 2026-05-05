const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const Deck = require('../models/Deck');
const { protect } = require('../middleware/auth');

// GET /api/cards/:deckId - Get all cards in a deck
router.get('/:deckId', protect, async (req, res) => {
  try {
    const cards = await Card.find({ deckId: req.params.deckId });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/cards - Create a new card
router.post('/', protect, async (req, res) => {
  try {
    const { deckId, front, back, reading, example } = req.body;

    // Verify deck ownership
    const deck = await Deck.findById(deckId);
    if (!deck || deck.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const card = await Card.create({ deckId, front, back, reading, example });

    // Update card count
    deck.cardCount = await Card.countDocuments({ deckId });
    await deck.save();

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/cards/bulk - Create multiple cards at once
router.post('/bulk', protect, async (req, res) => {
  try {
    const { deckId, cards } = req.body;

    const deck = await Deck.findById(deckId);
    if (!deck || deck.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const cardsToCreate = cards.map(c => ({
      deckId,
      front: c.front,
      back: c.back,
      reading: c.reading || '',
      example: c.example || ''
    }));

    const created = await Card.insertMany(cardsToCreate);

    deck.cardCount = await Card.countDocuments({ deckId });
    await deck.save();

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/cards/:id - Update a card
router.put('/:id', protect, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const { front, back, reading, example, difficulty } = req.body;
    if (front) card.front = front;
    if (back) card.back = back;
    if (reading !== undefined) card.reading = reading;
    if (example !== undefined) card.example = example;
    if (difficulty) card.difficulty = difficulty;

    await card.save();
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/cards/:id/review - Mark card as reviewed (spaced repetition)
router.put('/:id/review', protect, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const { difficulty } = req.body; // 1=easy, 3=medium, 5=hard

    card.reviewCount += 1;
    card.lastReviewed = new Date();
    card.difficulty = difficulty || card.difficulty;

    // Simple spaced repetition: next review based on difficulty
    const intervals = { 1: 7, 2: 3, 3: 1, 4: 0.5, 5: 0.25 }; // days
    const daysUntilNext = intervals[card.difficulty] || 1;
    card.nextReview = new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000);

    await card.save();
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/cards/:id - Delete a card
router.delete('/:id', protect, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const deckId = card.deckId;
    await Card.deleteOne({ _id: card._id });

    // Update card count
    const deck = await Deck.findById(deckId);
    if (deck) {
      deck.cardCount = await Card.countDocuments({ deckId });
      await deck.save();
    }

    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
