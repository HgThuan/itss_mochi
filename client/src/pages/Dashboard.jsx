import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [decks, setDecks] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [decksRes, testRes] = await Promise.all([
        api.get('/decks').catch(() => ({ data: [] })),
        api.get('/test/history').catch(() => ({ data: [] }))
      ]);
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {t('dashboard.welcome')}, <span className="text-gradient">{user?.username}</span>! 👋
        </h1>
        <p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards" style={{ gridTemplateColumns: '1fr' }}>
        <div className="glass-card stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value text-gradient">{decks.length}</div>
          <div className="stat-label">{t('dashboard.totalDecks')}</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        {/* Main content */}
        <div>
          {/* Quick Actions */}
          <div className="glass-card section-card">
            <div className="section-title">⚡ {t('dashboard.quickActions')}</div>
            <div className="quick-actions">
              <button className="quick-action-btn" onClick={() => navigate('/decks')}>
                <span className="action-icon">📇</span>
                <span className="action-label">{t('dashboard.startLearning')}</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/extract')}>
                <span className="action-icon">✨</span>
                <span className="action-label">{t('dashboard.extractWords')}</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/test')}>
                <span className="action-icon">📝</span>
                <span className="action-label">{t('dashboard.takeTest')}</span>
              </button>
            </div>
          </div>

          {/* Recent Decks */}
          {decks.length > 0 && (
            <div className="glass-card section-card" style={{ marginTop: '1.5rem' }}>
              <div className="section-title">📚 {t('dashboard.totalDecks')}</div>
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
                    {t('decks.totalCards', { count: deck.cardCount })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
