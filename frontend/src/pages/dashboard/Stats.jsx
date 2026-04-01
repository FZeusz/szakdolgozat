import { MOCK_STATS, MOCK_MY_QUIZZES, catColor } from './shared';

export default function DashboardStats() {
  const bars = [
    { label: 'Jan', val: 2 }, { label: 'Feb', val: 5 },
    { label: 'Már', val: 3 }, { label: 'Ápr', val: 8 },
    { label: 'Máj', val: 6 }, { label: 'Jún', val: 0 },
  ];
  const maxVal = Math.max(...bars.map(b => b.val));

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Statisztikák</h2>
          <p className="page-sub">Teljesítményed és kvízeid részletes adatai.</p>
        </div>
      </div>

      <div className="stat-grid">
        {MOCK_STATS.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-card-icon">{s.icon}</span>
            <span className="stat-card-value">{s.value}</span>
            <span className="stat-card-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="stats-row">
        <div className="stats-panel">
          <h3 className="section-title">Kitöltések havonta</h3>
          <div className="bar-chart">
            {bars.map(b => (
              <div key={b.label} className="bar-col">
                <div className="bar-wrap">
                  <div className="bar-fill" style={{ height: maxVal ? `${(b.val / maxVal) * 100}%` : '0%' }} />
                </div>
                <span className="bar-label">{b.label}</span>
                <span className="bar-val">{b.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-panel">
          <h3 className="section-title">Kategóriánkénti átlag</h3>
          <div className="cat-perf-list">
            {[
              { cat: 'Tech', pct: 90 }, { cat: 'Szórakozás', pct: 90 },
              { cat: 'Nyelv', pct: 76 }, { cat: 'Tudomány', pct: 61 },
            ].map(r => (
              <div key={r.cat} className="cat-perf-row">
                <span className="cat-perf-name" style={{ color: catColor(r.cat) }}>{r.cat}</span>
                <div className="pct-bar-wrap flex1">
                  <div className="pct-bar" style={{ width: `${r.pct}%`, background: catColor(r.cat) }} />
                </div>
                <span className="cat-perf-pct">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">Saját kvízek forgalma</h3>
        <div className="result-list">
          {MOCK_MY_QUIZZES.map(q => (
            <div key={q.id} className="result-row">
              <div className="result-info">
                <span className="result-name">{q.title}</span>
                <span className="result-date">{q.category}</span>
              </div>
              <div className="result-right">
                <div className="pct-bar-wrap">
                  <div className="pct-bar" style={{ width: `${Math.min(q.plays / 2.5, 100)}%`, background: 'var(--gold)' }} />
                </div>
                <span className="result-score">{q.plays} kitöltés</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
