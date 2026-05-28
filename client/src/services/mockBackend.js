const generateId = () => Math.random().toString(36).substr(2, 9);

const getDB = () => {
  const data = localStorage.getItem('lingua_mock_db');
  if (data) return JSON.parse(data);
  
  // Initialize Default Data
  const initialDB = {
    user: {
      _id: 'user_1',
      username: 'Guest User',
      email: 'guest@example.com',
      coins: 1000,
      dailyGoalMinutes: 15,
      preferredLanguage: 'ja'
    },
    decks: [
      {
        _id: 'deck_1',
        title: 'Basic Greetings',
        description: 'Essential daily greetings',
        language: 'ja',
        targetLanguage: 'en',
        cardCount: 0,
        createdAt: new Date().toISOString()
      }
    ],
    cards: [
      {
        _id: 'card_1',
        deckId: 'deck_1',
        front: 'こんにちは',
        back: 'Hello / Good afternoon',
        lastReviewed: null,
        nextReview: null,
        interval: 0,
        repetition: 0,
        efactor: 2.5
      }
    ],

  };
  
  // Update card count
  initialDB.decks[0].cardCount = 1;
  
  localStorage.setItem('lingua_mock_db', JSON.stringify(initialDB));
  return initialDB;
};

const saveDB = (db) => {
  localStorage.setItem('lingua_mock_db', JSON.stringify(db));
};

// Delay simulation
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAdapter = async (config) => {
  await delay(300); // simulate network latency
  
  const db = getDB();
  const url = config.url.replace('/api', '');
  const method = config.method.toUpperCase();
  const data = config.data ? JSON.parse(config.data) : null;

  const response = (status, responseData) => {
    return {
      data: responseData,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: {},
      config,
      request: {}
    };
  };

  try {
    // ---- AUTH ----
    if (url === '/auth/me' && method === 'GET') {
      return response(200, db.user);
    }
    if (url === '/auth/settings' && method === 'PUT') {
      db.user = { ...db.user, ...data };
      saveDB(db);
      return response(200, db.user);
    }

    // ---- DECKS ----
    if (url === '/decks' && method === 'GET') {
      return response(200, db.decks);
    }
    if (url === '/decks' && method === 'POST') {
      const newDeck = {
        _id: 'deck_' + generateId(),
        ...data,
        cardCount: 0,
        createdAt: new Date().toISOString()
      };
      db.decks.push(newDeck);
      saveDB(db);
      return response(201, newDeck);
    }
    if (url.match(/^\/decks\/deck_[a-zA-Z0-9]+$/) && method === 'GET') {
      const id = url.split('/').pop();
      const deck = db.decks.find(d => d._id === id);
      if (!deck) return response(404, { message: 'Not found' });
      const cards = db.cards.filter(c => c.deckId === id);
      return response(200, { ...deck, cards });
    }
    if (url.match(/^\/decks\/deck_[a-zA-Z0-9]+$/) && method === 'DELETE') {
      const id = url.split('/').pop();
      db.decks = db.decks.filter(d => d._id !== id);
      db.cards = db.cards.filter(c => c.deckId !== id);
      saveDB(db);
      return response(200, { message: 'Deleted' });
    }

    // ---- CARDS ----
    if (url === '/cards' && method === 'POST') {
      const newCard = {
        _id: 'card_' + generateId(),
        ...data,
        lastReviewed: null,
        nextReview: null,
        interval: 0,
        repetition: 0,
        efactor: 2.5
      };
      db.cards.push(newCard);
      const deck = db.decks.find(d => d._id === data.deckId);
      if (deck) deck.cardCount += 1;
      saveDB(db);
      return response(201, newCard);
    }
    if (url.match(/^\/cards\/card_[a-zA-Z0-9]+$/) && method === 'PUT') {
      const id = url.split('/').pop();
      const index = db.cards.findIndex(c => c._id === id);
      if (index !== -1) {
        db.cards[index] = { ...db.cards[index], ...data };
        saveDB(db);
        return response(200, db.cards[index]);
      }
      return response(404, { message: 'Not found' });
    }
    if (url.match(/^\/cards\/card_[a-zA-Z0-9]+$/) && method === 'DELETE') {
      const id = url.split('/').pop();
      const card = db.cards.find(c => c._id === id);
      if (card) {
        db.cards = db.cards.filter(c => c._id !== id);
        const deck = db.decks.find(d => d._id === card.deckId);
        if (deck) deck.cardCount = Math.max(0, deck.cardCount - 1);
        saveDB(db);
      }
      return response(200, { message: 'Deleted' });
    }


    
    // ---- EXTRACT (Static mock) ----
    if (url === '/extract' && method === 'POST') {
      return response(200, {
        vocabulary: [
          { front: 'Mock Text', back: 'Văn bản giả lập', context: 'This is a mock' },
          { front: 'Frontend', back: 'Giao diện', context: 'Running purely on frontend' }
        ]
      });
    }
    if (url === '/extract/to-deck' && method === 'POST') {
      const newDeck = {
        _id: 'deck_' + generateId(),
        title: data.deckTitle || 'Extracted Deck',
        description: 'Mock extracted deck',
        cardCount: data.vocabulary.length,
        createdAt: new Date().toISOString()
      };
      db.decks.push(newDeck);
      data.vocabulary.forEach(v => {
        db.cards.push({
          _id: 'card_' + generateId(),
          deckId: newDeck._id,
          front: v.front,
          back: v.back,
          lastReviewed: null, nextReview: null, interval: 0, repetition: 0, efactor: 2.5
        });
      });
      saveDB(db);
      return response(200, newDeck);
    }

    // ---- TEST ----
    if (url.startsWith('/test/generate') && method === 'POST') {
      const deckId = url.split('/').pop();
      const cards = db.cards.filter(c => c.deckId === deckId);
      const questions = cards.slice(0, 5).map(c => ({
        cardId: c._id,
        questionText: c.front,
        correctAnswer: c.back,
        options: [c.back, 'Option B', 'Option C', 'Option D'].sort(() => Math.random() - 0.5)
      }));
      return response(200, {
        _id: 'test_' + generateId(),
        deckId,
        questions
      });
    }
    if (url === '/test/submit' && method === 'POST') {
      db.user.coins += 20;
      saveDB(db);
      return response(200, { score: data.score, totalQuestions: data.answers.length });
    }
    if (url === '/test/history' && method === 'GET') {
      return response(200, []);
    }



    console.warn(`Mock backend unhandled request: ${method} ${url}`);
    return response(404, { message: 'Endpoint not implemented in mock' });

  } catch (error) {
    console.error('Mock Adapter Error:', error);
    return response(500, { message: 'Mock server error' });
  }
};
