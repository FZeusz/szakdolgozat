import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catColor } from './shared';

const pctColor = (p) => p >= 80 ? 'var(--success)' : p >= 60 ? 'var(--gold)' : 'var(--error)';

export default function DashboardStats() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetch(`http://localhost:5000/api/users/${user.id}/stats-data`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setData(d))
      .catch(() => setError('Nem sikerült betölteni a statisztikákat.'))
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = data ? [
    { icon: '📝', value: data.stats.quiz_count,     label: 'Létrehozott kvízek' },
    { icon: '✅', value: data.stats.attempt_count,  label: 'Kitöltött kvízek'  },
    { icon: '👥', value: data.stats.total_plays,    label: 'Összes játékos'    },
    { icon: '🎯', value: (data.stats.avg_percentage ?? 0) + '%', label: 'Átlagos eredmény' },
  ] : [];

  const maxMonthly = data ? Math.max(...data.monthly.map(b => b.val), 1) : 1;

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Statisztikák</h2>
          <p className="page-sub">Teljesítményed és kvízeid részletes adatai.</p>
        </div>
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
      ) : error ? (
        <div className="error-msg" style={{ maxWidth: 480 }}>{error}</div>
      ) : (
        <>
          <div className="stat-grid">
            {STAT_CARDS.map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-card-icon">{s.icon}</span>
                <span className="stat-card-value">{s.value}</span>
                <span className="stat-card-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="stats-row">
            {/* Havi kitöltések */}
            <div className="stats-panel">
              <h3 className="section-title">Kitöltések havonta</h3>
              {data.monthly.every(b => b.val === 0) ? (
                <p style={{ color: 'var(--muted)', fontSize: 13, paddingTop: 8 }}>
                  Az elmúlt 6 hónapban nem volt kitöltés.
                </p>
              ) : (
                <div className="bar-chart">
                  {data.monthly.map(b => (
                    <div key={b.label} className="bar-col">
                      <div className="bar-wrap">
                        <div className="bar-fill"
                          style={{ height: `${(b.val / maxMonthly) * 100}%` }} />
                      </div>
                      <span className="bar-label">{b.label}</span>
                      <span className="bar-val">{b.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kategóriánkénti átlag */}
            <div className="stats-panel">
              <h3 className="section-title">Kategóriánkénti átlagod</h3>
              {data.category_performance.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13, paddingTop: 8 }}>
                  Még nincs elég adat a kategóriánkénti kimutatáshoz.
                </p>
              ) : (
                <div className="cat-perf-list">
                  {data.category_performance.map(r => {
                    const col = catColor(r.category);
                    return (
                      <div key={r.category} className="cat-perf-row">
                        <span className="cat-perf-name" style={{ color: col }}>
                          {r.category}
                        </span>
                        <div className="pct-bar-wrap flex1">
                          <div className="pct-bar"
                            style={{ width: `${r.avg_pct}%`, background: col }} />
                        </div>
                        <span className="cat-perf-pct" style={{ color: pctColor(r.avg_pct) }}>
                          {r.avg_pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Saját kvízek forgalma */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Saját kvízek forgalma</h3>
              <button className="link-btn" onClick={() => navigate('/dashboard/quizzes')}>
                Kezelés →
              </button>
            </div>
            {data.own_quizzes.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <span className="empty-icon" style={{ fontSize: 28 }}>📝</span>
                <p>Még nem hoztál létre kvízt.</p>
                <button className="dash-btn-primary" style={{ marginTop: 8 }}
                  onClick={() => navigate('/dashboard/create')}>
                  Kvíz létrehozása
                </button>
              </div>
            ) : (
              <div className="result-list">
                {data.own_quizzes.map(q => {
                  const maxPlays = Math.max(...data.own_quizzes.map(x => x.play_count), 1);
                  return (
                    <div key={q.id} className="result-row">
                      <div className="result-info">
                        <span className="result-name">{q.title}</span>
                        <span className="result-date">
                          {q.category || '–'}
                          {` · ${q.question_count ?? 0} kérdés`}
                        </span>
                      </div>
                      <div className="result-right">
                        <div className="pct-bar-wrap">
                          <div className="pct-bar" style={{
                            width: `${Math.min((q.play_count / maxPlays) * 100, 100)}%`,
                            background: 'var(--gold)',
                          }} />
                        </div>
                        <span className="result-score">
                          {q.play_count} kitöltés
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
