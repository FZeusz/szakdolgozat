import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './index.css';

import Landing        from './pages/Landing';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';

// Dashboard aloldalak
import DashboardHome    from './pages/dashboard/Home';
import DashboardQuizzes from './pages/dashboard/Quizzes';
import DashboardExplore from './pages/dashboard/Explore';
import DashboardStats   from './pages/dashboard/Stats';
import DashboardProfile from './pages/dashboard/Profile';
import DashboardCreate  from './pages/dashboard/Create';

// ── Témaváltó gomb ────────────────────────────────────────────────
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setDark(d => !d)}
      aria-label={dark ? 'Világos mód' : 'Sötét mód'}
      title={dark ? 'Világos módra váltás' : 'Sötét módra váltás'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

// ── Route struktúra ───────────────────────────────────────────────
// A /dashboard egy layout route (navbar + sidebar).
// A gyerek route-ok az <Outlet /> helyére töltődnek.
//
//   /dashboard            → DashboardHome    (index route)
//   /dashboard/quizzes    → DashboardQuizzes
//   /dashboard/explore    → DashboardExplore
//   /dashboard/stats      → DashboardStats
//   /dashboard/profile    → DashboardProfile
//   /dashboard/create     → DashboardCreate
// ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/"         element={<Landing  />} />
        <Route path="/login"    element={<Login    />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard layout + nested routes */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index            element={<DashboardHome    />} />
          <Route path="quizzes"  element={<DashboardQuizzes />} />
          <Route path="explore"  element={<DashboardExplore />} />
          <Route path="stats"    element={<DashboardStats   />} />
          <Route path="profile"  element={<DashboardProfile />} />
          <Route path="create"   element={<DashboardCreate  />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
