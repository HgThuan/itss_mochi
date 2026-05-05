const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const Deck = require('../models/Deck');
const TestResult = require('../models/TestResult');
const { protect } = require('../middleware/auth');

// POST /api/test/generate/:deckId - Generate quiz questions
router.post('/generate/:deckId', protect, async (req, res) => {
  try {
    const { count = 10, type = 'multiple_choice' } = req.body;
    const deck = await Deck.findById(req.params.deckId);

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    const cards = await Card.find({ deckId: req.params.deckId });

    if (cards.length < 4) {
      return res.status(400).json({ message: 'Need at least 4 cards to generate a test' });
    }

    // Shuffle and pick cards for the test
    const shuffled = cards.sort(() => Math.random() - 0.5);
    const testCards = shuffled.slice(0, Math.min(count, cards.length));

    const questions = testCards.map(card => {
      // Get 3 wrong answers from other cards
      const otherCards = cards.filter(c => c._id.toString() !== card._id.toString());
      const wrongAnswers = otherCards
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.back);

      // Shuffle options
      const options = [...wrongAnswers, card.back].sort(() => Math.random() - 0.5);

      return {
        cardId: card._id,
        question: card.front,
        reading: card.reading,
        correctAnswer: card.back,
        options: type === 'multiple_choice' ? options : undefined,
        type
      };
    });

    res.json({
      deckTitle: deck.title,
      totalQuestions: questions.length,
      questions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/test/submit - Submit test answers
router.post('/submit', protect, async (req, res) => {
  try {
    const { deckId, answers } = req.body;

    let score = 0;
    const processedAnswers = answers.map(a => {
      const correct = a.userAnswer === a.correctAnswer;
      if (correct) score++;
      return {
        cardId: a.cardId,
        userAnswer: a.userAnswer,
        correct
      };
    });

    const result = await TestResult.create({
      userId: req.user._id,
      deckId,
      score,
      totalQuestions: answers.length,
      answers: processedAnswers
    });

    res.status(201).json({
      score,
      totalQuestions: answers.length,
      percentage: Math.round((score / answers.length) * 100),
      result
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/test/history - Get test history
router.get('/history', protect, async (req, res) => {
  try {
    const results = await TestResult.find({ userId: req.user._id })
      .populate('deckId', 'title language')
      .sort({ completedAt: -1 })
      .limit(20);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/test/history/:deckId - Get history for specific deck
router.get('/history/:deckId', protect, async (req, res) => {
  try {
    const results = await TestResult.find({
      userId: req.user._id,
      deckId: req.params.deckId
    }).sort({ completedAt: -1 }).limit(10);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
