const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Deck title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    enum: ['ja', 'en'],
    required: true
  },
  cardCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Deck', deckSchema);
