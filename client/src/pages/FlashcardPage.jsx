import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../hooks/useTranslation';
import { useSpeech } from '../hooks/useSpeech';

const FlashcardPage = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();
  const { t, currentLang } = useTranslation();
  const { speak, currentlySpeaking, isSupported: speechSupported } = useSpeech();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ front: '', back: '', reading: '', example: '' });
  const [studyStartTime, setStudyStartTime] = useState(null);
  const [mode, setMode] = useState('browse'); // browse | study
  const [filter, setFilter] = useState('all'); // all | not-mastered | mastered
  const [cardToDelete, setCardToDelete] = useState(null); // cardId to delete

  const filteredCards = cards.filter(c => {
    if (filter === 'mastered') return c.mastered;
    if (filter === 'not-mastered') return !c.mastered;
    return true;
  });

  const currentCard = filteredCards[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filter]);

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
    if (currentIndex < filteredCards.length - 1) {
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
    if (e.key === 'ArrowRight' || e.key === 'd') {
      if (currentIndex < filteredCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      }
    }
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setIsFlipped(false);
      }
    }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setIsFlipped(prev => !prev); }
    if (e.key === 'm' && currentCard) { toggleMastered(currentCard._id); }
  }, [currentIndex, filteredCards.length, showAddCard, currentCard]);

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
      const updatedCards = cards.filter(c => c._id !== cardId);
      const updatedFilteredCards = updatedCards.filter(c => {
        if (filter === 'mastered') return c.mastered;
        if (filter === 'not-mastered') return !c.mastered;
        return true;
      });

      setCards(updatedCards);

      if (currentIndex >= updatedFilteredCards.length && currentIndex > 0) {
        setCurrentIndex(Math.max(0, updatedFilteredCards.length - 1));
      }
      addToast('Card deleted', 'success');
    } catch (err) {
      addToast('Failed to delete card', 'error');
    }
  };

  const toggleMastered = async (cardId) => {
    try {
      const res = await api.put(`/cards/${cardId}/toggle-mastered`);
      setCards(prev => prev.map(c => c._id === cardId ? { ...c, mastered: res.data.mastered } : c));
      addToast(res.data.mastered 
        ? (currentLang === 'vi' ? '✅ Đã đánh dấu thuộc!' : currentLang === 'en' ? '✅ Marked as Mastered!' : '✅ 習得済みに設定しました！') 
        : (currentLang === 'vi' ? '↩️ Đã bỏ đánh dấu thuộc' : currentLang === 'en' ? '↩️ Unmarked Mastered' : '↩️ 習得済みを解除しました'), 
        'success'
      );
    } catch (err) {
      addToast(currentLang === 'vi' ? 'Lỗi khi cập nhật trạng thái' : currentLang === 'en' ? 'Failed to update status' : '状態の更新に失敗しました', 'error');
    }
  };

  const finishStudy = async () => {
    setMode('browse');
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!deck) {
    return <div className="empty-state"><div className="empty-title">Deck not found</div></div>;
  }

  return (
    <div>
      <ToastContainer />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button className="btn btn-ghost" onClick={() => navigate('/decks')} style={{ marginBottom: 'var(--space-sm)' }}>
            {t('flashcards.backToDecks')}
          </button>
          <h1 className="page-title">
            {deck.language === 'ja' ? '🇯🇵' : '🇬🇧'} {deck.title}
          </h1>
          <p className="page-subtitle">
            {t('flashcards.cardsCount', { count: cards.length })} • {t('flashcards.masteredCount', { count: cards.filter(c => c.mastered).length })} • {deck.description}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-secondary" onClick={() => { setCardForm({ front: '', back: '', reading: '', example: '' }); setShowAddCard(true); }}>
            {t('flashcards.addCard')}
          </button>
          {cards.length >= 4 && (
            <button className="btn btn-primary" onClick={() => navigate(`/test/${deckId}`)}>
              {t('flashcards.takeTest')}
            </button>
          )}
        </div>
      </div>

      {/* Mode & Filter Toolbar */}
      {cards.length > 0 && (
        <div className="filter-toolbar">
          <div className="mode-toggle-group">
            <button
              className={`btn ${mode === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('browse')}
            >
              📋 {t('flashcards.browseMode')}
            </button>
            <button
              className={`btn ${mode === 'study' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('study')}
            >
              🎯 {t('flashcards.studyMode')}
            </button>
            {mode === 'study' && (
              <button className="btn btn-success" onClick={finishStudy}>
                {t('flashcards.finishStudy')}
              </button>
            )}
          </div>

          <div className="filter-group">
            <button
              className={`filter-option-btn ${filter === 'all' ? 'active-all' : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('flashcards.all', { count: cards.length })}
            </button>
            <button
              className={`filter-option-btn ${filter === 'not-mastered' ? 'active-unmastered' : ''}`}
              onClick={() => setFilter('not-mastered')}
            >
              {t('flashcards.unmastered', { count: cards.filter(c => !c.mastered).length })}
            </button>
            <button
              className={`filter-option-btn ${filter === 'mastered' ? 'active-mastered' : ''}`}
              onClick={() => setFilter('mastered')}
            >
              {t('flashcards.mastered', { count: cards.filter(c => c.mastered).length })}
            </button>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📇</div>
          <div className="empty-title">{t('flashcards.noCards')}</div>
          <div className="empty-desc">{t('flashcards.noCardsDesc')}</div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowAddCard(true)}>
              {t('flashcards.addCard')}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/extract')}>
              {t('flashcards.extractBtn')}
            </button>
          </div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title" style={{ color: 'var(--text-primary)' }}>{t('flashcards.noFilteredCards')}</div>
          <div className="empty-desc" style={{ color: 'var(--text-secondary)' }}>
            {t('flashcards.noFilteredDesc', { 
              filter: filter === 'mastered' 
                ? (currentLang === 'vi' ? 'Đã thuộc' : currentLang === 'en' ? 'Mastered' : '習得済み')
                : (currentLang === 'vi' ? 'Chưa thuộc' : currentLang === 'en' ? 'Unlearned' : '未習得')
            })}
          </div>
          <button className="btn btn-secondary" onClick={() => setFilter('all')}>
            {t('flashcards.viewAll')}
          </button>
        </div>
      ) : mode === 'study' ? (
        /* Study Mode - Flashcard View */
        <div>
          <div className="flashcard-progress">
            <div
              className="flashcard-progress-bar"
              style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
            ></div>
          </div>

          <div className="flashcard-container" style={{ marginTop: 'var(--space-xl)' }}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
              <div className="flashcard-face flashcard-front">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)', flexDirection: 'column' }}>
                  <div className="flashcard-word">{currentCard?.front}</div>
                  {currentCard?.reading && (
                    <div className="flashcard-reading">{currentCard.reading}</div>
                  )}
                  {speechSupported && (
                    <button
                      className={`speak-btn speak-btn-lg${currentlySpeaking === currentCard?.front ? ' speaking' : ''}`}
                      onClick={(e) => { e.stopPropagation(); speak(currentCard?.front, deck?.language); }}
                      title={currentLang === 'vi' ? 'Nghe phát âm' : currentLang === 'en' ? 'Listen to pronunciation' : '発音を聞く'}
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
              <div className="flashcard-face flashcard-back">
                {currentCard?.back ? (
                  <div className="flashcard-meaning">{currentCard.back}</div>
                ) : (
                  <div className="flashcard-meaning" style={{ opacity: 0.6, fontSize: '1.2rem', fontStyle: 'italic' }}>
                    {t('flashcards.noMeaning')}
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ display: 'block', margin: '1rem auto', color: 'white', textDecoration: 'underline' }}
                      onClick={(e) => { e.stopPropagation(); setShowAddCard(true); setCardForm(currentCard); }}
                    >
                      {t('flashcards.addMeaning')}
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
            {currentIndex + 1} / {filteredCards.length}
          </div>

          {/* Mastered Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--space-md) 0' }}>
            <button
              className={`btn mastered-toggle-btn ${currentCard?.mastered ? 'mastered-active' : ''}`}
              onClick={() => toggleMastered(currentCard._id)}
            >
              {currentCard?.mastered 
                ? `✅ ${currentLang === 'vi' ? 'Đã thuộc' : currentLang === 'en' ? 'Mastered' : '習得済み'}` 
                : `☐ ${currentLang === 'vi' ? 'Đánh dấu đã thuộc' : currentLang === 'en' ? 'Mark as Mastered' : '習得済みに設定'}`}
            </button>
          </div>

          <div className="flashcard-controls">
            <button
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              {t('flashcards.previous')}
            </button>
            <button className="btn btn-primary" onClick={handleFlip}>
              {isFlipped ? t('flashcards.showFront') : t('flashcards.flip')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleNext}
              disabled={currentIndex === filteredCards.length - 1}
            >
              {t('flashcards.next')}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={(e) => { e.stopPropagation(); setCardForm(currentCard); setShowAddCard(true); }}
            >
              {t('flashcards.editCard')}
            </button>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ color: 'var(--accent-red)' }}
              onClick={(e) => { e.stopPropagation(); setCardToDelete(currentCard._id); }}
            >
              {t('flashcards.deleteCard')}
            </button>
          </div>

          <div className="flashcard-hint">
            {t('flashcards.keyboardHint')}
          </div>
        </div>
      ) : (
        /* Browse Mode - Card List */
        <div className="deck-grid">
          {filteredCards.map((card, idx) => {
            const originalIndex = cards.findIndex(c => c._id === card._id);
            return (
              <div key={card._id} className={`glass-card ${card.mastered ? 'card-mastered' : ''}`} style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => { setCurrentIndex(idx); setMode('study'); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{originalIndex + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {card.mastered && (
                      <span className="mastered-badge">✅ {currentLang === 'vi' ? 'Đã thuộc' : currentLang === 'en' ? 'Mastered' : '習得済み'}</span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); toggleMastered(card._id); }}
                      title={card.mastered 
                        ? (currentLang === 'vi' ? 'Bỏ đánh dấu thuộc' : currentLang === 'en' ? 'Unmark Mastered' : '習得済みを解除')
                        : (currentLang === 'vi' ? 'Đánh dấu đã thuộc' : currentLang === 'en' ? 'Mark as Mastered' : '習得済みに設定')}
                      style={{ padding: '0.25rem', fontSize: '1rem' }}
                    >
                      {card.mastered ? '↩️' : '☐'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); setCardToDelete(card._id); }}
                      style={{ color: 'var(--accent-red)', padding: '0.25rem' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                  <div style={{ fontFamily: 'var(--font-japanese)', fontSize: '1.5rem', fontWeight: 700, flex: 1 }}>
                    {card.front}
                  </div>
                  {speechSupported && (
                    <button
                      className={`speak-btn${currentlySpeaking === card.front ? ' speaking' : ''}`}
                      onClick={(e) => { e.stopPropagation(); speak(card.front, deck?.language); }}
                      title={currentLang === 'vi' ? 'Nghe phát âm' : currentLang === 'en' ? 'Listen' : '発音'}
                    >
                      🔊
                    </button>
                  )}
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
            );
          })}
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="modal-overlay" onClick={() => setShowAddCard(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="glass-card">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>{cardForm._id ? t('flashcards.editModalTitle') : t('flashcards.addModalTitle')}</h2>
              <form onSubmit={saveCard} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">{t('flashcards.frontLabel')}</label>
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
                  <label className="form-label">{t('flashcards.backLabel')}</label>
                  <input
                    className="form-input"
                    placeholder="e.g., to eat / ăn"
                    value={cardForm.back}
                    onChange={e => setCardForm(p => ({ ...p, back: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('flashcards.readingLabel')}</label>
                  <input
                    className="form-input"
                    placeholder={deck.language === 'ja' ? 'e.g., たべる' : ''}
                    value={cardForm.reading}
                    onChange={e => setCardForm(p => ({ ...p, reading: e.target.value }))}
                    style={{ fontFamily: 'var(--font-japanese)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('flashcards.exampleLabel')}</label>
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
                    {cardForm._id ? t('flashcards.updateBtn') : t('flashcards.addBtn')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowAddCard(false); setCardForm({ front: '', back: '', reading: '', example: '' }); }}>
                    {t('decks.cancelBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {cardToDelete && (
        <div className="modal-overlay" onClick={() => setCardToDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
              <h2 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
                {currentLang === 'vi' ? 'Xác nhận xóa thẻ' : currentLang === 'en' ? 'Delete Flashcard' : 'カードを削除'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {currentLang === 'vi' 
                  ? 'Bạn có chắc chắn muốn xóa thẻ từ vựng này không? Hành động này không thể hoàn tác.' 
                  : currentLang === 'en' 
                    ? 'Are you sure you want to permanently delete this card? This action cannot be undone.' 
                    : 'このカードを完全に削除しますか？この操作は取り消せません。'}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button 
                  className="btn btn-danger" 
                  onClick={() => { 
                    deleteCard(cardToDelete); 
                    setCardToDelete(null); 
                  }} 
                  style={{ flex: 1 }}
                >
                  {currentLang === 'vi' ? 'Xóa thẻ' : currentLang === 'en' ? 'Delete' : '削除する'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setCardToDelete(null)} 
                  style={{ flex: 1 }}
                >
                  {t('decks.cancelBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardPage;
