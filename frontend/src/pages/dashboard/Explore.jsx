import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catColor } from './shared';

// ── Kvíz kártya ───────────────────────────────────────────────────
function ExploreCard({ quiz, onPlay }) {
  const color = catColor(quiz.category);
  return (
    <div className="quiz-card">
      <div className="quiz-card-top">
        {quiz.category && (
          <span className="cat-badge" style={{ background: color + '22', color }}>
            {quiz.category}
          </span>
        )}
        {quiz.is_public === false && (
          <span className="cat-badge" style={{ background: 'rgba(120,80,200,0.12)', color: '#7850c8' }}>
            🔒 Privát
          </span>
        )}
      </div>
      <div className="quiz-card-title">{quiz.title}</div>
      {quiz.description && (
        <div className="quiz-card-desc">{quiz.description}</div>
      )}
      <div className="quiz-card-meta">
        <span>📋 {quiz.question_count ?? '?'} kérdés</span>
        {quiz.time_limit ? <span>⏱ {Math.round(quiz.time_limit / 60)} perc</span> : <span>⏱ Szabad</span>}
        {quiz.play_count > 0 && <span>▶ {quiz.play_count} kitöltés</span>}
      </div>
      <div className="quiz-card-author">@{quiz.owner_name}</div>
      <button className="dash-btn-outline quiz-card-btn" onClick={onPlay}>Kitöltés →</button>
    </div>
  );
}

// ── Fő komponens ──────────────────────────────────────────────────
export default function DashboardExplore() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [quizzes,   setQuizzes]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('Összes');

  const [shareCode,   setShareCode]   = useState('');
  const [foundQuiz,   setFoundQuiz]   = useState(null);
  const [findLoading, setFindLoading] = useState(false);
  const [findError,   setFindError]   = useState('');
  const [findSuccess, setFindSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/public/${user?.id}`);
        if (!res.ok) throw new Error();
        setQuizzes(await res.json());
      } catch { setError('Nem sikerült betölteni a kvízeket.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const cats = ['Összes', ...new Set(quizzes.map(q => q.category).filter(Boolean))];
  const filtered = quizzes.filter(q =>
    (catFilter === 'Összes' || q.category === catFilter) &&
    (q.title.toLowerCase().includes(search.toLowerCase()) ||
     (q.description || '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleFindPrivate = async (e) => {
    e.preventDefault();
    if (!shareCode.trim()) return;
    setFindError(''); setFoundQuiz(null); setFindSuccess(false); setFindLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/find/${shareCode.trim()}`);
      const data = await res.json();
      if (!res.ok) return setFindError(data.message);
      setFoundQuiz(data); setFindSuccess(true);
    } catch { setFindError('Nem sikerült elérni a szervert!'); }
    finally { setFindLoading(false); }
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Felfedezés</h2>
          <p className="page-sub">Böngéssz mások nyilvános kvízei között, vagy keress privát kvízt kóddal.</p>
        </div>
      </div>

      {/* Privát kvíz keresés */}
      <div className="private-find-box">
        <div className="private-find-header">
          <span className="private-find-icon">🔒</span>
          <div>
            <div className="private-find-title">Privát kvíz megnyitása</div>
            <div className="private-find-sub">Ha valaki megosztott veled egy kvízt, add meg a kódját.</div>
          </div>
        </div>
        <form className="private-find-form" onSubmit={handleFindPrivate}>
          <input
            className="search-input"
            style={{ maxWidth: 220, fontFamily: 'monospace', letterSpacing: '0.08em' }}
            placeholder="pl. xK3mP9qR"
            value={shareCode}
            onChange={e => setShareCode(e.target.value)}
            maxLength={8}
          />
          <button type="submit" className="dash-btn-primary"
            style={{ width: 'auto', padding: '10px 22px' }}
            disabled={findLoading || !shareCode.trim()}>
            {findLoading ? '...' : 'Keresés'}
          </button>
        </form>
        {findError && <div className="error-msg" style={{ marginTop: 10 }}>{findError}</div>}
        {findSuccess && foundQuiz && (
          <div className="private-find-result">
            <ExploreCard quiz={foundQuiz} onPlay={() => navigate(`/quiz/${foundQuiz.id}`)} />
          </div>
        )}
      </div>

      <div className="divider" style={{ margin: '28px 0 24px' }}>
        <span>Nyilvános kvízek</span>
      </div>

      <div className="explore-filters">
        <input className="search-input" placeholder="🔍  Keresés cím vagy leírás alapján..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="cat-filters">
          {cats.map(c => (
            <button key={c} className={`cat-btn ${catFilter === c ? 'active' : ''}`}
              onClick={() => setCatFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      {loading && <div className="empty-state"><span className="empty-icon">⏳</span><p>Betöltés...</p></div>}
      {!loading && error && <div className="error-msg" style={{ maxWidth: 480 }}>{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <p>{search || catFilter !== 'Összes' ? 'Nincs találat.' : 'Még nincs nyilvános kvíz más felhasználóktól.'}</p>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="quiz-grid">
          {filtered.map(q => <ExploreCard key={q.id} quiz={q} onPlay={() => navigate(`/quiz/${q.id}`)} />)}
        </div>
      )}
    </div>
  );
}
