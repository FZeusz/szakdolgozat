import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordInput, PasswordStrength, isPasswordValid } from '../../components/PasswordInput';

// ── Jelszó módosítás kártya ───────────────────────────────────────
function PasswordChangeCard({ userId }) {
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Szem ikon állapotok a jelenlegi jelszó mezőhöz (az újak a PasswordInput-ban kezelik saját magukat)
  const [showCurrent, setShowCurrent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!current || !next || !confirm)
      return setMessage({ text: 'Minden mező kitöltése kötelező!', type: 'error' });
    if (!isPasswordValid(next))
      return setMessage({ text: 'Az új jelszó nem felel meg az összes feltételnek!', type: 'error' });
    if (next !== confirm)
      return setMessage({ text: 'A két új jelszó nem egyezik!', type: 'error' });

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: '✅ ' + data.message, type: 'success' });
        setCurrent(''); setNext(''); setConfirm('');
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch {
      setMessage({ text: 'Nem sikerült elérni a szervert!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-section-card">
      <h3 className="profile-section-title">Jelszó módosítása</h3>
      <form onSubmit={handleSubmit}>

        {/* Jelenlegi jelszó – saját szem ikon (PasswordInput nem kell, nem kell erősség) */}
        <div className="field">
          <label>Jelenlegi jelszó</label>
          <div className="password-wrapper">
            <input
              type={showCurrent ? 'text' : 'password'}
              placeholder="••••••••"
              value={current}
              onChange={e => setCurrent(e.target.value)}
            />
            {current.length > 0 && (
              <button type="button" className="toggle-pw"
                onClick={() => setShowCurrent(v => !v)} tabIndex={-1}
                aria-label={showCurrent ? 'Elrejtés' : 'Megjelenítés'}>
                {showCurrent ? (
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

        {/* Új jelszó – PasswordInput komponens + erősség jelző */}
        <div className="field">
          <label>Új jelszó</label>
          <PasswordInput
            value={next}
            onChange={e => setNext(e.target.value)}
            placeholder="Legalább 8 karakter"
            disabled={loading}
          />
          <PasswordStrength value={next} />
        </div>

        {/* Megerősítés – saját szem ikon */}
        <div className="field">
          <label>Új jelszó megerősítése</label>
          <div className="password-wrapper">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
            {confirm.length > 0 && (
              <button type="button" className="toggle-pw"
                onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                aria-label={showConfirm ? 'Elrejtés' : 'Megjelenítés'}>
                {showConfirm ? (
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
          {/* Jelzi ha nem egyezik */}
          {confirm.length > 0 && next !== confirm && (
            <p className="field-hint" style={{ color: 'var(--error)', marginTop: 4 }}>
              ✗ A két jelszó nem egyezik
            </p>
          )}
          {confirm.length > 0 && next === confirm && next.length > 0 && (
            <p className="field-hint" style={{ color: 'var(--success)', marginTop: 4 }}>
              ✓ A jelszavak egyeznek
            </p>
          )}
        </div>

        {message && (
          <div className={message.type === 'success' ? 'success-msg' : 'error-msg'}>
            {message.text}
          </div>
        )}

        <button type="submit" className="dash-btn-primary"
          style={{ width: 'auto', padding: '10px 28px' }} disabled={loading}>
          {loading ? 'Folyamatban...' : 'Jelszó módosítása'}
        </button>
      </form>
    </div>
  );
}

// ── Profil oldal ──────────────────────────────────────────────────
export default function DashboardProfile() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [stats, setStats] = useState({ quiz_count: 0, attempt_count: 0, total_plays: 0 });

  useEffect(() => {
    if (!user?.id) return;
    fetch(`http://localhost:5000/api/users/${user.id}/home-data`)
      .then(r => r.json())
      .then(d => { if (d.stats) setStats(d.stats); })
      .catch(() => {});
  }, []);

  if (!user) return null;

  const initials = (user.username || 'U').slice(0, 2).toUpperCase();

  const handleDeleteAccount = async () => {
    if (!window.confirm('Biztosan törölni szeretnéd a fiókodat?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/delete-account/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Fiókod sikeresen törölve.');
        localStorage.clear();
        navigate('/', { replace: true });
      } else {
        const data = await res.json();
        alert('Hiba: ' + data.message);
      }
    } catch {
      alert('Nem sikerült elérni a szervert!');
    }
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Profil</h2>
          <p className="page-sub">Fiókod adatainak kezelése.</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Bal panel */}
        <div className="profile-side">
          <div className="avatar-big">{initials}</div>
          <div className="profile-side-name">{user.username}</div>
          <div className="profile-side-email">{user.email || '—'}</div>
          <div className="profile-side-stats">
            <div className="pss-item">
              <span className="pss-val">{stats.quiz_count}</span>
              <span className="pss-lbl">Kvíz</span>
            </div>
            <div className="pss-item">
              <span className="pss-val">{stats.attempt_count}</span>
              <span className="pss-lbl">Kitöltés</span>
            </div>
            <div className="pss-item">
              <span className="pss-val">{stats.total_plays}</span>
              <span className="pss-lbl">Játékos</span>
            </div>
          </div>
        </div>

        {/* Jobb panel */}
        <div className="profile-main">
          <PasswordChangeCard userId={user.id} />

          <div className="profile-section-card danger-card">
            <h3 className="profile-section-title" style={{ color: 'var(--error)' }}>Veszélyes zóna</h3>
            <p className="profile-danger-text">
              A fiók törlése végleges és visszafordíthatatlan. Minden kvíz és adat elvész.
            </p>
            <button className="dash-btn-danger" onClick={handleDeleteAccount}>
              Fiók törlése
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
