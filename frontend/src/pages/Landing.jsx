import { useNavigate } from 'react-router-dom';

const NAVBAR_HEIGHT = '57px';

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
  }

  body {
    background: var(--bg);
  }

  .landing-root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    font-family: system-ui, -apple-system, sans-serif;
    padding-top: ${NAVBAR_HEIGHT};
  }

  /* ── FIXED NAVBAR ── */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: ${NAVBAR_HEIGHT};
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: fadeDown 0.5s ease both;
  }

  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .navbar-logo {
    font-size: 17px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  .navbar-actions {
    display: flex;
    gap: 10px;
  }

  .btn-ghost {
    padding: 8px 20px;
    background: transparent;
    color: var(--btn-muted);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .btn-ghost:hover {
    color: var(--text);
    border-color: #555;
  }

  .btn-filled {
    padding: 8px 20px;
    background: var(--gold);
    color: var(--bg);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }

  .btn-filled:hover {
    background: var(--gold-hover);
  }

  /* ── HERO ── */
  .hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 24px;
    gap: 56px;
    animation: fadeUp 0.7s ease 0.15s both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .hero-text {
    max-width: 640px;
  }

  .hero-text h1 {
    font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 16px;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .hero-text p {
    font-size: 16px;
    color: var(--muted);
    line-height: 1.7;
  }

  /* ── STATS ── */
  .stats {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    width: 100%;
    max-width: 560px;
  }

  .stat-item {
    flex: 1;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: var(--surface);
    transition: background 0.15s;
    min-width: 0;
  }

  .stat-item:not(:last-child) {
    border-right: 1px solid var(--border);
  }

  .stat-item:hover {
    background: #202020;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--gold);
    letter-spacing: -0.03em;
    font-family: Georgia, serif;
    white-space: nowrap;
  }

  .stat-label {
    font-size: 12px;
    color: var(--muted);
    font-weight: 400;
    text-align: center;
    line-height: 1.4;
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

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="landing-root">

        {/* Fixed Navbar */}
        <nav className="navbar">
          <span className="navbar-logo">Alkalmazás neve</span>
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
            <h1>Az alkalmazás neve</h1>
            <p>Egy rövid leírás, hogy miről szól a platform. Kiemelhetjük a legfontosabb előnyöket, funkciókat, vagy akár egy szlogent is.</p>
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
          © 2026 Alkalmazás neve · Minden jog fenntartva
        </footer>

      </div>
    </>
  );
}