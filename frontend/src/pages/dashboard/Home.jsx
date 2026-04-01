import { useNavigate } from 'react-router-dom';
import { MOCK_STATS, MOCK_RECENT, MOCK_EXPLORE, QuizCard } from './shared';

export default function DashboardHome() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

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
      <div className="stat-grid">
        {MOCK_STATS.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-card-icon">{s.icon}</span>
            <span className="stat-card-value">{s.value}</span>
            <span className="stat-card-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Legutóbbi eredmények */}
      <div className="section">
        <h3 className="section-title">Legutóbbi eredményeid</h3>
        <div className="result-list">
          {MOCK_RECENT.map((r, i) => (
            <div key={i} className="result-row">
              <div className="result-info">
                <span className="result-name">{r.quiz}</span>
                <span className="result-date">{r.date}</span>
              </div>
              <div className="result-right">
                <div className="pct-bar-wrap">
                  <div className="pct-bar" style={{
                    width: `${r.pct}%`,
                    background: r.pct >= 80 ? 'var(--success)' : r.pct >= 60 ? 'var(--gold)' : 'var(--error)'
                  }} />
                </div>
                <span className="result-score">{r.score} — {r.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ajánlott kvízek */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Ajánlott kvízek</h3>
          <button className="link-btn" onClick={() => navigate('/dashboard/explore')}>Összes →</button>
        </div>
        <div className="quiz-grid">
          {MOCK_EXPLORE.slice(0, 3).map(q => (
            <QuizCard key={q.id} quiz={q} showAuthor />
          ))}
        </div>
      </div>
    </div>
  );
}
