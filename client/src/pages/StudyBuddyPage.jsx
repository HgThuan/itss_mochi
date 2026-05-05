import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const StudyBuddyPage = () => {
  const { user } = useAuth();
  const { addToast, ToastContainer } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [decks, setDecks] = useState([]);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    loadGroups();
    loadDecks();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await api.get('/buddy/groups');
      setGroups(res.data);
    } catch (err) {
      addToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDecks = async () => {
    try {
      const res = await api.get('/decks');
      setDecks(res.data);
    } catch (err) {
      // silently fail
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      addToast('Enter a group name', 'error');
      return;
    }
    try {
      const res = await api.post('/buddy/create', { groupName });
      setGroups(prev => [...prev, res.data]);
      setShowCreate(false);
      setGroupName('');
      addToast('Group created!', 'success');
    } catch (err) {
      addToast('Failed to create group', 'error');
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      addToast('Enter an invite code', 'error');
      return;
    }
    try {
      const res = await api.post(`/buddy/join/${joinCode}`);
      await loadGroups();
      setShowJoin(false);
      setJoinCode('');
      addToast('Joined group!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join group', 'error');
    }
  };

  const viewLeaderboard = async (group) => {
    setSelectedGroup(group);
    try {
      const res = await api.get(`/buddy/leaderboard/${group._id}`);
      setLeaderboard(res.data);
    } catch (err) {
      addToast('Failed to load leaderboard', 'error');
    }
  };

  const shareDeck = async (deckId) => {
    if (!selectedGroup) return;
    try {
      await api.post('/buddy/share-deck', { groupId: selectedGroup._id, deckId });
      addToast('Deck shared with group!', 'success');
      setShowShare(false);
      await loadGroups();
    } catch (err) {
      addToast('Failed to share deck', 'error');
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    addToast('Invite code copied!', 'success');
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <ToastContainer />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">👥 <span className="text-gradient">Study Buddy</span></h1>
          <p className="page-subtitle">Learn together with friends!</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Create Group
          </button>
          <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>
            🔗 Join Group
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
          {groups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No study groups yet</div>
              <div className="empty-desc">Create a group and invite friends to learn together!</div>
            </div>
          ) : (
            <div className="buddy-groups">
              {groups.map(group => (
                <div key={group._id} className="glass-card buddy-group-card">
                  <h3 style={{ marginBottom: 'var(--space-md)' }}>{group.groupName}</h3>

                  <div className="invite-code-box">
                    <span>{group.inviteCode}</span>
                    <button className="copy-btn" onClick={() => copyInviteCode(group.inviteCode)}>
                      📋
                    </button>
                  </div>

                  <div style={{ margin: 'var(--space-lg) 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>👥 {group.members?.length || 0} members</span>
                    <span style={{ margin: '0 0.5rem' }}>•</span>
                    <span>📚 {group.sharedDecks?.length || 0} shared decks</span>
                  </div>

                  {/* Members */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    {group.members?.map((member, idx) => (
                      <span key={idx} style={{
                        padding: '0.25rem 0.75rem',
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-xl)',
                        fontSize: '0.8rem'
                      }}>
                        {member.username || 'Member'}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => viewLeaderboard(group)}
                      style={{ flex: 1 }}
                    >
                      🏆 Leaderboard
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setSelectedGroup(group); setShowShare(true); }}
                    >
                      📚 Share Deck
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <div>
          {selectedGroup && (
            <div className="glass-card">
              <h3 style={{ marginBottom: 'var(--space-lg)' }}>
                🏆 {selectedGroup.groupName}
              </h3>
              <div className="leaderboard-list">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.userId} className="leaderboard-item">
                    <div className={`leaderboard-rank ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{entry.username}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        🔥 {entry.currentStreak} streak • {entry.totalMinutes} min
                      </div>
                    </div>
                    {idx === 0 && <span>👑</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="glass-card">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>Create Study Group</h2>
              <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                <label className="form-label">Group Name</label>
                <input
                  className="form-input"
                  placeholder="e.g., JLPT N5 Study Group"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button className="btn btn-primary" onClick={createGroup} style={{ flex: 1 }}>
                  Create Group
                </button>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="glass-card">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>Join Study Group</h2>
              <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                <label className="form-label">Invite Code</label>
                <input
                  className="form-input"
                  placeholder="Enter invite code"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.1em', fontSize: '1.2rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button className="btn btn-primary" onClick={joinGroup} style={{ flex: 1 }}>
                  Join Group
                </button>
                <button className="btn btn-secondary" onClick={() => setShowJoin(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Deck Modal */}
      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="glass-card">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>Share Deck with {selectedGroup?.groupName}</h2>
              {decks.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No decks to share</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {decks.map(deck => (
                    <button
                      key={deck._id}
                      className="btn btn-secondary"
                      onClick={() => shareDeck(deck._id)}
                      style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    >
                      {deck.language === 'ja' ? '🇯🇵' : '🇬🇧'} {deck.title} ({deck.cardCount} cards)
                    </button>
                  ))}
                </div>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => setShowShare(false)}
                style={{ width: '100%', marginTop: 'var(--space-lg)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyBuddyPage;
