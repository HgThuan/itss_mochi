import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const ExtractPage = () => {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('ja');
  const [words, setWords] = useState([]);
  const [extracted, setExtracted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [showSave, setShowSave] = useState(false);
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();

  const extractWords = async () => {
    if (!text.trim()) {
      addToast('Please enter some text', 'error');
      return;
    }
    try {
      const res = await api.post('/extract', { text, language });
      setWords(res.data.words);
      setExtracted(true);
      addToast(`Found ${res.data.count} words!`, 'success');
    } catch (err) {
      addToast('Extraction failed', 'error');
    }
  };

  const removeWord = (index) => {
    setWords(prev => prev.filter((_, i) => i !== index));
  };

  const updateWordBack = (index, value) => {
    setWords(prev => prev.map((w, i) => i === index ? { ...w, back: value } : w));
  };

  const saveToDeck = async () => {
    if (!deckTitle.trim()) {
      addToast('Please enter a deck title', 'error');
      return;
    }

    const emptyMeanings = words.filter(w => !w.back || w.back.trim().length === 0);
    if (emptyMeanings.length > 0) {
      if (!confirm(`Warning: ${emptyMeanings.length} words have no meaning added. You'll need to edit these cards later to add meanings. Proceed?`)) {
        setShowSave(false);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.post('/extract/to-deck', {
        text,
        language,
        title: deckTitle,
        description: `Extracted ${words.length} words from pasted text`,
        words: words // Pass the modified words with meanings
      });
      addToast(`Deck created with ${res.data.wordCount} words!`, 'success');
      navigate(`/decks/${res.data.deck._id}`);
    } catch (err) {
      addToast('Failed to save deck', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sampleTexts = {
    ja: `日本の文化は非常に豊かで多様です。伝統的な茶道や華道から、現代的なアニメやマンガまで、日本は世界中の人々を魅了し続けています。東京の渋谷は若者文化の中心地であり、京都は古都として多くの神社仏閣があります。日本語を学ぶことで、この素晴らしい文化をより深く理解することができます。`,
    en: `Language learning is a fascinating journey that opens doors to new cultures and perspectives. Through consistent practice and dedication, anyone can acquire proficiency in a foreign language. Modern technology has revolutionized the way we study, making vocabulary acquisition more efficient and enjoyable than ever before.`
  };

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">✨ <span className="text-gradient">Extract Vocabulary</span></h1>
        <p className="page-subtitle">Paste any text and auto-extract vocabulary words</p>
      </div>

      <div className="extract-container">
        {/* Language & Input */}
        <div className="glass-card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0 }}>Language:</label>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={language}
              onChange={e => { setLanguage(e.target.value); setExtracted(false); setWords([]); }}
            >
              <option value="ja">🇯🇵 Japanese</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setText(sampleTexts[language])}
            >
              📋 Try Sample
            </button>
          </div>

          <textarea
            className="extract-textarea"
            placeholder={language === 'ja'
              ? 'ここに日本語のテキストを貼り付けてください...'
              : 'Paste your English text here...'}
            value={text}
            onChange={e => { setText(e.target.value); setExtracted(false); }}
            rows={8}
          ></textarea>

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
            <button className="btn btn-primary btn-lg" onClick={extractWords} style={{ flex: 1 }}>
              ✨ Extract Vocabulary
            </button>
            {text && (
              <button className="btn btn-secondary" onClick={() => { setText(''); setWords([]); setExtracted(false); }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Extracted Words */}
        {extracted && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h3>📝 Extracted Words ({words.length})</h3>
              {words.length > 0 && (
                <button className="btn btn-success" onClick={() => setShowSave(true)}>
                  💾 Save as Deck
                </button>
              )}
            </div>

            {words.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <div className="empty-title">No words found</div>
                <div className="empty-desc">Try pasting more text or a different content.</div>
              </div>
            ) : (
              <div>
                {words.map((word, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: '0.75rem',
                      background: 'var(--bg-glass)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '0.5rem',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-japanese)',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      minWidth: '120px'
                    }}>
                      {word.front}
                    </span>
                    {word.reading && (
                      <span style={{ color: 'var(--accent-purple-light)', fontSize: '0.85rem', minWidth: '80px' }}>
                        {word.reading}
                      </span>
                    )}
                    <input
                      className="form-input"
                      placeholder="Enter meaning..."
                      value={word.back}
                      onChange={e => updateWordBack(idx, e.target.value)}
                      style={{ flex: 1, padding: '0.5rem 0.75rem' }}
                    />
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      padding: '0.2rem 0.5rem',
                      background: 'var(--bg-glass)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {word.type}
                    </span>
                    <button
                      onClick={() => removeWord(idx)}
                      style={{ color: 'var(--accent-red)', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save Modal */}
        {showSave && (
          <div className="modal-overlay" onClick={() => setShowSave(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="glass-card">
                <h2 style={{ marginBottom: 'var(--space-xl)' }}>Save as Flashcard Deck</h2>
                <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                  <label className="form-label">Deck Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g., Japanese Culture Vocab"
                    value={deckTitle}
                    onChange={e => setDeckTitle(e.target.value)}
                  />
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.85rem' }}>
                  This will create a new deck with {words.length} cards
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <button
                    className="btn btn-primary"
                    onClick={saveToDeck}
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    {saving ? 'Saving...' : '💾 Save Deck'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowSave(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractPage;
