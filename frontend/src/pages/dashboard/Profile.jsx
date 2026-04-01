import { useState } from 'react';
import { MOCK_MY_QUIZZES } from './shared';
import { useNavigate } from 'react-router-dom'; // <--- Ezt pótold az importoknál!

// ── Jelszó módosítás form ─────────────────────────────────────────
function PasswordChangeCard({ userId }) {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [message,  setMessage]  = useState(null); // { text, type: 'success'|'error' }
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Kliens oldali validáció
    if (!current || !next || !confirm) {
      return setMessage({ text: 'Minden mező kitöltése kötelező!', type: 'error' });
    }
    if (next.length < 6) {
      return setMessage({ text: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie!', type: 'error' });
    }
    if (next !== confirm) {
      return setMessage({ text: 'A két új jelszó nem egyezik!', type: 'error' });
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:          userId,
          currentPassword: current,
          newPassword:     next,
        }),
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
        <div className="field">
          <label>Jelenlegi jelszó</label>
          <input
            type="password"
            placeholder="••••••••"
            value={current}
            onChange={e => setCurrent(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Új jelszó</label>
          <input
            type="password"
            placeholder="Legalább 6 karakter"
            value={next}
            onChange={e => setNext(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Új jelszó megerősítése</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </div>

        {message && (
          <div className={message.type === 'success' ? 'success-msg' : 'error-msg'}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          className="dash-btn-primary"
          style={{ width: 'auto', padding: '10px 28px' }}
          disabled={loading}
        >
          {loading ? 'Folyamatban...' : 'Jelszó módosítása'}
        </button>
      </form>
    </div>
  );
}

export default function DashboardProfile() {
  const navigate = useNavigate();
  
  // JSON.parse(null) nem hiba, de ha a user null, a .username már az lenne
  const user = (() => { 
    try { 
      return JSON.parse(localStorage.getItem('user')); 
    } catch { return null; } 
  })();

  // Ha nincs user (pl. épp töröltük), ne is próbáljuk renderelni a többit
  if (!user) return null; 

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();
  const email = user?.email || '—';

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Biztosan törölni szeretnéd a fiókodat?");
    if (!confirmed) return;

    try {
      // Érdemes 127.0.0.1-et használni localhost helyett, ha bizonytalan a kapcsolat
      const res = await fetch(`http://localhost:5000/api/delete-account/${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // FONTOS: Előbb navigálunk, és csak utána takarítunk!
        // Vagy fordítva, de a lényeg, hogy a state ne zavarodjon össze
        alert("Fiókod sikeresen törölve.");
        
        localStorage.clear(); // Minden adatot törlünk (theme, user stb. - vagy csak a user-t)
        navigate('/', { replace: true }); // A replace: true miatt nem tud a "vissza" gombbal visszajönni
      } else {
        const data = await res.json();
        alert("Hiba: " + data.message);
      }
    } catch (err) {
      // Csak akkor dobunk hibát, ha tényleg NEM sikerült a törlés
      // Ha a hiba csak a navigáció közben van, azt elnyomjuk
      console.error("Törlési hiba:", err);
      if (localStorage.getItem('user')) { 
          alert("Nem sikerült elérni a szervert a törléshez!");
      }
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
        {/* Bal panel – avatar + gyors infók */}
        <div className="profile-side">
          <div className="avatar-big">{initials}</div>
          <div className="profile-side-name">{user?.username || 'Felhasználó'}</div>
          <div className="profile-side-email">{email}</div>
          <div className="profile-side-stats">
            <div className="pss-item">
              <span className="pss-val">{MOCK_MY_QUIZZES.length}</span>
              <span className="pss-lbl">Kvíz</span>
            </div>
            <div className="pss-item">
              <span className="pss-val">24</span>
              <span className="pss-lbl">Kitöltés</span>
            </div>
            <div className="pss-item">
              <span className="pss-val">451</span>
              <span className="pss-lbl">Játékos</span>
            </div>
          </div>
        </div>

        {/* Jobb panel */}
        <div className="profile-main">

          <PasswordChangeCard userId={user?.id} />

          <div className="profile-section-card danger-card">
            <h3 className="profile-section-title" style={{ color: 'var(--error)' }}>Veszélyes zóna</h3>
            <p className="profile-danger-text">
              A fiók törlése végleges és visszafordíthatatlan. Minden kvíz és adat elvész.
            </p>
            <button 
              className="dash-btn-danger" 
              onClick={handleDeleteAccount} // <--- Ezt kötöttük be most
            >
              Fiók törlése
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
