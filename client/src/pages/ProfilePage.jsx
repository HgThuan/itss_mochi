import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { addToast, ToastContainer } = useToast();
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
      addToast('Settings saved!', 'success');
    } catch (err) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">⚙️ <span className="text-gradient">Settings</span></h1>
        <p className="page-subtitle">Manage your profile and preferences</p>
      </div>

      <div className="profile-card">
        <div className="glass-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <h2>{user?.username}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email}</p>
            <div style={{ marginTop: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>🪙 {user?.coins || 0} coins</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Daily Goal (minutes)</label>
              <select
                className="form-select"
                value={form.dailyGoalMinutes}
                onChange={e => setForm(p => ({ ...p, dailyGoalMinutes: parseInt(e.target.value) }))}
              >
                <option value={5}>5 minutes / day</option>
                <option value={10}>10 minutes / day</option>
                <option value={15}>15 minutes / day</option>
                <option value={20}>20 minutes / day</option>
                <option value={30}>30 minutes / day</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Language</label>
              <select
                className="form-select"
                value={form.preferredLanguage}
                onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}
              >
                <option value="ja">🇯🇵 Japanese (日本語)</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%' }}
            >
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>

            <button
              className="btn btn-danger"
              onClick={logout}
              style={{ width: '100%' }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
