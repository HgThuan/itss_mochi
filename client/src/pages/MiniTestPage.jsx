import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const MiniTestPage = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();

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
      addToast('Failed to load decks', 'error');
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
      addToast(err.response?.data?.message || 'Failed to generate test', 'error');
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
      addToast('Failed to submit test', 'error');
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
          <h1 className="page-title">📝 <span className="text-gradient">Mini Test</span></h1>
          <p className="page-subtitle">Test your knowledge with quick quizzes</p>
        </div>

        {decks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No decks available</div>
            <div className="empty-desc">Create a flashcard deck with at least 4 cards first</div>
            <button className="btn btn-primary" onClick={() => navigate('/decks')}>
              Go to Decks
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
                  {deck.language === 'ja' ? '🇯🇵 Japanese' : '🇬🇧 English'}
                </span>
                <h3 className="deck-title">{deck.title}</h3>
                <p className="deck-desc">{deck.cardCount} cards</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }}>
                  Start Test →
                </button>
              </div>
            ))}
            {decks.filter(d => d.cardCount >= 4).length === 0 && (
              <div className="empty-state">
                <div className="empty-title">Not enough cards</div>
                <div className="empty-desc">Each deck needs at least 4 cards for a test</div>
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
              {isPerfect ? 'Perfect Score!' : isGood ? 'Great Job!' : 'Keep Practicing!'}
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
                🔄 Try Again
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/decks')}>
                ← Back to Decks
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
          <div className="question-number">Question {currentQ + 1}</div>
          <div className="question-text">{question.question}</div>
          {question.reading && (
            <div style={{ color: 'var(--accent-purple-light)', fontSize: '1rem', marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-japanese)' }}>
              {question.reading}
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Choose the correct meaning:
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
