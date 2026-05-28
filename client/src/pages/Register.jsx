import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const Register = () => {
  const { t, setLanguage } = useTranslation();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: localStorage.getItem('preferredLanguage') || 'ja'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'preferredLanguage') {
      setLanguage(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.preferredLanguage);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
            <h1 className="auth-title">{t('auth.signUpTitle')}</h1>
            <p className="auth-subtitle">{t('auth.signUpSubtitle')}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('auth.username')}</label>
              <input
                id="register-username"
                type="text"
                name="username"
                className="form-input"
                placeholder={t('auth.placeholderUsername')}
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input
                id="register-email"
                type="email"
                name="email"
                className="form-input"
                placeholder={t('auth.placeholderEmail')}
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.preferredLang')}</label>
              <select
                id="register-language"
                name="preferredLanguage"
                className="form-select"
                value={form.preferredLanguage}
                onChange={handleChange}
              >
                <option value="ja">🇯🇵 Japanese (日本語)</option>
                <option value="en">🇬🇧 English</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.password')}</label>
              <input
                id="register-password"
                type="password"
                name="password"
                className="form-input"
                placeholder={t('auth.placeholderPassword')}
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.confirmPassword')}</label>
              <input
                id="register-confirm"
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder={t('auth.placeholderConfirm')}
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('auth.loadingCreate') : t('auth.signUpBtn')}
            </button>
          </form>

          <div className="auth-footer">
            {t('auth.hasAccount')} <Link to="/login">{t('auth.signInLink')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
