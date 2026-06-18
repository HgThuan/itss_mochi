import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { t, currentLang, setLanguage } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    
    // Generate a unique guest account
    const randomId = Math.random().toString(36).substring(2, 9);
    const guestUsername = `Guest_${randomId}`;
    const guestEmail = `guest_${randomId}@example.com`;
    const guestPassword = `guestPass_${randomId}`;
    
    try {
      await register(guestUsername, guestEmail, guestPassword, 'en');
      navigate('/dashboard');
    } catch (regErr) {
      setError(regErr.response?.data?.message || 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    const demoEmail = 'demo@lingua.com';
    const demoPassword = '123456';
    try {
      await login(demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err) {
      try {
        await register('Demo User', demoEmail, demoPassword, 'en');
        navigate('/dashboard');
      } catch (regErr) {
        setError(regErr.response?.data?.message || 'Failed to initialize demo account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1.5rem', position: 'relative', zIndex: 10 }}>
            <select
              value={currentLang}
              onChange={(e) => setLanguage(e.target.value)}
              className="form-select"
              style={{
                width: 'auto',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <option value="en">🇬🇧 English</option>
              <option value="ja">🇯🇵 Japanese</option>
              <option value="vi">🇻🇳 Tiếng Việt</option>
            </select>
          </div>

          <div className="auth-logo-section">
            <div className="auth-logo">🎓</div>
            <h1 className="auth-title">{t('auth.signInTitle')}</h1>
            <p className="auth-subtitle">{t('auth.signInSubtitle')}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder={t('auth.placeholderEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.password')}</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('auth.loadingSignIn') : t('auth.signInBtn')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDemoLogin}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                  borderColor: 'rgba(124, 58, 237, 0.3)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {t('auth.demoBtn')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGuestLogin}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%'
                }}
              >
                👤 {t('auth.continueAsGuest')}
              </button>
            </div>
          </form>

          <div className="auth-footer">
            {t('auth.noAccount')} <Link to="/register">{t('auth.signUpLink')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
