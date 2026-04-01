import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAT_COLORS } from './shared';

export default function DashboardCreate() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [title,          setTitle]          = useState('');
  const [description,    setDescription]    = useState('');
  const [category,       setCategory]       = useState(Object.keys(CAT_COLORS)[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [timeLimit,      setTimeLimit]      = useState('');
  const [isPublic,       setIsPublic]       = useState(true);
  const [accessPassword, setAccessPassword] = useState('');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      return setError('A kvíz neve kötelező!');
    }
    if (!isPublic && !accessPassword.trim()) {
      return setError('Privát kvízhez meg kell adni a belépési jelszót!');
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id:        user?.id,
          title:           title.trim(),
          description:     description.trim() || null,
          category: category === 'Egyéb' ? (customCategory.trim() || 'Egyéb') : category,
          time_limit:      timeLimit ? parseInt(timeLimit) * 60 : null,
          is_public:       isPublic,
          access_password: !isPublic ? accessPassword.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.message);

      // Sikeres létrehozás → vissza a kvíz listára
      navigate('/dashboard/quizzes');
    } catch {
      setError('Nem sikerült elérni a szervert!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Új kvíz létrehozása</h2>
          <p className="page-sub">Add meg a kvíz alapadatait. Kérdéseket később adhatsz hozzá.</p>
        </div>
        <button className="dash-btn-outline" onClick={() => navigate('/dashboard/quizzes')}>
          ← Vissza
        </button>
      </div>

      <form className="create-card" onSubmit={handleSubmit}>

        {/* Cím */}
        <div className="field">
          <label>Kvíz neve <span style={{ color: 'var(--error)' }}>*</span></label>
          <input
            placeholder="pl. Magyar történelem alapjai"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Leírás */}
        <div className="field">
          <label>Leírás</label>
          <textarea
            className="field-textarea"
            placeholder="Rövid leírás a kvízről (nem kötelező)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Kategória + Időkorlát egy sorban */}
        <div className="create-row">
          <div className="field" style={{ flex: 1 }}>
            <label>Kategória</label>
            <select
              className="field-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {Object.keys(CAT_COLORS).map(c => <option key={c}>{c}</option>)}
              <option value="Egyéb">Egyéb</option>
            </select>
            {category === 'Egyéb' && (
              <input
                style={{ marginTop: 8 }}
                placeholder="Saját kategória neve"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
              />
            )}
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Időkorlát (perc)</label>
            <input
              type="number"
              min="1"
              max="120"
              placeholder="üresen = nincs"
              value={timeLimit}
              onChange={e => setTimeLimit(e.target.value)}
            />
          </div>
        </div>

        {/* Láthatóság */}
        <div className="field">
          <label>Láthatóság</label>
          <div className="visibility-toggle">
            <button
              type="button"
              className={`vis-btn ${isPublic ? 'active' : ''}`}
              onClick={() => setIsPublic(true)}
            >
              🌐 Nyilvános
            </button>
            <button
              type="button"
              className={`vis-btn ${!isPublic ? 'active' : ''}`}
              onClick={() => setIsPublic(false)}
            >
              🔒 Privát
            </button>
          </div>
          <p className="field-hint">
            {isPublic
              ? 'Bárki megtalálhatja és kitöltheti a kvízt.'
              : 'Csak jelszóval rendelkezők tölthetik ki.'}
          </p>
        </div>

        {/* Belépési jelszó – csak privát esetén */}
        {!isPublic && (
          <div className="field">
            <label>Belépési jelszó <span style={{ color: 'var(--error)' }}>*</span></label>
            <input
              type="text"
              placeholder="A kvíz kitöltéséhez szükséges jelszó"
              value={accessPassword}
              onChange={e => setAccessPassword(e.target.value)}
            />
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            type="submit"
            className="dash-btn-primary"
            style={{ width: 'auto', padding: '10px 28px' }}
            disabled={loading}
          >
            {loading ? 'Mentés...' : '✓ Kvíz létrehozása'}
          </button>
          <button
            type="button"
            className="dash-btn-outline"
            onClick={() => navigate('/dashboard/quizzes')}
          >
            Mégse
          </button>
        </div>

      </form>
    </div>
  );
}
