import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordInput, PasswordStrength, isPasswordValid } from '../components/PasswordInput';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [message,  setMessage]  = useState('');
  const [isError,  setIsError]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!isPasswordValid(password)) {
      setIsError(true);
      setMessage('A jelszó nem felel meg az összes feltételnek!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Sikeres regisztráció! Átirányítás a bejelentkezéshez...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setIsError(true);
        setMessage(data.message);
      }
    } catch {
      setIsError(true);
      setMessage('Nem sikerült elérni a szervert!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-root">
      <nav className="navbar">
        <span className="navbar-logo" onClick={() => navigate('/')}>KvízPro</span>
        <p className="navbar-hint">
          Már van fiókod?
          <span onClick={() => navigate('/login')}>Jelentkezz be</span>
        </p>
      </nav>

      <div className="register-body">
        <div className="register-card">
          <h1>Regisztráció</h1>
          <p className="subtitle">Hozd létre a fiókodat, ez csak pár másodperc.</p>

          {message && (
            <div className={isError ? 'error-msg' : 'success-msg'}>{message}</div>
          )}

          <form onSubmit={handleRegister}>
            <div className="field">
              <label htmlFor="username">Felhasználónév</label>
              <input id="username" type="text" value={username}
                onChange={e => setUsername(e.target.value)} required />
            </div>

            <div className="field">
              <label htmlFor="email">E-mail cím</label>
              <input id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="field">
              <label htmlFor="reg-password">Jelszó</label>
              <PasswordInput
                id="reg-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Legalább 8 karakter"
              />
              <PasswordStrength value={password} />
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

      <footer className="footer">
        © 2026 Alkalmazás neve · Minden jog fenntartva
      </footer>
    </div>
  );
}
