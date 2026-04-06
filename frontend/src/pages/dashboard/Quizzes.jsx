import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catColor } from './shared';

export default function DashboardQuizzes() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const loadQuizzes = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/my/${user?.id}`);
      if (!res.ok) throw new Error();
      setQuizzes(await res.json());
    } catch { setError('Nem sikerült betölteni a kvízeket.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { loadQuizzes(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Biztosan törlöd a következő kvízt?\n„${title}"`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch { alert('Törlés sikertelen, próbáld újra!'); }
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Saját kvízeim</h2>
          <p className="page-sub">Kvízeid kezelése és szerkesztése.</p>
        </div>
        <button className="dash-btn-primary" onClick={() => navigate('/dashboard/create')}>
          + Új kvíz
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          <span className="empty-icon">⏳</span><p>Betöltés...</p>
        </div>
      )}

      {!loading && error && (
        <div className="error-msg" style={{ maxWidth: 480 }}>
          {error}
          <button className="link-btn" style={{ marginLeft: 12 }} onClick={loadQuizzes}>
            Újrapróbálás
          </button>
        </div>
      )}

      {!loading && !error && quizzes.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>Még nincs kvíze. Hozz létre egyet!</p>
          <button className="dash-btn-primary" onClick={() => navigate('/dashboard/create')}>
            Kvíz létrehozása
          </button>
        </div>
      )}

      {!loading && !error && quizzes.length > 0 && (
        <div className="my-quiz-list">
          {quizzes.map(q => (
            <div key={q.id} className="my-quiz-row">
              <div className="my-quiz-left">
                {q.category && (
                  <span className="cat-badge"
                    style={{ background: catColor(q.category) + '22', color: catColor(q.category) }}>
                    {q.category}
                  </span>
                )}
                <div>
                  <div className="my-quiz-title">{q.title}</div>
                  <div className="my-quiz-meta">
                    {q.is_public ? '🌐 Nyilvános' : '🔒 Privát'}
                    {q.one_attempt ? ' · 1️⃣ Egyszer tölthető' : ''}
                    {q.time_limit ? ` · ⏱ ${Math.round(q.time_limit / 60)} perc` : ''}
                    {` · ${q.question_count ?? 0} kérdés`}
                    {` · ${q.play_count ?? 0} kitöltés`}
                    {' · '}
                    {new Date(q.created_at).toLocaleDateString('hu-HU')}
                  </div>
                </div>
              </div>

              <div className="my-quiz-actions">
                {/* Szerkesztés */}
                <button className="icon-btn" title="Kérdések szerkesztése"
                  onClick={() => navigate(`/dashboard/quizzes/${q.id}/edit`)}>
                  ✏️
                </button>

                {/* Statisztikák */}
                <button className="icon-btn" title="Statisztikák megtekintése"
                  onClick={() => navigate(`/dashboard/quizzes/${q.id}/stats`)}>
                  📊
                </button>

                {/* Megosztási kód (privát) */}
                {!q.is_public && q.share_code && (
                  <button className="icon-btn share-code-btn"
                    title={`Megosztási kód: ${q.share_code} – kattints a másoláshoz`}
                    onClick={() => {
                      navigator.clipboard.writeText(q.share_code);
                      alert(`Kód másolva: ${q.share_code}\n\nOszd meg azokkal, akiknek hozzáférést szeretnél adni.`);
                    }}>
                    🔑 <span className="share-code-text">{q.share_code}</span>
                  </button>
                )}

                {/* Törlés */}
                <button className="icon-btn" title="Törlés"
                  onClick={() => handleDelete(q.id, q.title)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
