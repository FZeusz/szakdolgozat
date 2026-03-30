import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --bg: #0f0f0f;
    --surface: #1a1a1a;
    --border: #2a2a2a;
    --gold: #c8a96e;
    --gold-hover: #dbbe88;
    --text: #f0ebe0;
    --muted: #666;
    --btn-muted: #aaa;
    --error: #e05c5c;
    --success: #5cb85c;
  }

  body {
    background: var(--bg);
  }

  .register-root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    font-family: system-ui, -apple-system, sans-serif;
    padding-top: 57px;
  }

  /* ── NAVBAR ── */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: 57px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .navbar-logo {
    font-size: 17px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.02em;
    cursor: pointer;
  }

  .navbar-hint {
    font-size: 13px;
    color: var(--muted);
  }

  .navbar-hint span {
    color: var(--gold);
    cursor: pointer;
    font-weight: 500;
    margin-left: 4px;
    transition: color 0.15s;
  }

  .navbar-hint span:hover {
    color: var(--gold-hover);
  }

  /* ── CARD ── */
  .register-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    animation: fadeUp 0.6s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .register-card {
    width: 100%;
    max-width: 400px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 40px 36px;
  }

  .register-card h1 {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.03em;
    font-family: Georgia, serif;
    margin-bottom: 6px;
  }

  .register-card .subtitle {
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 32px;
  }

  /* ── FIELDS ── */
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 18px;
  }

  .field label {
    font-size: 13px;
    font-weight: 500;
    color: var(--btn-muted);
  }

  .field input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 11px 14px;
    font-size: 14px;
    color: var(--text);
    font-family: inherit;
    transition: border-color 0.15s;
    outline: none;
    width: 100%;
  }

  .field input:focus {
    border-color: var(--gold);
  }

  .field input::placeholder {
    color: #333;
  }

  /* ── MESSAGES ── */
  .error-msg {
    background: rgba(224, 92, 92, 0.1);
    border: 1px solid rgba(224, 92, 92, 0.25);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: var(--error);
    margin-bottom: 18px;
  }

  .success-msg {
    background: rgba(92, 184, 92, 0.1);
    border: 1px solid rgba(92, 184, 92, 0.25);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: var(--success);
    margin-bottom: 18px;
  }

  /* ── BUTTONS ── */
  .btn-primary {
    width: 100%;
    padding: 12px;
    background: var(--gold);
    color: var(--bg);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 6px;
  }

  .btn-primary:hover {
    background: var(--gold-hover);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 22px 0;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .divider span {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
  }

  .btn-secondary {
    width: 100%;
    padding: 12px;
    background: transparent;
    color: var(--btn-muted);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .btn-secondary:hover {
    color: var(--text);
    border-color: #555;
  }

  /* ── FOOTER ── */
  .footer {
    width: 100%;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 14px 32px;
    text-align: center;
    font-size: 13px;
    color: #444;
  }
`;

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <style>{styles}</style>
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
                  placeholder="pl. janos123"
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
                  placeholder="pl. janos@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Jelszó</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Legalább 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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