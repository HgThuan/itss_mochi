import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const DecksPage = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', language: 'ja' });
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const res = await api.get('/decks');
      setDecks(res.data);
    } catch (err) {
      addToast('Failed to load decks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/decks', form);
      setDecks(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', language: 'ja' });
      addToast('Deck created!', 'success');
    } catch (err) {
      addToast('Failed to create deck', 'error');
    }
  };

  const deleteDeck = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this deck and all its cards?')) return;
    try {
      await api.delete(`/decks/${id}`);
      setDecks(prev => prev.filter(d => d._id !== id));
      addToast('Deck deleted', 'success');
    } catch (err) {
      addToast('Failed to delete deck', 'error');
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <ToastContainer />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📚 <span className="text-gradient">Flashcard Decks</span></h1>
          <p className="page-subtitle">Create and manage your vocabulary decks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Deck
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="glass-card">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>Create New Deck</h2>
              <form onSubmit={createDeck} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g., JLPT N5 Vocabulary"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    className="form-input"
                    placeholder="Optional description"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select
                    className="form-select"
                    value={form.language}
                    onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
                  >
                    <option value="ja">🇯🇵 Japanese</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Create Deck
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {decks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📇</div>
          <div className="empty-title">No decks yet</div>
          <div className="empty-desc">Create your first flashcard deck to start learning!</div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Create First Deck
          </button>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map(deck => (
            <div
              key={deck._id}
              className="glass-card deck-card"
              onClick={() => navigate(`/decks/${deck._id}`)}
            >
              <span className="deck-lang">
                {deck.language === 'ja' ? '🇯🇵 Japanese' : '🇬🇧 English'}
              </span>
              <h3 className="deck-title">{deck.title}</h3>
              <p className="deck-desc">{deck.description || 'No description'}</p>
              <div className="deck-meta">
                <span>{deck.cardCount || 0} cards</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => deleteDeck(deck._id, e)}
                  style={{ color: 'var(--accent-red)' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecksPage;
