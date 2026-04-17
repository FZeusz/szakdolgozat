import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <div className="landing-root">

        {/* Fixed Navbar */}
        <nav className="navbar">
          <span className="navbar-logo">KvízPro</span>
          <div className="navbar-actions">
            <button className="btn-ghost" onClick={() => navigate('/login')}>
              Bejelentkezés
            </button>
            <button className="btn-filled" onClick={() => navigate('/register')}>
              Regisztráció
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div className="hero">
          <div className="hero-text">
            <h1>KvízPro</h1>
            <p>Egy rövid leírás, hogy miről szól az oldal. Még nincs kitöltve. (kamu adatok)</p>
          </div>

          <div className="stats">
            <div className="stat-item">
              <span className="stat-value">100+</span>
              <span className="stat-label">Elérhető kvíz</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">5 000+</span>
              <span className="stat-label">Aktív felhasználó</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">∞</span>
              <span className="stat-label">Szórakozás</span>
            </div>
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