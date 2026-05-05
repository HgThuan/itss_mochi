import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const PET_EMOJIS = {
  cat: { egg: '🥚', baby: '🐱', teen: '😺', adult: '😸', legendary: '🦁' },
  dog: { egg: '🥚', baby: '🐶', teen: '🐕', adult: '🦮', legendary: '🐺' },
  dragon: { egg: '🥚', baby: '🐣', teen: '🦎', adult: '🐉', legendary: '🐲' },
  fox: { egg: '🥚', baby: '🦊', teen: '🦊', adult: '🦊', legendary: '🦊' }
};

const STAGE_LABELS = {
  egg: 'Egg 🥚',
  baby: 'Baby 👶',
  teen: 'Teen 🌱',
  adult: 'Adult ⭐',
  legendary: 'Legendary 👑'
};

const PetPage = () => {
  const { user, fetchUser } = useAuth();
  const { addToast, ToastContainer } = useToast();
  const [pet, setPet] = useState(null);
  const [hasPet, setHasPet] = useState(false);
  const [nextStageExp, setNextStageExp] = useState(100);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('cat');
  const [feeding, setFeeding] = useState(false);
  const [evolving, setEvolving] = useState(false);

  useEffect(() => {
    loadPet();
  }, []);

  const loadPet = async () => {
    try {
      const res = await api.get('/pet');
      setHasPet(res.data.hasPet);
      setPet(res.data.pet);
      setNextStageExp(res.data.nextStageExp || 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPet = async () => {
    if (!petName.trim()) {
      addToast('Please enter a name for your pet', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/pet/create', { name: petName, type: petType });
      setPet(res.data.pet);
      setHasPet(true);
      addToast(`${petName} has been born! 🎉`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create pet', 'error');
    } finally {
      setCreating(false);
    }
  };

  const feedPet = async () => {
    setFeeding(true);
    try {
      const res = await api.post('/pet/feed');
      const oldStage = pet.stage;
      setPet(res.data.pet);
      fetchUser();

      if (res.data.pet.stage !== oldStage) {
        setEvolving(true);
        addToast(`${pet.name} evolved to ${res.data.pet.stage}! 🎉`, 'success');
        setTimeout(() => setEvolving(false), 3000);
      } else {
        addToast('Pet fed! +5 EXP, +15 Happiness ❤️', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to feed pet', 'error');
    } finally {
      setFeeding(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  // Pet creation view
  if (!hasPet) {
    return (
      <div>
        <ToastContainer />
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="page-title">🐾 <span className="text-gradient">Adopt a Pet</span></h1>
          <p className="page-subtitle">Choose your companion who will grow with your learning journey!</p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 'var(--space-xl)' }}>Choose Your Pet Type</h3>

            <div className="pet-selection">
              {Object.entries(PET_EMOJIS).map(([type, emojis]) => (
                <div
                  key={type}
                  className={`pet-option ${petType === type ? 'selected' : ''}`}
                  onClick={() => setPetType(type)}
                >
                  <div className="pet-emoji">{emojis.baby}</div>
                  <div className="pet-type-name">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-2xl)', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
              <label className="form-label">Pet Name</label>
              <input
                className="form-input"
                placeholder="Give your pet a name..."
                value={petName}
                onChange={e => setPetName(e.target.value)}
                style={{ textAlign: 'center' }}
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={createPet}
              disabled={creating}
              style={{ marginTop: 'var(--space-xl)' }}
            >
              {creating ? 'Creating...' : '🥚 Adopt Pet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pet display view
  const emoji = PET_EMOJIS[pet.type]?.[pet.stage] || '🐾';
  const expPercent = Math.min(100, (pet.exp / nextStageExp) * 100);

  return (
    <div>
      <ToastContainer />
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">🐾 <span className="text-gradient">My Pet</span></h1>
        <p className="page-subtitle">Your pet evolves as you learn!</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className={`glass-card pet-container ${evolving ? 'evolving' : ''}`}>
          <div className="pet-stage-badge">{STAGE_LABELS[pet.stage]}</div>

          <div className="pet-display">
            <div className="pet-sprite">{emoji}</div>
          </div>

          <div className="pet-name">{pet.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Level {pet.level} {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
          </div>

          {/* EXP Bar */}
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>EXP</span>
              <span>{pet.exp} / {nextStageExp}</span>
            </div>
            <div className="pet-exp-bar" style={{ width: '100%' }}>
              <div className="pet-exp-fill" style={{ width: `${expPercent}%` }}></div>
            </div>
          </div>

          {/* Happiness Bar */}
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Happiness</span>
              <span>{pet.happiness}%</span>
            </div>
            <div className="goal-progress-track">
              <div
                className="goal-progress-fill"
                style={{
                  width: `${pet.happiness}%`,
                  background: pet.happiness > 60
                    ? 'var(--gradient-success)'
                    : pet.happiness > 30
                      ? 'linear-gradient(135deg, var(--accent-yellow), var(--accent-orange))'
                      : 'linear-gradient(135deg, var(--accent-red), var(--accent-orange))'
                }}
              ></div>
            </div>
          </div>

          {/* Pet Info */}
          <div className="pet-info">
            <div className="pet-info-item">
              <div className="label">Level</div>
              <div className="value">{pet.level}</div>
            </div>
            <div className="pet-info-item">
              <div className="label">Stage</div>
              <div className="value">{pet.stage}</div>
            </div>
            <div className="pet-info-item">
              <div className="label">EXP</div>
              <div className="value">{pet.exp}</div>
            </div>
          </div>

          {/* Feed Button */}
          <button
            className="btn btn-primary btn-lg"
            onClick={feedPet}
            disabled={feeding || (user?.coins || 0) < 10}
            style={{ marginTop: 'var(--space-xl)', width: '100%' }}
          >
            {feeding ? 'Feeding...' : '🍖 Feed Pet (10 coins)'}
          </button>
          <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Your coins: 🪙 {user?.coins || 0}
          </div>
        </div>

        {/* Evolution Guide */}
        <div className="glass-card" style={{ marginTop: 'var(--space-xl)' }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>📖 Evolution Guide</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {['egg', 'baby', 'teen', 'adult', 'legendary'].map(stage => (
              <div key={stage} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: '0.75rem',
                background: pet.stage === stage ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
                border: pet.stage === stage ? '1px solid var(--accent-purple)' : '1px solid transparent'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{PET_EMOJIS[pet.type][stage]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{STAGE_LABELS[stage]}</div>
                </div>
                {pet.stage === stage && <span style={{ color: 'var(--accent-green)' }}>← Current</span>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <p><strong>How to earn EXP:</strong></p>
            <p>📇 Flashcard Session: +10 EXP</p>
            <p>📝 Pass a Test: +20 EXP</p>
            <p>💯 Perfect Test Score: +50 EXP</p>
            <p>🔥 Daily Streak: +5 EXP</p>
            <p>🍖 Feed Pet: +5 EXP</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetPage;
