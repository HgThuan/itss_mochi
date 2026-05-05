const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['cat', 'dog', 'dragon', 'fox'],
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  exp: {
    type: Number,
    default: 0
  },
  stage: {
    type: String,
    enum: ['egg', 'baby', 'teen', 'adult', 'legendary'],
    default: 'egg'
  },
  happiness: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  accessories: [{
    type: String
  }],
  lastFed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pet', petSchema);
