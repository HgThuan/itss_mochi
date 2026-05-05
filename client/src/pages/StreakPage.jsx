import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const StreakPage = () => {
  const { user, fetchUser } = useAuth();
  const { addToast, ToastContainer } = useToast();
  const [streak, setStreak] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const [streakRes, milestonesRes] = await Promise.all([
        api.get('/streak'),
        api.get('/streak/milestones')
      ]);
      setStreak(streakRes.data);
      setMilestones(milestonesRes.data);
    } catch (err) {
      addToast('Failed to load streak data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const buyFreeze = async () => {
    try {
      const res = await api.post('/streak/buy-freeze');
      addToast(res.data.message, 'success');
      fetchUser();
      loadStreakData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to buy freeze', 'error');
    }
  };

  const claimMilestone = async (days) => {
    try {
      const res = await api.post('/streak/claim-milestone', { days });
      addToast(res.data.message, 'success');
      fetchUser();
      loadStreakData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to claim milestone', 'error');
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  const goalPercent = streak ? Math.min(100, Math.round((streak.todayMinutes / streak.dailyGoalMinutes) * 100)) : 0;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">🔥 <span className="text-gradient-fire">Streak</span></h1>
        <p className="page-subtitle">Keep your learning streak alive!</p>
      </div>

      <div className="dashboard-grid">
        <div>
          {/* Main Streak Display */}
          <div className="glass-card streak-display">
            <div className="streak-fire">🔥</div>
            <div className="streak-count">
              <span className="text-gradient-fire">{streak?.currentStreak || 0}</span>
            </div>
            <div className="streak-label">Day Streak</div>

            <div style={{ marginTop: 'var(--space-lg)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Longest streak: <strong>{streak?.longestStreak || 0}</strong> days
            </div>

            {/* Weekly Progress */}
            <div className="streak-week">
              {days.map((day, idx) => {
                const isToday = new Date().getDay() === (idx + 1) % 7;
                const log = streak?.recentLogs?.[idx];
                const completed = log?.goalMet;
                return (
                  <div
                    key={day}
                    className={`streak-day ${completed ? 'completed' : ''} ${isToday ? 'today' : ''}`}
                  >
                    {completed ? '✓' : day.charAt(0)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Goal */}
          <div className="glass-card section-card">
            <div className="section-title">📊 Today's Goal</div>
            <div className="daily-goal">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>
                  {streak?.todayMinutes || 0} / {streak?.dailyGoalMinutes || 5} minutes
                </span>
                <span style={{ color: goalPercent >= 100 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                  {goalPercent}%
                </span>
              </div>
              <div className="goal-progress-track">
                <div className="goal-progress-fill" style={{ width: `${goalPercent}%` }}></div>
              </div>
              {streak?.todayGoalMet && (
                <p style={{ color: 'var(--accent-green)', marginTop: '0.75rem', fontWeight: 600 }}>
                  ✓ Daily goal completed! Great job! 🎉
                </p>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div className="glass-card section-card">
            <div className="section-title">🏆 Milestones</div>
            <div className="milestones-list">
              {milestones.map((m, idx) => (
                <div key={idx} className={`milestone-item ${m.achieved ? 'achieved' : ''}`}>
                  <div className="milestone-badge">
                    {m.achieved ? m.badge.split(' ')[0] : '🔒'}
                  </div>
                  <div className="milestone-info">
                    <div className="milestone-title">
                      {m.days}-Day {m.badge.split(' ').slice(1).join(' ')}
                    </div>
                    <div className="milestone-reward">🪙 {m.reward} coins</div>
                  </div>
                  {m.achieved && !m.rewardClaimed && (
                    <button className="btn btn-success btn-sm" onClick={() => claimMilestone(m.days)}>
                      Claim!
                    </button>
                  )}
                  {m.rewardClaimed && (
                    <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem' }}>✓ Claimed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Freeze */}
          <div className="glass-card section-card" style={{ textAlign: 'center' }}>
            <div className="section-title">❄️ Streak Freeze</div>
            <div style={{ fontSize: '3rem', margin: 'var(--space-lg) 0' }}>❄️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {streak?.freezesOwned || 0}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-lg)' }}>
              Freezes available
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-lg)' }}>
              Streak freezes protect your streak on days you can't study. One freeze covers one missed day.
            </p>
            <button
              className="btn btn-primary"
              onClick={buyFreeze}
              disabled={(user?.coins || 0) < 50}
              style={{ width: '100%' }}
            >
              🪙 Buy Freeze (50 coins)
            </button>
            <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Your coins: 🪙 {user?.coins || 0}
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card section-card">
            <div className="section-title">📈 Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Streak</span>
                <span style={{ fontWeight: 700 }}>{streak?.currentStreak || 0} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Best Streak</span>
                <span style={{ fontWeight: 700 }}>{streak?.longestStreak || 0} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Today's Study</span>
                <span style={{ fontWeight: 700 }}>{streak?.todayMinutes || 0} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Daily Goal</span>
                <span style={{ fontWeight: 700 }}>{streak?.dailyGoalMinutes || 5} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Freezes Used</span>
                <span style={{ fontWeight: 700 }}>{streak?.freezeUsedDates?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakPage;
