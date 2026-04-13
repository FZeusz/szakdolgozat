import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAT_COLORS } from './shared';
import { PasswordInput } from '../../components/PasswordInput';

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
  const [oneAttempt,       setOneAttempt]       = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers,   setShuffleAnswers]   = useState(false);
  const [hideResults,      setHideResults]      = useState(false);

  const [passMode,       setPassMode]       = useState('none');
  const [passPercentage, setPassPercentage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim())
      return setError('A kvíz neve kötelező!');
    if (!isPublic && !accessPassword.trim())
      return setError('Privát kvízhez meg kell adni a belépési jelszót!');
    if (passMode === 'percentage' && (!passPercentage || isNaN(parseInt(passPercentage)) || parseInt(passPercentage) < 1 || parseInt(passPercentage) > 100))
      return setError('A százalékos küszöb 1 és 100 közé kell essen!');

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id:        user?.id,
          title:           title.trim(),
          description:     description.trim() || null,
          category:        category === 'Egyéb' ? (customCategory.trim() || 'Egyéb') : category,
          time_limit:      timeLimit ? parseInt(timeLimit) * 60 : null,
          is_public:       isPublic,
          access_password: !isPublic ? accessPassword.trim() : null,
          one_attempt:        oneAttempt,
          shuffle_questions: shuffleQuestions,
          shuffle_answers:   shuffleAnswers,
          hide_results:      hideResults,
          pass_score:        passMode === 'score' ? 1 : null,
          pass_percentage:   passMode === 'percentage' ? parseInt(passPercentage) : null,
          pass_mode:         passMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.message);

      navigate(`/dashboard/quizzes/${data.quiz.id}/edit`);
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
          <p className="page-sub">Add meg a kvíz alapadatait. Kérdéseket és pont alapú küszöböt később adhatsz meg.</p>
        </div>
        <button className="dash-btn-outline" onClick={() => navigate('/dashboard/quizzes')}>
          ← Vissza
        </button>
      </div>

      <form className="create-card" onSubmit={handleSubmit}>

        <div className="field">
          <label>Kvíz neve <span style={{ color: 'var(--error)' }}>*</span></label>
          <input placeholder="pl. Magyar történelem alapjai"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <label>Leírás</label>
          <textarea className="field-textarea" rows={3}
            placeholder="Rövid leírás a kvízről (nem kötelező)"
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="create-row">
          <div className="field" style={{ flex: 1 }}>
            <label>Kategória</label>
            <select className="field-select" value={category} onChange={e => setCategory(e.target.value)}>
              {Object.keys(CAT_COLORS).map(c => <option key={c}>{c}</option>)}
              <option value="Egyéb">Egyéb</option>
            </select>
            {category === 'Egyéb' && (
              <input style={{ marginTop: 8 }} placeholder="Saját kategória neve"
                value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
            )}
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Időkorlát (perc)</label>
            <input type="number" min="1" max="120" placeholder="üresen = nincs"
              value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
          </div>
        </div>

        {/* Láthatóság */}
        <div className="field">
          <label>Láthatóság</label>
          <div className="visibility-toggle">
            <button type="button" className={`vis-btn ${isPublic ? 'active' : ''}`}
              onClick={() => setIsPublic(true)}>🌐 Nyilvános</button>
            <button type="button" className={`vis-btn ${!isPublic ? 'active' : ''}`}
              onClick={() => setIsPublic(false)}>🔒 Privát</button>
          </div>
          <p className="field-hint">
            {isPublic ? 'Bárki megtalálhatja és kitöltheti a kvízt.'
                      : 'Csak jelszóval rendelkezők tölthetik ki.'}
          </p>
        </div>

        {/* Belépési jelszó – PasswordInput komponenssel, szem ikonnal */}
        {!isPublic && (
          <div className="field">
            <label>Belépési jelszó <span style={{ color: 'var(--error)' }}>*</span></label>
            <PasswordInput
              value={accessPassword}
              onChange={e => setAccessPassword(e.target.value)}
              placeholder="A kvíz kitöltéséhez szükséges jelszó"
            />
          </div>
        )}

        {/* Sikerességi küszöb */}
        <div className="field">
          <label>Sikerességi küszöb</label>
          <div className="visibility-toggle" style={{ flexWrap: 'wrap' }}>
            <button type="button" className={`vis-btn ${passMode === 'none' ? 'active' : ''}`}
              onClick={() => setPassMode('none')}>🚫 Nincs megadva</button>
            <button type="button" className={`vis-btn ${passMode === 'score' ? 'active' : ''}`}
              onClick={() => setPassMode('score')}>🏅 Pont alapján</button>
            <button type="button" className={`vis-btn ${passMode === 'percentage' ? 'active' : ''}`}
              onClick={() => setPassMode('percentage')}>📊 Százalék alapján</button>
          </div>
          <p className="field-hint" style={{ marginTop: 6 }}>
            {passMode === 'none' && 'Nem lesz sikeres/sikertelen értékelés, csak a pontokat és százalékokat mutatja a rendszer.'}
            {passMode === 'score' && (
              <span>
                A konkrét pont küszöböt a következő lépésben, a kérdések megadása után tudod beállítani.
                <span style={{ display: 'block', marginTop: 4, color: 'var(--gold)' }}>
                  💡 A küszöb beállítása a kérdésszerkesztő tetején lesz elérhető.
                </span>
              </span>
            )}
            {passMode === 'percentage' && 'Megadod, hány %-ot kell elérni a sikerhez.'}
          </p>
          {passMode === 'percentage' && (
            <div style={{ marginTop: 8 }}>
              <input type="number" min="1" max="100" placeholder="pl. 75 (%)"
                value={passPercentage} onChange={e => setPassPercentage(e.target.value)}
                style={{ maxWidth: 160 }} />
              <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--muted)' }}>% szükséges a sikerhez</span>
            </div>
          )}
        </div>

        {/* Beállítások */}
        <div className="field">
          <label>Beállítások</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <label className="qform-multi-row" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textAlign: 'left', padding: '10px 15px', margin: 0 }}>
              <input type="checkbox" checked={hideResults} onChange={() => setHideResults(!hideResults)}
                style={{ margin: 0, marginRight: 15, flexShrink: 0, width: 18, height: 18, cursor: 'pointer' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>Eredmény elrejtése kitöltő elől</span>
                {hideResults && (
                  <span style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    A kitöltő beküldés után nem látja az eredményt és a helyes válaszokat.
                  </span>
                )}
              </div>
            </label>

            <label className="qform-multi-row" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textAlign: 'left', padding: '10px 15px', margin: 0 }}>
              <input type="checkbox" checked={oneAttempt} onChange={() => setOneAttempt(!oneAttempt)}
                style={{ margin: 0, marginRight: 15, flexShrink: 0, width: 18, height: 18, cursor: 'pointer' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>Egyszeri kitöltés</span>
                {oneAttempt && (
                  <span style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    A kitöltő csak egyszer töltheti ki a kvízt.
                  </span>
                )}
              </div>
            </label>

            <label className="qform-multi-row" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textAlign: 'left', padding: '10px 15px', margin: 0 }}>
              <input type="checkbox" checked={shuffleQuestions} onChange={() => setShuffleQuestions(!shuffleQuestions)}
                style={{ margin: 0, marginRight: 15, flexShrink: 0, width: 18, height: 18, cursor: 'pointer' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>Kérdések sorrendje véletlenszerű</span>
                {shuffleQuestions && (
                  <span style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                    Minden kitöltésnél más sorrendben jelennek meg a kérdések.
                  </span>
                )}
              </div>
            </label>

            <label className="qform-multi-row" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textAlign: 'left', padding: '10px 15px', margin: 0 }}>
              <input type="checkbox" checked={shuffleAnswers} onChange={() => setShuffleAnswers(!shuffleAnswers)}
                style={{ margin: 0, marginRight: 15, flexShrink: 0, width: 18, height: 18, cursor: 'pointer' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>Válaszlehetőségek sorrendje véletlenszerű</span>
                {shuffleAnswers && (
                  <span style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                    Minden kitöltésnél más sorrendben jelennek meg a válaszok.
                  </span>
                )}
              </div>
            </label>

          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" className="dash-btn-primary"
            style={{ width: 'auto', padding: '10px 28px' }} disabled={loading}>
            {loading ? 'Mentés...' : '✓ Kvíz létrehozása'}
          </button>
          <button type="button" className="dash-btn-outline"
            onClick={() => navigate('/dashboard/quizzes')}>Mégse</button>
        </div>

      </form>
    </div>
  );
}
