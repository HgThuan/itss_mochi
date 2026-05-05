import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [streak, setStreak] = useState(null);
  const [pet, setPet] = useState(null);
  const [decks, setDecks] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [streakRes, petRes, decksRes, testRes] = await Promise.all([
        api.get('/streak').catch(() => ({ data: null })),
        api.get('/pet').catch(() => ({ data: null })),
        api.get('/decks').catch(() => ({ data: [] })),
        api.get('/test/history').catch(() => ({ data: [] }))
      ]);
      setStreak(streakRes.data);
      setPet(petRes.data);
      setDecks(Array.isArray(decksRes.data) ? decksRes.data : []);
      setRecentTests(Array.isArray(testRes.data) ? testRes.data.slice(0, 3) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const goalPercent = streak ? Math.min(100, Math.round((streak.todayMinutes / streak.dailyGoalMinutes) * 100)) : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Welcome back, <span className="text-gradient">{user?.username}</span>! 👋
        </h1>
        <p className="page-subtitle">Here's your learning overview for today</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="glass-card stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value text-gradient-fire">{streak?.currentStreak || 0}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value text-gradient">{decks.length}</div>
          <div className="stat-label">Flashcard Decks</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon">🪙</div>
          <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>{user?.coins || 0}</div>
          <div className="stat-label">Coins</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Main content */}
        <div>
          {/* Daily Goal Progress */}
          <div className="glass-card section-card">
            <div className="section-title">📊 Today's Progress</div>
            <div className="daily-goal">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{streak?.todayMinutes || 0} min studied</span>
                <span style={{ color: 'var(--text-secondary)' }}>Goal: {streak?.dailyGoalMinutes || 5} min</span>
              </div>
              <div className="goal-progress-track">
                <div className="goal-progress-fill" style={{ width: `${goalPercent}%` }}></div>
              </div>
              {streak?.todayGoalMet && (
                <p style={{ color: 'var(--accent-green)', marginTop: '0.5rem', fontWeight: 600 }}>
                  ✓ Daily goal completed!
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card section-card">
            <div className="section-title">⚡ Quick Actions</div>
            <div className="quick-actions">
              <button className="quick-action-btn" onClick={() => navigate('/decks')}>
                <span className="action-icon">📇</span>
                <span className="action-label">Study Flashcards</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/extract')}>
                <span className="action-icon">✨</span>
                <span className="action-label">Extract Words</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/test')}>
                <span className="action-icon">📝</span>
                <span className="action-label">Take a Test</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/buddy')}>
                <span className="action-icon">👥</span>
                <span className="action-label">Study Buddy</span>
              </button>
            </div>
          </div>

          {/* Recent Decks */}
          {decks.length > 0 && (
            <div className="glass-card section-card">
              <div className="section-title">📚 Recent Decks</div>
              {decks.slice(0, 3).map(deck => (
                <div
                  key={deck._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-glass)',
                    marginBottom: '0.5rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/decks/${deck._id}`)}
                >
                  <div>
                    <span style={{ marginRight: '0.5rem' }}>{deck.language === 'ja' ? '🇯🇵' : '🇬🇧'}</span>
                    <strong>{deck.title}</strong>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {deck.cardCount} cards
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar content */}
        <div>
          {/* Pet Widget */}
          <div className="glass-card section-card" style={{ textAlign: 'center' }}>
            <div className="section-title">🐾 Your Pet</div>
            {pet?.hasPet ? (
              <div>
                <div style={{ fontSize: '4rem', margin: '1rem 0' }}>
                  {pet.pet.type === 'cat' ? '🐱' :
                   pet.pet.type === 'dog' ? '🐶' :
                   pet.pet.type === 'dragon' ? '🐉' : '🦊'}
                </div>
                <div style={{ fontWeight: 700 }}>{pet.pet.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Lv.{pet.pet.level} • {pet.pet.stage}
                </div>
                <div className="pet-exp-bar" style={{ margin: '0.75rem auto' }}>
                  <div className="pet-exp-fill" style={{
                    width: `${Math.min(100, (pet.pet.exp / (pet.nextStageExp || 100)) * 100)}%`
                  }}></div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '3rem', margin: '1rem 0', opacity: 0.5 }}>🥚</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  You don't have a pet yet!
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/pet')}>
                  Adopt a Pet
                </button>
              </div>
            )}
          </div>

          {/* Streak Widget */}
          <div className="glass-card section-card" style={{ textAlign: 'center' }}>
            <div className="section-title">🔥 Streak</div>
            <div className="streak-fire" style={{ fontSize: '2.5rem' }}>🔥</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              <span className="text-gradient-fire">{streak?.currentStreak || 0}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              days in a row
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Best: {streak?.longestStreak || 0} days | ❄️ {streak?.freezesOwned || 0} freezes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
