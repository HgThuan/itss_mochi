import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../hooks/useTranslation';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { addToast, ToastContainer } = useToast();
  const { t, setLanguage } = useTranslation();
  const [form, setForm] = useState({
    username: user?.username || '',
    dailyGoalMinutes: user?.dailyGoalMinutes || 5,
    preferredLanguage: user?.preferredLanguage || 'ja'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/settings', form);
      updateUser(res.data);
      setLanguage(form.preferredLanguage);
      addToast(t('settings.savedToast'), 'success');
    } catch (err) {
      addToast(t('settings.failedToast'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">⚙️ <span className="text-gradient">{t('settings.title')}</span></h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="profile-card">
        <div className="glass-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <h2>{user?.username}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">{t('settings.username')}</label>
              <input
                className="form-input"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('settings.dailyGoal')}</label>
              <select
                className="form-select"
                value={form.dailyGoalMinutes}
                onChange={e => setForm(p => ({ ...p, dailyGoalMinutes: parseInt(e.target.value) }))}
              >
                <option value={5}>{t('settings.minutesDay', { min: 5 })}</option>
                <option value={10}>{t('settings.minutesDay', { min: 10 })}</option>
                <option value={15}>{t('settings.minutesDay', { min: 15 })}</option>
                <option value={20}>{t('settings.minutesDay', { min: 20 })}</option>
                <option value={30}>{t('settings.minutesDay', { min: 30 })}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('settings.preferredLang')}</label>
              <select
                className="form-select"
                value={form.preferredLanguage}
                onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}
              >
                <option value="ja">🇯🇵 Japanese (日本語)</option>
                <option value="en">🇬🇧 English</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%' }}
            >
              {saving ? t('settings.saving') : t('settings.saveBtn')}
            </button>

            <button
              className="btn btn-danger"
              onClick={logout}
              style={{ width: '100%' }}
            >
              {t('settings.logoutBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
