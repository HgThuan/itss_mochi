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
  const { t } = useTranslation();

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
      await register(guestUsername, guestEmail, guestPassword, 'ja');
      navigate('/dashboard');
    } catch (regErr) {
      setError(regErr.response?.data?.message || 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="glass-card">
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('auth.loadingSignIn') : t('auth.signInBtn')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 'var(--space-md)', width: '100%' }}
              onClick={handleGuestLogin}
              disabled={loading}
            >
              👤 {t('auth.continueAsGuest')}
            </button>
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
