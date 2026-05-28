import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../hooks/useTranslation';

const MiniTestPage = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();
  const { t, currentLang } = useTranslation();

  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(deckId || '');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    loadDecks();
  }, []);

  useEffect(() => {
    if (deckId) {
      startTest(deckId);
    }
  }, [deckId]);

  const loadDecks = async () => {
    try {
      const res = await api.get('/decks');
      setDecks(res.data);
    } catch (err) {
      addToast(currentLang === 'vi' ? 'Lỗi khi tải bộ thẻ từ' : currentLang === 'en' ? 'Failed to load decks' : 'デッキの読み込みに失敗しました', 'error');
    }
  };

  const startTest = async (id) => {
    setLoading(true);
    try {
      const res = await api.post(`/test/generate/${id}`, { count: 10 });
      setQuestions(res.data.questions);
      setCurrentQ(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setTestStarted(true);
      setShowResult(false);
      setAnswered(false);
    } catch (err) {
      addToast(err.response?.data?.message || (currentLang === 'vi' ? 'Lỗi khi tạo bài test' : currentLang === 'en' ? 'Failed to generate test' : 'テストの作成に失敗しました'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (option) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const currentQuestion = questions[currentQ];
    const isCorrect = option === currentQuestion.correctAnswer;

    setAnswers(prev => [...prev, {
      cardId: currentQuestion.cardId,
      userAnswer: option,
      correctAnswer: currentQuestion.correctAnswer,
      correct: isCorrect
    }]);

    // Auto-advance after delay
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswered(false);
      } else {
        submitTest();
      }
    }, 1200);
  };

  const submitTest = async () => {
    try {
      const updatedAnswers = [...answers];
      if (answers.length < questions.length) {
        const currentQuestion = questions[currentQ];
        updatedAnswers.push({
          cardId: currentQuestion.cardId,
          userAnswer: selectedAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          correct: selectedAnswer === currentQuestion.correctAnswer
        });
      }

      const res = await api.post('/test/submit', {
        deckId: selectedDeck || deckId,
        answers: updatedAnswers
      });

      setResult(res.data);
      setShowResult(true);

      // Add pet EXP
      try {
        const action = res.data.percentage === 100 ? 'test_perfect' : 'test_pass';
        await api.post('/pet/add-exp', { action });
      } catch(_) {}

      // Log study time
      try {
        await api.post('/streak/log', { minutes: 3 });
      } catch(_) {}

    } catch (err) {
      addToast(currentLang === 'vi' ? 'Lỗi khi gửi kết quả kiểm tra' : currentLang === 'en' ? 'Failed to submit test' : 'テストの提出に失敗しました', 'error');
    }
  };

  const getOptionClass = (option) => {
    if (!answered) return selectedAnswer === option ? 'selected' : '';
    const currentQuestion = questions[currentQ];
    if (option === currentQuestion.correctAnswer) return 'correct';
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) return 'incorrect';
    return '';
  };

  // Deck selection view
  if (!testStarted && !deckId) {
    return (
      <div>
        <ToastContainer />
        <div className="page-header">
          <h1 className="page-title">📝 <span className="text-gradient">{t('test.title')}</span></h1>
          <p className="page-subtitle">{currentLang === 'vi' ? 'Kiểm tra kiến thức của bạn với các bài trắc nghiệm nhanh' : currentLang === 'en' ? 'Test your knowledge with quick quizzes' : 'クイッククイズで知識をテストしましょう'}</p>
        </div>

        {decks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">{currentLang === 'vi' ? 'Không có bộ thẻ nào' : currentLang === 'en' ? 'No decks available' : '利用可能なデッキがありません'}</div>
            <div className="empty-desc">{currentLang === 'vi' ? 'Hãy tạo bộ thẻ từ vựng với ít nhất 4 thẻ trước' : currentLang === 'en' ? 'Create a flashcard deck with at least 4 cards first' : '最初に少なくとも4枚のカードを持つデッキを作成してください'}</div>
            <button className="btn btn-primary" onClick={() => navigate('/decks')}>
              {t('test.backBtn')}
            </button>
          </div>
        ) : (
          <div className="deck-grid">
            {decks.filter(d => d.cardCount >= 4).map(deck => (
              <div
                key={deck._id}
                className="glass-card deck-card"
                onClick={() => { setSelectedDeck(deck._id); startTest(deck._id); }}
              >
                <span className="deck-lang">
                  {deck.language === 'ja' ? t('decks.langJa') : t('decks.langEn')}
                </span>
                <h3 className="deck-title">{deck.title}</h3>
                <p className="deck-desc">{t('decks.totalCards', { count: deck.cardCount })}</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }}>
                  {t('test.startBtn')} →
                </button>
              </div>
            ))}
            {decks.filter(d => d.cardCount >= 4).length === 0 && (
              <div className="empty-state">
                <div className="empty-title">{currentLang === 'vi' ? 'Không đủ số thẻ từ' : currentLang === 'en' ? 'Not enough cards' : 'カードが不足しています'}</div>
                <div className="empty-desc">{currentLang === 'vi' ? 'Mỗi bộ thẻ cần ít nhất 4 thẻ để có thể làm bài test' : currentLang === 'en' ? 'Each deck needs at least 4 cards for a test' : 'テストを行うには、各デッキに少なくとも4枚のカードが必要です'}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  // Result view
  if (showResult && result) {
    const isGood = result.percentage >= 80;
    const isPerfect = result.percentage === 100;

    return (
      <div>
        <ToastContainer />
        <div className="test-container">
          <div className="glass-card test-result">
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>
              {isPerfect ? '🎉' : isGood ? '👏' : '💪'}
            </div>
            <h2 style={{ marginBottom: 'var(--space-lg)' }}>
              {isPerfect 
                ? (currentLang === 'vi' ? 'Điểm tuyệt đối!' : currentLang === 'en' ? 'Perfect Score!' : '満点です！') 
                : isGood 
                  ? (currentLang === 'vi' ? 'Làm tốt lắm!' : currentLang === 'en' ? 'Great Job!' : '素晴らしい！') 
                  : (currentLang === 'vi' ? 'Cố gắng lên nhé!' : currentLang === 'en' ? 'Keep Practicing!' : '練習を続けましょう！')}
            </h2>
            <div className="score-circle" style={{
              borderColor: isGood ? 'var(--accent-green)' : 'var(--accent-orange)'
            }}>
              <div className="score-value" style={{
                color: isGood ? 'var(--accent-green)' : 'var(--accent-orange)'
              }}>
                {result.percentage}%
              </div>
              <div className="score-label">{result.score}/{result.totalQuestions}</div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-xl)' }}>
              <button className="btn btn-primary" onClick={() => startTest(selectedDeck || deckId)}>
                🔄 {currentLang === 'vi' ? 'Thử lại' : currentLang === 'en' ? 'Try Again' : 'もう一度試す'}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/decks')}>
                {t('test.backBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test questions view
  const question = questions[currentQ];
  if (!question) return null;

  return (
    <div>
      <ToastContainer />
      <div className="test-container">
        <div className="test-progress">
          <div className="test-progress-bar">
            <div className="test-progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
          </div>
          <span className="test-progress-text">{currentQ + 1}/{questions.length}</span>
        </div>

        <div className="glass-card test-question-card">
          <div className="question-number">{t('test.questionLabel', { num: currentQ + 1 })}</div>
          <div className="question-text">{question.question}</div>
          {question.reading && (
            <div style={{ color: 'var(--accent-purple-light)', fontSize: '1rem', marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-japanese)' }}>
              {question.reading}
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            {currentLang === 'vi' ? 'Chọn nghĩa chính xác:' : currentLang === 'en' ? 'Choose the correct meaning:' : '正しい意味を選択してください：'}
          </p>

          <div className="test-options">
            {question.options?.map((option, idx) => (
              <button
                key={idx}
                className={`test-option ${getOptionClass(option)}`}
                onClick={() => selectAnswer(option)}
                disabled={answered}
              >
                <span className="test-option-letter">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniTestPage;
