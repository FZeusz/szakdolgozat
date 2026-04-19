import { useNavigate } from 'react-router-dom';

// ── SVG ikonok (inline) ───────────────────────────────────────────

// Ajándékdoboz – "100% Ingyenes"
function IconGift() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

// Végtelen – "Korlátlan"
function IconInfinity() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z" />
      <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z" />
    </svg>
  );
}

// Villám – "Azonnali"
function IconZap() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// ── Feature kártyák ikonjai ──────────────────────────────────────
function IconBolt() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function IconBarChart() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <div className="landing-root">

        {/* ── Fixed Navbar ─────────────────────────────────── */}
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

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="hero" style={{ position: 'relative', overflow: 'hidden' }}>

          {/* Háttér blob-ok */}
          <div style={{
            position: 'absolute', top: '-80px', left: '-120px',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,169,110,0.18) 0%, transparent 70%)',
            filter: 'blur(48px)',
            pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', right: '-100px',
            width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,169,110,0.14) 0%, transparent 70%)',
            filter: 'blur(56px)',
            pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', top: '40%', left: '55%',
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,169,110,0.10) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          {/* Hero szöveg */}
          <div className="hero-text" style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              maxWidth: 640,
              margin: '0 auto 16px',
            }}>
              Tedd próbára a tudásod,<br />
              <span style={{ color: 'var(--gold)' }}>vagy hívj ki másokat!</span>
            </h1>
            <p style={{ maxWidth: 480, margin: '0 auto 32px', color: 'var(--muted)', lineHeight: 1.7 }}>
              Készíts saját kvízeket pillanatok alatt, és versenyezz másokkal több ezer témában. 
              A KvízPro a tökéletes platform a tanulásra, gyakorlásra és a szórakozásra.
            </p>

            {/* CTA gomb */}
            <button
              onClick={() => navigate('/register')}
              style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           8,
                background:    'var(--gold)',
                color:         '#fff',
                border:        'none',
                borderRadius:  12,
                padding:       '14px 32px',
                fontSize:      17,
                fontWeight:    700,
                cursor:        'pointer',
                letterSpacing: '-0.01em',
                boxShadow:     '0 4px 18px rgba(200,169,110,0.35)',
                transition:    'background 0.18s, transform 0.15s, box-shadow 0.18s',
                marginBottom:  8,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--gold-hover)';
                e.currentTarget.style.transform  = 'translateY(-2px)';
                e.currentTarget.style.boxShadow  = '0 8px 24px rgba(200,169,110,0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--gold)';
                e.currentTarget.style.transform  = 'translateY(0)';
                e.currentTarget.style.boxShadow  = '0 4px 18px rgba(200,169,110,0.35)';
              }}
            >
              ▶ Kezdj el játszani ingyen
            </button>
          </div>

          {/* ── Statisztika / értékajánlat kártyák ── */}
          <div className="stats" style={{ position: 'relative', zIndex: 1 }}>

            {/* 1. Ingyenes */}
            <div className="stat-item">
              <span style={{
                color: 'var(--gold)', opacity: 0.8, marginBottom: 6,
                display: 'flex', justifyContent: 'center',
              }}>
                <IconGift />
              </span>
              <span className="stat-value">Ingyenes</span>
              <span className="stat-label">Rejtett költségek nélkül</span>
            </div>

            {/* 2. Korlátlan */}
            <div className="stat-item">
              <span style={{
                color: 'var(--gold)', opacity: 0.8, marginBottom: 6,
                display: 'flex', justifyContent: 'center',
              }}>
                <IconInfinity />
              </span>
              <span className="stat-value">Korlátlan</span>
              <span className="stat-label">Kvízkészítés és kitöltés</span>
            </div>

            {/* 3. Azonnali */}
            <div className="stat-item">
              <span style={{
                color: 'var(--gold)', opacity: 0.8, marginBottom: 6,
                display: 'flex', justifyContent: 'center',
              }}>
                <IconZap />
              </span>
              <span className="stat-value">Azonnali</span>
              <span className="stat-label">Részletes valós idejű statisztikák</span>
            </div>

          </div>
        </div>

        {/* ── Miért válaszd? szekció ───────────────────────── */}
        <section style={{
          padding:  '72px 24px 80px',
          maxWidth: 900,
          margin:   '0 auto',
        }}>
          <h2 style={{
            textAlign:     'center',
            fontSize:      'clamp(1.4rem, 3vw, 2rem)',
            fontWeight:    700,
            letterSpacing: '-0.02em',
            marginBottom:  8,
            color:         'var(--text)',
          }}>
            Miért válaszd a <span style={{ color: 'var(--gold)' }}>KvízPro</span>-t?
          </h2>
          <p style={{
            textAlign:    'center',
            color:        'var(--muted)',
            fontSize:     15,
            marginBottom: 48,
          }}>
            Minden, amire szükséged van egy helyen.
          </p>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap:                 24,
          }}>
            {/* Kártya 1 */}
            <div style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border-light)',
              borderRadius: 18,
              padding:      '32px 28px',
              boxShadow:    'var(--shadow-sm)',
              transition:   'box-shadow 0.2s, transform 0.2s',
              cursor:       'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--gold-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, color: 'var(--gold)',
              }}>
                <IconBolt />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                Villámgyors kvízkészítés
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>
                Pár perc alatt összerakhatod a saját kvízedet – kérdések, válaszlehetőségek, pontszámok és időkorlát beállításával.
              </p>
            </div>

            {/* Kártya 2 */}
            <div style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border-light)',
              borderRadius: 18,
              padding:      '32px 28px',
              boxShadow:    'var(--shadow-sm)',
              transition:   'box-shadow 0.2s, transform 0.2s',
              cursor:       'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--gold-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, color: 'var(--gold)',
              }}>
                <IconBarChart />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                Részletes statisztikák
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>
                Kövesd nyomon a fejlődésed kategóriánként, nézd meg az átlagos eredményeid és elemezd a kitöltők válaszait.
              </p>
            </div>

            {/* Kártya 3 */}
            <div style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border-light)',
              borderRadius: 18,
              padding:      '32px 28px',
              boxShadow:    'var(--shadow-sm)',
              transition:   'box-shadow 0.2s, transform 0.2s',
              cursor:       'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--gold-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, color: 'var(--gold)',
              }}>
                <IconHeart />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                Közösségi élmény
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>
                Töltsd ki mások kvízeit, oszd meg a sajátjaidat megosztókóddal, és mérd össze tudásod a közösséggel.
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="footer">
          © 2026 KvízPro · Fónagy Zeusz Vilmos · Minden jog fenntartva
        </footer>

      </div>
    </>
  );
}
