import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../hooks/useTranslation';

const DecksPage = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', language: 'ja' });
  const [langFilter, setLangFilter] = useState('all'); // all | ja | en
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();
  const { t, currentLang } = useTranslation();

  const filteredDecks = decks.filter(deck => {
    if (langFilter === 'ja') return deck.language === 'ja';
    if (langFilter === 'en') return deck.language === 'en';
    return true;
  });

  const loadDecks = useCallback(async () => {
    try {
      const res = await api.get('/decks');
      setDecks(res.data);
    } catch {
      addToast(currentLang === 'vi' ? 'Lỗi khi tải bộ thẻ' : currentLang === 'en' ? 'Failed to load decks' : 'デッキの読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentLang, addToast]);

  useEffect(() => {
    Promise.resolve().then(() => loadDecks());
  }, [loadDecks]);

  const createDeck = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/decks', form);
      setDecks(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', language: 'ja' });
      addToast(currentLang === 'vi' ? 'Đã tạo bộ thẻ thành công!' : currentLang === 'en' ? 'Deck created!' : 'デッキを作成しました！', 'success');
    } catch {
      addToast(currentLang === 'vi' ? 'Lỗi khi tạo bộ thẻ' : currentLang === 'en' ? 'Failed to create deck' : 'デッキの作成に失敗しました', 'error');
    }
  };

  const deleteDeck = async (id, e) => {
    e.stopPropagation();
    if (!confirm(t('decks.deleteConfirm'))) return;
    try {
      await api.delete(`/decks/${id}`);
      setDecks(prev => prev.filter(d => d._id !== id));
      addToast(currentLang === 'vi' ? 'Đã xóa bộ thẻ' : currentLang === 'en' ? 'Deck deleted' : 'デッキを削除しました', 'success');
    } catch {
      addToast(currentLang === 'vi' ? 'Lỗi khi xóa bộ thẻ' : currentLang === 'en' ? 'Failed to delete deck' : 'デッキの削除に失敗しました', 'error');
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
          <h1 className="page-title">📚 <span className="text-gradient">{t('decks.title')}</span></h1>
          <p className="page-subtitle">{t('decks.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          {t('decks.addDeck')}
        </button>
      </div>

      {/* Deck Language Filters */}
      {decks.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-xl)' }}>
          <div className="filter-group">
            <button
              className={`filter-option-btn ${langFilter === 'all' ? 'active-all' : ''}`}
              onClick={() => setLangFilter('all')}
            >
              📚 {currentLang === 'vi' ? 'Tất cả' : currentLang === 'en' ? 'All' : 'すべて'} ({decks.length})
            </button>
            <button
              className={`filter-option-btn ${langFilter === 'ja' ? 'active-mastered' : ''}`}
              onClick={() => setLangFilter('ja')}
            >
              🇯🇵 {currentLang === 'vi' ? 'Tiếng Nhật' : currentLang === 'en' ? 'Japanese' : '日本語'} ({decks.filter(d => d.language === 'ja').length})
            </button>
            <button
              className={`filter-option-btn ${langFilter === 'en' ? 'active-unmastered' : ''}`}
              onClick={() => setLangFilter('en')}
            >
              🇬🇧 {currentLang === 'vi' ? 'Tiếng Anh' : currentLang === 'en' ? 'English' : '英語'} ({decks.filter(d => d.language === 'en').length})
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="glass-card">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>{t('decks.modalTitle')}</h2>
              <form onSubmit={createDeck} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">{t('decks.deckTitle')}</label>
                  <input
                    className="form-input"
                    placeholder={t('decks.placeholderTitle')}
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('decks.deckDesc')}</label>
                  <input
                    className="form-input"
                    placeholder={t('decks.placeholderDesc')}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('decks.deckLang')}</label>
                  <select
                    className="form-select"
                    value={form.language}
                    onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
                  >
                    <option value="ja">{t('decks.langJa')}</option>
                    <option value="en">{t('decks.langEn')}</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {t('decks.createBtn')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                    {t('decks.cancelBtn')}
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
          <div className="empty-title">{currentLang === 'vi' ? 'Chưa có bộ thẻ nào' : currentLang === 'en' ? 'No decks yet' : 'デッキがありません'}</div>
          <div className="empty-desc">{currentLang === 'vi' ? 'Hãy tạo bộ thẻ từ vựng đầu tiên của bạn để bắt đầu học ngay!' : currentLang === 'en' ? 'Create your first flashcard deck to start learning!' : '最初のデッキを作成して学習を開始しましょう！'}</div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            {t('decks.addDeck')}
          </button>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title" style={{ color: 'var(--text-primary)' }}>{currentLang === 'vi' ? 'Không có bộ thẻ nào' : currentLang === 'en' ? 'No decks found' : 'デッキが見つかりません'}</div>
          <div className="empty-desc" style={{ color: 'var(--text-secondary)' }}>
            {currentLang === 'vi' ? `Không tìm thấy bộ thẻ nào thuộc ngôn ngữ "${langFilter === 'ja' ? 'Tiếng Nhật' : 'Tiếng Anh'}".` : currentLang === 'en' ? `No decks found for target language "${langFilter === 'ja' ? 'Japanese' : 'English'}".` : `対象言語「${langFilter === 'ja' ? '日本語' : '英語'}」のデッキは見つかりませんでした。`}
          </div>
          <button className="btn btn-secondary" onClick={() => setLangFilter('all')}>
            {t('flashcards.viewAll')}
          </button>
        </div>
      ) : (
        <div className="deck-grid">
          {filteredDecks.map(deck => (
            <div
              key={deck._id}
              className="glass-card deck-card"
              onClick={() => navigate(`/decks/${deck._id}`)}
            >
              <span className="deck-lang">
                {deck.language === 'ja' ? t('decks.langJa') : t('decks.langEn')}
              </span>
              <h3 className="deck-title">{deck.title}</h3>
              <p className="deck-desc">{deck.description || (currentLang === 'vi' ? 'Chưa có mô tả' : currentLang === 'en' ? 'No description' : '説明なし')}</p>
              <div className="deck-meta">
                <span>{t('decks.totalCards', { count: deck.cardCount || 0 })}</span>
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
