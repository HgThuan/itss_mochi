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
    pet: {
      _id: 'pet_1',
      userId: 'user_1',
      name: 'Pochi',
      type: 'dog',
      level: 1,
      experience: 0,
      happiness: 100,
      lastFed: new Date().toISOString()
    },
    streak: {
      _id: 'streak_1',
      userId: 'user_1',
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: new Date().toISOString(),
      freezeItems: 2,
      history: [{ date: new Date().toISOString().split('T')[0], minutesStudied: 10 }]
    },
    buddies: []
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

    // ---- PET ----
    if (url === '/pet' && method === 'GET') {
      return response(200, db.pet);
    }
    if (url === '/pet/create' && method === 'POST') {
      db.pet = {
        _id: 'pet_' + generateId(),
        userId: db.user._id,
        name: data.name || 'Pochi',
        type: data.type || 'dog',
        level: 1,
        experience: 0,
        happiness: 100,
        lastFed: new Date().toISOString()
      };
      saveDB(db);
      return response(201, db.pet);
    }
    if (url === '/pet/feed' && method === 'POST') {
      if (db.user.coins >= 50) {
        db.user.coins -= 50;
        db.pet.happiness = Math.min(100, db.pet.happiness + 20);
        db.pet.experience += 10;
        db.pet.lastFed = new Date().toISOString();
        if (db.pet.experience >= db.pet.level * 100) {
          db.pet.level += 1;
          db.pet.experience = 0;
        }
        saveDB(db);
      }
      return response(200, { pet: db.pet, coins: db.user.coins });
    }
    if (url === '/pet/add-exp' && method === 'POST') {
      db.pet.experience += 5;
      if (db.pet.experience >= db.pet.level * 100) {
        db.pet.level += 1;
        db.pet.experience = 0;
      }
      saveDB(db);
      return response(200, db.pet);
    }

    // ---- STREAK ----
    if (url === '/streak' && method === 'GET') {
      return response(200, db.streak);
    }
    if (url === '/streak/log' && method === 'POST') {
      const today = new Date().toISOString().split('T')[0];
      const existing = db.streak.history.find(h => h.date === today);
      if (existing) {
        existing.minutesStudied += data.minutes;
      } else {
        db.streak.history.push({ date: today, minutesStudied: data.minutes });
        db.streak.currentStreak += 1;
        db.streak.longestStreak = Math.max(db.streak.longestStreak, db.streak.currentStreak);
        db.streak.lastStudyDate = new Date().toISOString();
      }
      saveDB(db);
      return response(200, db.streak);
    }
    if (url === '/streak/buy-freeze' && method === 'POST') {
      if (db.user.coins >= 200) {
        db.user.coins -= 200;
        db.streak.freezeItems += 1;
        saveDB(db);
      }
      return response(200, db.streak);
    }
    if (url === '/streak/milestones' && method === 'GET') {
      return response(200, [
        { days: 3, title: '3-Day Streak', rewardCoins: 50, claimed: db.streak.longestStreak >= 3 },
        { days: 7, title: '1-Week Warrior', rewardCoins: 150, claimed: db.streak.longestStreak >= 7 }
      ]);
    }
    
    if (url === '/streak/claim-milestone' && method === 'POST') {
      if (data.days === 3 && db.streak.longestStreak >= 3) db.user.coins += 50;
      if (data.days === 7 && db.streak.longestStreak >= 7) db.user.coins += 150;
      saveDB(db);
      return response(200, { message: 'Claimed', coins: db.user.coins });
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

    // ---- BUDDY ----
    if (url.startsWith('/buddy/') || url === '/buddy/groups') {
      return response(200, []); // returning empty for buddies for now
    }

    console.warn(`Mock backend unhandled request: ${method} ${url}`);
    return response(404, { message: 'Endpoint not implemented in mock' });

  } catch (error) {
    console.error('Mock Adapter Error:', error);
    return response(500, { message: 'Mock server error' });
  }
};
