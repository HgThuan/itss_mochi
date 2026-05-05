const mongoose = require('mongoose');

const studyBuddySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sharedDecks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck'
  }],
  groupName: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyBuddy', studyBuddySchema);
