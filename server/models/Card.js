const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true
  },
  front: {
    type: String,
    required: [true, 'Front text is required'],
    trim: true
  },
  back: {
    type: String,
    default: '',
    trim: true
  },
  reading: {
    type: String,
    default: ''
  },
  example: {
    type: String,
    default: ''
  },
  difficulty: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  lastReviewed: {
    type: Date,
    default: null
  },
  nextReview: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Card', cardSchema);
