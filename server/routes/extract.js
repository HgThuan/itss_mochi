const express = require('express');
const router = express.Router();
const { extractVocabulary } = require('../services/extractService');
const Deck = require('../models/Deck');
const Card = require('../models/Card');
const { protect } = require('../middleware/auth');

// POST /api/extract - Extract vocabulary from text
router.post('/', protect, async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text || !language) {
      return res.status(400).json({ message: 'Text and language are required' });
    }

    const words = extractVocabulary(text, language);
    res.json({ words, count: words.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/extract/to-deck - Extract and save to a new deck
router.post('/to-deck', protect, async (req, res) => {
  try {
    const { text, language, title, description } = req.body;

    if (!text || !language || !title) {
      return res.status(400).json({ message: 'Text, language, and title are required' });
    }

    let words = req.body.words;
    if (!words || !Array.isArray(words) || words.length === 0) {
      words = extractVocabulary(text, language);
    }

    if (words.length === 0) {
      return res.status(400).json({ message: 'No vocabulary found or provided' });
    }

    // Create deck
    const deck = await Deck.create({
      userId: req.user._id,
      title,
      description: description || `Extracted from text - ${words.length} words`,
      language
    });

    // Create cards — filter blanks, use ordered:false for fault tolerance
    const cardsToCreate = words
      .filter(w => w.front && w.front.trim().length > 0)
      .map(w => ({
        deckId: deck._id,
        front: w.front.trim(),
        back: w.back || '',
        reading: w.reading || ''
      }));

    if (cardsToCreate.length === 0) {
      await Deck.deleteOne({ _id: deck._id });
      return res.status(400).json({ message: 'No valid vocabulary words found' });
    }

    await Card.insertMany(cardsToCreate, { ordered: false });

    deck.cardCount = cardsToCreate.length;
    await deck.save();

    res.status(201).json({ deck, wordCount: words.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
