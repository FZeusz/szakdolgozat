import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catColor } from './shared';

const pctColor = (p) => p >= 80 ? 'var(--success)' : p >= 60 ? 'var(--gold)' : 'var(--error)';

export default function DashboardHome() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    Promise.all([
      fetch(`http://localhost:5000/api/users/${user.id}/home-data`).then(r => r.json()),
      fetch(`http://localhost:5000/api/quizzes/public/${user.id}`).then(r => r.json()),
    ]).then(([homeData, pubQuizzes]) => {
      if (homeData.stats)          setStats(homeData.stats);
      if (homeData.recent_attempts) setRecent(homeData.recent_attempts);
      if (Array.isArray(pubQuizzes)) setQuizzes(pubQuizzes.slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = stats ? [
    { icon: '📝', value: stats.quiz_count,     label: 'Létrehozott kvízek' },
    { icon: '✅', value: stats.attempt_count,  label: 'Kitöltött kvízek'  },
    { icon: '👥', value: stats.total_plays,    label: 'Összes játékos'    },
    { icon: '🎯', value: (stats.avg_percentage ?? 0) + '%', label: 'Átlagos eredmény' },
  ] : [];

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Üdv, {user?.username || 'Felhasználó'}! 👋</h2>
          <p className="page-sub">Folytasd ahol abbahagytad, vagy fedezz fel valami újat.</p>
        </div>
        <button className="dash-btn-primary" onClick={() => navigate('/dashboard/create')}>
          + Új kvíz létrehozása
        </button>
      </div>

      {/* Stat kártyák */}
      {loading ? (
        <div className="stat-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card" style={{ opacity: 0.4 }}>
              <span className="stat-card-icon">⏳</span>
              <span className="stat-card-value">–</span>
              <span className="stat-card-label">Betöltés...</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="stat-grid">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-card-icon">{s.icon}</span>
              <span className="stat-card-value">{s.value}</span>
              <span className="stat-card-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legutóbbi eredmények */}
      <div className="section">
        <h3 className="section-title">Legutóbbi eredményeid</h3>
        {!loading && recent.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <span className="empty-icon" style={{ fontSize: 28 }}>📋</span>
            <p>Még nem töltöttél ki egyetlen kvízt sem.</p>
            <button className="dash-btn-outline" style={{ marginTop: 8 }}
              onClick={() => navigate('/dashboard/explore')}>
              Kvízek böngészése
            </button>
          </div>
        ) : (
          <div className="result-list">
            {recent.map((r, i) => (
              <div key={i} className="result-row">
                <div className="result-info">
                  <span className="result-name">{r.quiz_title}</span>
                  <span className="result-date">
                    {r.category || ''}
                    {r.finished_at
                      ? (r.category ? ' · ' : '') + new Date(r.finished_at).toLocaleDateString('hu-HU')
                      : ''}
                  </span>
                </div>
                <div className="result-right">
                  <div className="pct-bar-wrap">
                    <div className="pct-bar" style={{
                      width: `${r.percentage}%`,
                      background: pctColor(r.percentage),
                    }} />
                  </div>
                  <span className="result-score" style={{ color: pctColor(r.percentage) }}>
                    {r.score} / {r.total_questions} — {r.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ajánlott kvízek */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Ajánlott kvízek</h3>
          <button className="link-btn" onClick={() => navigate('/dashboard/explore')}>Összes →</button>
        </div>
        {!loading && quizzes.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Jelenleg nincs más felhasználó által létrehozott nyilvános kvíz.
          </p>
        ) : (
          <div className="quiz-grid">
            {quizzes.map(q => {
              const color = catColor(q.category);
              return (
                <div key={q.id} className="quiz-card">
                  <div className="quiz-card-top">
                    {q.category && (
                      <span className="cat-badge" style={{ background: color + '22', color }}>
                        {q.category}
                      </span>
                    )}
                  </div>
                  <div className="quiz-card-title">{q.title}</div>
                  {q.description && <div className="quiz-card-desc">{q.description}</div>}
                  <div className="quiz-card-meta">
                    <span>📋 {q.question_count ?? 0} kérdés</span>
                    {q.play_count > 0 && <span>▶ {q.play_count} kitöltés</span>}
                  </div>
                  <div className="quiz-card-author">@{q.owner_name}</div>
                  <button className="dash-btn-outline quiz-card-btn"
                    onClick={() => navigate(`/quiz/${q.id}`)}>
                    Kitöltés →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
