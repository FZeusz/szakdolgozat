import { NavLink, Outlet, useNavigate } from 'react-router-dom';

// Navigációs elemek: path a route-hoz, end=true hogy /dashboard pontosan aktív legyen
const NAV_ITEMS = [
  { path: '/dashboard',         icon: '🏠', label: 'Főoldal',      end: true  },
  { path: '/dashboard/quizzes', icon: '📝', label: 'Saját kvízek', end: false },
  { path: '/dashboard/explore', icon: '🔍', label: 'Felfedezés',   end: false },
  { path: '/dashboard/stats',   icon: '📊', label: 'Statisztikák', end: false },
  { path: '/dashboard/profile', icon: '👤', label: 'Profil',       end: false },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dash-root">

      {/* ── TOP NAVBAR ── */}
      <header className="dash-navbar">
        <span className="dash-navbar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          Alkalmazás neve
        </span>
        <div className="dash-navbar-right">
          <button className="avatar-btn" onClick={() => navigate('/dashboard/profile')} title="Profil">
            {initials}
          </button>
          <button className="dash-logout-btn" onClick={handleLogout}>
            Kijelentkezés
          </button>
        </div>
      </header>

      <div className="dash-layout">

        {/* ── SIDEBAR ── */}
        <aside className="dash-sidebar">
          <nav className="dash-nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `dash-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="dash-nav-icon">{item.icon}</span>
                <span className="dash-nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <button className="dash-nav-item dash-nav-logout" onClick={handleLogout}>
            <span className="dash-nav-icon">🚪</span>
            <span className="dash-nav-label">Kijelentkezés</span>
          </button>
        </aside>

        {/* ── FŐ TARTALOM – ide töltődnek be a gyerek route-ok ── */}
        <main className="dash-main">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
