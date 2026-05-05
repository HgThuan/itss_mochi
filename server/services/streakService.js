const Streak = require('../models/Streak');
const User = require('../models/User');

const MILESTONES = [
  { days: 3, reward: 30, badge: '🔥 3-Day Starter' },
  { days: 7, reward: 50, badge: '⭐ Week Warrior' },
  { days: 14, reward: 100, badge: '💪 Two-Week Champion' },
  { days: 30, reward: 200, badge: '🏆 Monthly Master' },
  { days: 60, reward: 400, badge: '💎 Diamond Learner' },
  { days: 100, reward: 1000, badge: '👑 Century Legend' },
  { days: 365, reward: 5000, badge: '🌟 Year-Long Hero' }
];

const getToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getYesterday = () => {
  const today = getToday();
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
};

const updateStreak = async (userId) => {
  let streak = await Streak.findOne({ userId });
  if (!streak) {
    streak = await Streak.create({ userId });
  }

  const today = getToday();
  const yesterday = getYesterday();

  if (streak.lastActiveDate) {
    const lastActive = new Date(streak.lastActiveDate);
    const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

    if (lastActiveDay.getTime() === today.getTime()) {
      // Already logged today
      return streak;
    }

    if (lastActiveDay.getTime() === yesterday.getTime()) {
      // Consecutive day
      streak.currentStreak += 1;
    } else {
      // Check if freeze was used
      const daysMissed = Math.floor((today.getTime() - lastActiveDay.getTime()) / (24 * 60 * 60 * 1000));

      if (daysMissed <= 2 && streak.freezesOwned > 0) {
        // Auto-use freeze for missed days
        streak.freezesOwned -= 1;
        streak.freezeUsedDates.push(yesterday);
        streak.currentStreak += 1;
      } else {
        // Streak broken
        streak.currentStreak = 1;
      }
    }
  } else {
    streak.currentStreak = 1;
  }

  streak.lastActiveDate = today;
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  // Check milestones
  const newMilestones = [];
  for (const milestone of MILESTONES) {
    if (streak.currentStreak >= milestone.days) {
      const alreadyAchieved = streak.milestones.some(m => m.days === milestone.days);
      if (!alreadyAchieved) {
        streak.milestones.push({
          days: milestone.days,
          achievedAt: new Date(),
          rewardClaimed: false
        });
        newMilestones.push(milestone);
      }
    }
  }

  await streak.save();
  return { streak, newMilestones };
};

const logStudySession = async (userId, minutes) => {
  let streak = await Streak.findOne({ userId });
  if (!streak) {
    streak = await Streak.create({ userId });
  }

  const today = getToday();
  const user = await User.findById(userId);
  const dailyGoal = user.dailyGoalMinutes || 5;

  // Find or create today's log
  let todayLog = streak.dailyLogs.find(log => {
    const logDate = new Date(log.date);
    return logDate.getFullYear() === today.getFullYear() &&
           logDate.getMonth() === today.getMonth() &&
           logDate.getDate() === today.getDate();
  });

  if (todayLog) {
    todayLog.minutesStudied += minutes;
    todayLog.goalMet = todayLog.minutesStudied >= dailyGoal;
  } else {
    streak.dailyLogs.push({
      date: today,
      minutesStudied: minutes,
      goalMet: minutes >= dailyGoal
    });
  }

  await streak.save();
  return streak;
};

module.exports = { updateStreak, logStudySession, MILESTONES };
