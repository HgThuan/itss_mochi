import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const FlashcardPage = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ front: '', back: '', reading: '', example: '' });
  const [studyStartTime, setStudyStartTime] = useState(null);
  const [mode, setMode] = useState('browse'); // browse | study

  useEffect(() => {
    loadDeck();
  }, [deckId]);

  useEffect(() => {
    if (mode === 'study') {
      setStudyStartTime(Date.now());
    }
  }, [mode]);

  const loadDeck = async () => {
    try {
      const res = await api.get(`/decks/${deckId}`);
      setDeck(res.data.deck);
      setCards(res.data.cards);
    } catch (err) {
      addToast('Failed to load deck', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (showAddCard) return;
    if (e.key === 'ArrowRight' || e.key === 'd') handleNext();
    if (e.key === 'ArrowLeft' || e.key === 'a') handlePrev();
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleFlip(); }
  }, [currentIndex, cards.length, isFlipped, showAddCard]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const saveCard = async (e) => {
    e.preventDefault();
    try {
      if (cardForm._id) {
        // Update existing
        const res = await api.put(`/cards/${cardForm._id}`, cardForm);
        setCards(prev => prev.map(c => c._id === res.data._id ? res.data : c));
        addToast('Card updated!', 'success');
      } else {
        // Create new
        const res = await api.post('/cards', { deckId, ...cardForm });
        setCards(prev => [...prev, res.data]);
        addToast('Card added!', 'success');
      }
      setCardForm({ front: '', back: '', reading: '', example: '' });
      setShowAddCard(false);
    } catch (err) {
      addToast('Failed to save card', 'error');
    }
  };

  const deleteCard = async (cardId) => {
    try {
      await api.delete(`/cards/${cardId}`);
      setCards(prev => prev.filter(c => c._id !== cardId));
      if (currentIndex >= cards.length - 1 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      addToast('Card deleted', 'success');
    } catch (err) {
      addToast('Failed to delete card', 'error');
    }
  };

  const finishStudy = async () => {
    if (studyStartTime) {
      const minutesStudied = Math.max(1, Math.round((Date.now() - studyStartTime) / 60000));
      try {
        await api.post('/streak/log', { minutes: minutesStudied });
        await api.post('/pet/add-exp', { action: 'flashcard_session' });
        addToast(`Study session logged: ${minutesStudied} min! +10 pet EXP`, 'success');
      } catch (err) {
        // Silently fail
      }
    }
    setMode('browse');
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!deck) {
    return <div className="empty-state"><div className="empty-title">Deck not found</div></div>;
  }

  const currentCard = cards[currentIndex];

  return (
    <div>
      <ToastContainer />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button className="btn btn-ghost" onClick={() => navigate('/decks')} style={{ marginBottom: 'var(--space-sm)' }}>
            ← Back to Decks
          </button>
          <h1 className="page-title">
            {deck.language === 'ja' ? '🇯🇵' : '🇬🇧'} {deck.title}
          </h1>
          <p className="page-subtitle">{cards.length} cards • {deck.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-secondary" onClick={() => { setCardForm({ front: '', back: '', reading: '', example: '' }); setShowAddCard(true); }}>
            + Add Card
          </button>
          {cards.length >= 4 && (
            <button className="btn btn-primary" onClick={() => navigate(`/test/${deckId}`)}>
              📝 Take Test
            </button>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', justifyContent: 'center' }}>
          <button
            className={`btn ${mode === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('browse')}
          >
            📋 Browse Cards
          </button>
          <button
            className={`btn ${mode === 'study' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('study')}
          >
            🎯 Study Mode
          </button>
          {mode === 'study' && (
            <button className="btn btn-success" onClick={finishStudy}>
              ✓ Finish Study
            </button>
          )}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📇</div>
          <div className="empty-title">No cards yet</div>
          <div className="empty-desc">Add cards manually or use the Extract feature to auto-generate cards!</div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowAddCard(true)}>
              + Add Card
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/extract')}>
              ✨ Extract from Text
            </button>
          </div>
        </div>
      ) : mode === 'study' ? (
        /* Study Mode - Flashcard View */
        <div>
          <div className="flashcard-progress">
            <div
              className="flashcard-progress-bar"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            ></div>
          </div>

          <div className="flashcard-container" style={{ marginTop: 'var(--space-xl)' }}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
              <div className="flashcard-face flashcard-front">
                <div className="flashcard-word">{currentCard?.front}</div>
                {currentCard?.reading && (
                  <div className="flashcard-reading">{currentCard.reading}</div>
                )}
              </div>
              <div className="flashcard-face flashcard-back">
                {currentCard?.back ? (
                  <div className="flashcard-meaning">{currentCard.back}</div>
                ) : (
                  <div className="flashcard-meaning" style={{ opacity: 0.6, fontSize: '1.2rem', fontStyle: 'italic' }}>
                    (No meaning added yet)
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ display: 'block', margin: '1rem auto', color: 'white', textDecoration: 'underline' }}
                      onClick={(e) => { e.stopPropagation(); setShowAddCard(true); setCardForm(currentCard); }}
                    >
                      Add Meaning
                    </button>
                  </div>
                )}
                {currentCard?.example && (
                  <div className="flashcard-example">{currentCard.example}</div>
                )}
              </div>
            </div>
          </div>

          <div className="flashcard-counter">
            {currentIndex + 1} / {cards.length}
          </div>

          <div className="flashcard-controls">
            <button
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            <button className="btn btn-primary" onClick={handleFlip}>
              {isFlipped ? '🔄 Show Front' : '👁️ Flip Card'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
            >
              Next →
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={(e) => { e.stopPropagation(); setCardForm(currentCard); setShowAddCard(true); }}
            >
              ✏️ Edit Card
            </button>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ color: 'var(--accent-red)' }}
              onClick={(e) => { e.stopPropagation(); if(confirm('Delete this card?')) deleteCard(currentCard._id); }}
            >
              ✕ Delete Card
            </button>
          </div>

          <div className="flashcard-hint">
            Press Space/Enter to flip • Arrow keys to navigate
          </div>
        </div>
      ) : (
        /* Browse Mode - Card List */
        <div className="deck-grid">
          {cards.map((card, idx) => (
            <div key={card._id} className="glass-card" style={{ cursor: 'pointer' }}
              onClick={() => { setCurrentIndex(idx); setMode('study'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{idx + 1}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); deleteCard(card._id); }}
                  style={{ color: 'var(--accent-red)', padding: '0.25rem' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-japanese)', fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
                {card.front}
              </div>
              {card.reading && (
                <div style={{ color: 'var(--accent-purple-light)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  {card.reading}
                </div>
              )}
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {card.back || (
                  <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No meaning added</span>
                )}
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem' }}
                onClick={(e) => { e.stopPropagation(); setCardForm(card); setShowAddCard(true); }}
              >
                ✏️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="modal-overlay" onClick={() => setShowAddCard(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="glass-card">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>{cardForm._id ? 'Edit Card' : 'Add New Card'}</h2>
              <form onSubmit={saveCard} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Front (Word/Phrase)</label>
                  <input
                    className="form-input"
                    placeholder={deck.language === 'ja' ? 'e.g., 食べる' : 'e.g., acquire'}
                    value={cardForm.front}
                    onChange={e => setCardForm(p => ({ ...p, front: e.target.value }))}
                    required
                    style={{ fontFamily: 'var(--font-japanese)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Back (Meaning)</label>
                  <input
                    className="form-input"
                    placeholder="e.g., to eat / ăn"
                    value={cardForm.back}
                    onChange={e => setCardForm(p => ({ ...p, back: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reading (optional)</label>
                  <input
                    className="form-input"
                    placeholder={deck.language === 'ja' ? 'e.g., たべる' : ''}
                    value={cardForm.reading}
                    onChange={e => setCardForm(p => ({ ...p, reading: e.target.value }))}
                    style={{ fontFamily: 'var(--font-japanese)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Example Sentence (optional)</label>
                  <input
                    className="form-input"
                    placeholder={deck.language === 'ja' ? 'e.g., 寿司を食べる' : ''}
                    value={cardForm.example}
                    onChange={e => setCardForm(p => ({ ...p, example: e.target.value }))}
                    style={{ fontFamily: 'var(--font-japanese)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {cardForm._id ? 'Update Card' : 'Add Card'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowAddCard(false); setCardForm({ front: '', back: '', reading: '', example: '' }); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardPage;
