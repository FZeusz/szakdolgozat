import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Sikeres regisztráció! Átirányítás a bejelentkezéshez...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setIsError(true);
        setMessage(data.message);
      }
    } catch (err) {
      setIsError(true);
      setMessage('Nem sikerült elérni a szervert!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="register-root">

        {/* Navbar */}
        <nav className="navbar">
          <span className="navbar-logo" onClick={() => navigate('/')}>Alkalmazás neve</span>
          <p className="navbar-hint">
            Már van fiókod?
            <span onClick={() => navigate('/login')}>Jelentkezz be</span>
          </p>
        </nav>

        {/* Card */}
        <div className="register-body">
          <div className="register-card">
            <h1>Regisztráció</h1>
            <p className="subtitle">Hozd létre a fiókodat, ez csak pár másodperc.</p>

            {message && (
              <div className={isError ? 'error-msg' : 'success-msg'}>
                {message}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="field">
                <label htmlFor="username">Felhasználónév</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="email">E-mail cím</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Jelszó</label>
                <div className="password-wrapper">
                  <input
                    id="password"
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

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Folyamatban...' : 'Fiók létrehozása'}
              </button>
            </form>

            <div className="divider"><span>vagy</span></div>

            <button className="btn-secondary" onClick={() => navigate('/login')}>
              Már van fiókom
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          © 2026 Alkalmazás neve · Minden jog fenntartva
        </footer>

      </div>
    </>
  );
}