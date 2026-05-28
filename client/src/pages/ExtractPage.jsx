import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { fetchEnglishDefinition, fetchJapaneseDefinition, translateToVietnamese } from '../services/dictionaryService';
import { useTranslation } from '../hooks/useTranslation';

const ExtractPage = () => {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('ja');
  const [words, setWords] = useState([]);
  const [extracted, setExtracted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defining, setDefining] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [showSave, setShowSave] = useState(false);
  const extractRequestId = useRef(0);
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();
  const { t, currentLang } = useTranslation();

  const extractWords = async () => {
    if (!text.trim()) {
      addToast(currentLang === 'vi' ? 'Vui lòng nhập văn bản' : currentLang === 'en' ? 'Please enter some text' : 'テキストを入力してください', 'error');
      return;
    }
    
    // Clear previous results immediately to prevent flickering
    setWords([]);
    setExtracted(false);
    
    // Increment request ID to ignore previous async tasks
    const currentId = ++extractRequestId.current;
    
    try {
      const res = await api.post('/extract', { text, language });
      
      // If a newer request has started, ignore this one
      if (currentId !== extractRequestId.current) return;
      const extractedWords = res.data.words;
      setWords(extractedWords);
      setExtracted(true);
      addToast(currentLang === 'vi' ? `Tìm thấy ${res.data.count} từ! Đang tra nghĩa từ vựng...` : currentLang === 'en' ? `Found ${res.data.count} words! Fetching meanings in parallel...` : `${res.data.count} 語検出しました！意味を検索中...`, 'info');
      
      // Automatically fetch definitions in parallel
      await fetchDefinitionsParallel(extractedWords, language);
      
    } catch (err) {
      addToast(currentLang === 'vi' ? 'Trích xuất thất bại' : currentLang === 'en' ? 'Extraction failed' : '抽出に失敗しました', 'error');
    }
  };

  const fetchDefinitionsParallel = async (wordsToDefine, lang) => {
    const currentId = extractRequestId.current;
    setDefining(true);
    
    // Process in chunks of 5 to avoid rate limiting
    const chunkSize = 5;
    for (let i = 0; i < wordsToDefine.length; i += chunkSize) {
      if (currentId !== extractRequestId.current) break;
      
      const chunk = wordsToDefine.slice(i, i + chunkSize);
      
      await Promise.all(chunk.map(async (word) => {
        const index = wordsToDefine.indexOf(word);
        try {
          if (lang === 'ja') {
            const res = await api.get(`/dictionary/define?word=${encodeURIComponent(word.front)}&lang=ja`);
            const { definition: def, reading: rd } = res.data;
            
            if (currentId === extractRequestId.current) {
              setWords(prevWords => {
                const newWords = [...prevWords];
                if (newWords[index]) {
                  newWords[index] = { 
                    ...newWords[index], 
                    back: def || newWords[index].back,
                    reading: rd || newWords[index].reading 
                  };
                }
                return newWords;
              });
            }
          } else {
            const definition = await fetchEnglishDefinition(word.front);
            if (definition) {
              const viMeaning = await translateToVietnamese(definition, 'en');
              
              if (currentId === extractRequestId.current) {
                setWords(prevWords => {
                  const newWords = [...prevWords];
                  if (newWords[index]) {
                    newWords[index] = { ...newWords[index], back: viMeaning };
                  }
                  return newWords;
                });
              }
            }
          }
        } catch (error) {
          console.error(`Failed to define ${word.front}:`, error);
        }
      }));
    }
    
    setDefining(false);
    if (currentId === extractRequestId.current) {
      addToast(currentLang === 'vi' ? 'Đã hoàn tất tra cứu nghĩa từ vựng!' : currentLang === 'en' ? 'Finished fetching meanings!' : '意味の検索が完了しました！', 'success');
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
      addToast(currentLang === 'vi' ? 'Vui lòng nhập tên bộ thẻ' : currentLang === 'en' ? 'Please enter a deck title' : 'デッキ名を入力してください', 'error');
      return;
    }

    const emptyMeanings = words.filter(w => !w.back || w.back.trim().length === 0);
    if (emptyMeanings.length > 0) {
      if (!confirm(currentLang === 'vi' ? `Cảnh báo: ${emptyMeanings.length} từ chưa có nghĩa được thêm. Bạn có muốn tiếp tục?` : currentLang === 'en' ? `Warning: ${emptyMeanings.length} words have no meaning added. Proceed?` : `警告：${emptyMeanings.length} 語の意味が入力されていません。続行しますか？`)) {
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
      addToast(currentLang === 'vi' ? `Đã tạo bộ thẻ với ${res.data.wordCount} từ!` : currentLang === 'en' ? `Deck created with ${res.data.wordCount} words!` : `デッキを作成し、${res.data.wordCount} 語を保存しました！`, 'success');
      navigate(`/decks/${res.data.deck._id}`);
    } catch (err) {
      addToast(currentLang === 'vi' ? 'Lỗi khi lưu bộ thẻ' : currentLang === 'en' ? 'Failed to save deck' : 'デッキの保存に失敗しました', 'error');
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
        <h1 className="page-title">✨ <span className="text-gradient">{t('extract.title')}</span></h1>
        <p className="page-subtitle">{t('extract.desc')}</p>
      </div>

      <div className="extract-container">
        {/* Language & Input */}
        <div className="glass-card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0 }}>{t('extract.langLabel')}:</label>
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
              📋 {currentLang === 'vi' ? 'Dùng thử mẫu' : currentLang === 'en' ? 'Try Sample' : 'サンプルを試す'}
            </button>
          </div>

          <textarea
            className="extract-textarea"
            placeholder={t('extract.placeholderSource')}
            value={text}
            onChange={e => { setText(e.target.value); setExtracted(false); }}
            rows={8}
          ></textarea>

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
            <button className="btn btn-primary btn-lg" onClick={extractWords} style={{ flex: 1 }}>
              {t('extract.submitBtn')}
            </button>
            {text && (
              <button className="btn btn-secondary" onClick={() => { setText(''); setWords([]); setExtracted(false); }}>
                {currentLang === 'vi' ? 'Xóa sạch' : currentLang === 'en' ? 'Clear' : 'クリア'}
              </button>
            )}
          </div>
        </div>

        {/* Extracted Words */}
        {extracted && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h3>{t('extract.resultsTitle', { count: words.length })}</h3>
              {words.length > 0 && (
                <button className="btn btn-success" onClick={() => setShowSave(true)}>
                  {t('extract.saveBtn')}
                </button>
              )}
            </div>

            {words.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <div className="empty-title">{currentLang === 'vi' ? 'Không tìm thấy từ nào' : currentLang === 'en' ? 'No words found' : '語彙が検出されませんでした'}</div>
                <div className="empty-desc">{currentLang === 'vi' ? 'Hãy thử dán đoạn văn bản khác.' : currentLang === 'en' ? 'Try pasting more text or a different content.' : '別の文章を貼り付けてお試しください。'}</div>
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
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        className="form-input"
                        placeholder={defining ? (currentLang === 'vi' ? 'Đang tra cứu...' : currentLang === 'en' ? 'Searching...' : '検索中...') : (currentLang === 'vi' ? 'Nhập nghĩa của từ...' : currentLang === 'en' ? 'Enter meaning...' : '意味を入力...')}
                        value={word.back}
                        onChange={e => updateWordBack(idx, e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', paddingRight: '2rem' }}
                      />
                      {defining && !word.back && (
                        <div className="spinner-small" style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '12px',
                          height: '12px',
                          border: '2px solid var(--accent-blue)',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                      )}
                    </div>
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
                <h2 style={{ marginBottom: 'var(--space-xl)' }}>{t('extract.saveBtn')}</h2>
                <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                  <label className="form-label">{t('extract.deckTitleLabel')}</label>
                  <input
                    className="form-input"
                    placeholder={t('extract.placeholderDeckTitle')}
                    value={deckTitle}
                    onChange={e => setDeckTitle(e.target.value)}
                  />
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.85rem' }}>
                  {currentLang === 'vi' ? `Hành động này sẽ tạo bộ thẻ mới với ${words.length} thẻ` : currentLang === 'en' ? `This will create a new deck with ${words.length} cards` : `これにより、${words.length} 枚のカードを持つ新しいデッキが作成されます`}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <button
                    className="btn btn-primary"
                    onClick={saveToDeck}
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    {saving ? (currentLang === 'vi' ? 'Đang lưu...' : currentLang === 'en' ? 'Saving...' : '保存中...') : t('extract.saveBtn')}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowSave(false)}>
                    {t('decks.cancelBtn')}
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
