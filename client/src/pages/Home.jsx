import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: '📇',
      title: 'Smart Flashcards',
      desc: 'Flip cards to reveal vocabulary and meanings with beautiful 3D animations. Supports Japanese and English.',
      color: 'var(--accent-purple)'
    },
    {
      icon: '✨',
      title: 'Auto-Extract Vocabulary',
      desc: 'Paste any text from the internet and automatically extract vocabulary words. No manual input needed!',
      color: 'var(--accent-teal)'
    },
    {
      icon: '📝',
      title: 'Quick Mini-Tests',
      desc: 'Test your knowledge right after studying with instant quizzes. Multiple choice and more.',
      color: 'var(--accent-blue)'
    }
  ];

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-logo">
          <div className="logo-icon">🎓</div>
          <span className="text-gradient">Lingua</span>
        </div>
        <div className="landing-nav-links">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Dashboard →</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-badge">
          🌏 Japanese & English Learning Platform
        </div>
        <h1 className="hero-title">
          Learn Languages <br />
          <span className="text-gradient">the Fun Way</span>
        </h1>
        <p className="hero-description">
          Master Japanese and English with smart flashcards, AI-powered vocabulary extraction,
          and mini-tests that reinforce your knowledge.
        </p>
        <div className="hero-cta">
          <Link to="/login" className="btn btn-primary btn-lg">
            🚀 Start Learning Free
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Already have an account?
          </Link>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value text-gradient">🇯🇵 日本語</div>
            <div className="hero-stat-label">Japanese</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value text-gradient">🇬🇧 English</div>
            <div className="hero-stat-label">English</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value text-gradient-fire">∞</div>
            <div className="hero-stat-label">Possibilities</div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <h2 className="features-title">
          Everything you need to <span className="text-gradient">master languages</span>
        </h2>
        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card glass-card">
              <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>© 2024 Lingua — ITSS2 Project. Built with ❤️ for language learners.</p>
      </footer>
    </div>
  );
};

export default Home;
