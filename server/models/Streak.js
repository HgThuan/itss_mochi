const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  freezesOwned: {
    type: Number,
    default: 0
  },
  freezeUsedDates: [{
    type: Date
  }],
  milestones: [{
    days: Number,
    achievedAt: Date,
    rewardClaimed: {
      type: Boolean,
      default: false
    }
  }],
  dailyLogs: [{
    date: {
      type: Date,
      required: true
    },
    minutesStudied: {
      type: Number,
      default: 0
    },
    goalMet: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Streak', streakSchema);
