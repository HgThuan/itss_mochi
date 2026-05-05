import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/decks', icon: '📚', label: 'Flashcards' },
    { path: '/extract', icon: '✨', label: 'Extract Words' },
    { path: '/test', icon: '📝', label: 'Mini Test' },
    { path: '/streak', icon: '🔥', label: 'Streak' },
    { path: '/pet', icon: '🐾', label: 'My Pet' },
    { path: '/buddy', icon: '👥', label: 'Study Buddy' },
    { path: '/profile', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      <button className="mobile-nav-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🎓</div>
          <span className="sidebar-brand">
            <span className="text-gradient">LinguaPet</span>
          </span>
        </div>

        <div className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-coins">🪙 {user?.coins || 0} coins</div>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
