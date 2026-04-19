import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Nem sikerült elérni a szervert!');
    }
  };

  return (
    <>
      <div className="login-root">

        {/* Navbar */}
        <nav className="navbar">
          <span className="navbar-logo" onClick={() => navigate('/')}>KvízPro</span>
          <p className="navbar-hint">
            Még nincs fiókod?
            <span onClick={() => navigate('/register')}>Regisztrálj</span>
          </p>
        </nav>

        {/* Card */}
        <div className="login-body">
          <div className="login-card">
            <h1>Bejelentkezés</h1>
            <p className="subtitle">Üdv újra! Add meg az adataidat.</p>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="login_id">Felhasználónév vagy Email</label>
                <input
                  id="login_id"
                  type="text"tbrt
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="login_pass">Jelszó</label>
                <div className="password-wrapper">
                  <input
                    id="login_pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {password.length > 0 && (
                    <button
                      type="button"
                      className="toggle-pw"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-primary">
                Bejelentkezés
              </button>
            </form>

            <div className="divider"><span>vagy</span></div>

            <button className="btn-secondary" onClick={() => navigate('/register')}>
              Új fiók létrehozása
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          © 2026 KvízPro · Fónagy Zeusz Vilmos · Minden jog fenntartva
        </footer>

      </div>
    </>
  );
}