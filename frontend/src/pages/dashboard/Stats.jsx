import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catColor } from './shared';

const pctColor = (pct) =>
  pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--gold)' : 'var(--error)';

// ── Kis segédkomponensek ────────────────────────────────────────

function SectionDivider({ icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      margin: '36px 0 24px',
      paddingBottom: 16,
      borderBottom: '1px solid var(--border-light)',
    }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <span className="stat-card-icon">{icon}</span>
      <span className="stat-card-value" style={color ? { color } : {}}>{value}</span>
      <span className="stat-card-label">{label}</span>
    </div>
  );
}

function EmptyHint({ text }) {
  return <p style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>{text}</p>;
}

// ── Havi bar chart (kitöltések + átlag%) ───────────────────────
function MonthlyChart({ monthly }) {
  const maxVal = Math.max(...monthly.map(b => b.val), 1);
  const hasAny = monthly.some(b => b.val > 0);
  if (!hasAny) return <EmptyHint text="Az elmúlt 6 hónapban nem volt kitöltés." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="bar-chart" style={{ alignItems: 'flex-end' }}>
        {monthly.map(b => (
          <div key={b.label} className="bar-col" style={{ position: 'relative' }}>
            <div className="bar-wrap" style={{ position: 'relative' }}>
              {/* Átlag% vonal jelzése a bar tetején */}
              {b.val > 0 && b.avg_pct !== null && (
                <div style={{
                  position: 'absolute', bottom: `${(b.val / maxVal) * 100}%`,
                  left: '50%', transform: 'translateX(-50%)',
                  fontSize: 9, color: pctColor(b.avg_pct),
                  fontWeight: 700, whiteSpace: 'nowrap',
                  marginBottom: 2,
                }}>
                  {b.avg_pct}%
                </div>
              )}
              <div
                className="bar-fill"
                style={{
                  height:     `${(b.val / maxVal) * 100}%`,
                  background: b.avg_pct !== null
                    ? pctColor(b.avg_pct)
                    : 'var(--gold)',
                }}
              />
            </div>
            <span className="bar-label">{b.label}</span>
            <span className="bar-val">{b.val}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
        Az oszlopok színe az adott havi átlageredményt tükrözi · 🟢 ≥80% · 🟡 ≥60% · 🔴 &lt;60%
      </p>
    </div>
  );
}

// ── Kategória teljesítmény-sor ──────────────────────────────────
function CatPerfRow({ category, avg_pct, best_pct, cnt, showBest = false }) {
  const col = catColor(category);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
      borderBottom: '1px solid var(--border-light)' }}>
      <span style={{
        minWidth: 10, height: 10, borderRadius: '50%',
        background: col, flexShrink: 0, display: 'inline-block',
      }} />
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
        {category}
      </span>
      {cnt !== undefined && (
        <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 52, textAlign: 'right' }}>
          {cnt}×
        </span>
      )}
      <div style={{ width: 100, height: 6, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${avg_pct}%`, background: pctColor(avg_pct), borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: pctColor(avg_pct), minWidth: 38, textAlign: 'right' }}>
        {avg_pct}%
      </span>
      {showBest && best_pct !== null && best_pct !== undefined && (
        <span style={{ fontSize: 11, color: 'var(--gold)', minWidth: 46, textAlign: 'right' }}>
          ▲{best_pct}%
        </span>
      )}
    </div>
  );
}

// ── Főkomponens ─────────────────────────────────────────────────
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

  if (loading) return (
    <div className="tab-content">
      <div className="stat-grid">
        {[1,2,3,4].map(i => (
          <div key={i} className="stat-card" style={{ opacity: 0.4 }}>
            <span className="stat-card-icon">⏳</span>
            <span className="stat-card-value">–</span>
            <span className="stat-card-label">Betöltés...</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="tab-content">
      <div className="error-msg" style={{ maxWidth: 480 }}>{error}</div>
    </div>
  );

  const { player_stats, monthly, category_performance, recent_attempts,
          creator_stats, own_quizzes, own_categories } = data;

  const maxPlays    = Math.max(...own_quizzes.map(q => q.play_count), 1);

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Statisztikák</h2>
          <p className="page-sub">Teljesítményed és kvízeid részletes adatai.</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          1. SZEKCIÓ – AZ ÉN EREDMÉNYEIM
      ══════════════════════════════════════════════════════════ */}
      <SectionDivider
        icon="🎓"
        title="Az én eredményeim"
        subtitle="Kitöltőként elért teljesítmény és statisztikák"
      />

      {/* Összesítő kártyák */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard icon="✅" value={player_stats.attempt_count}  label="Kitöltött kvízek" />
        <StatCard icon="🎯" value={(player_stats.avg_percentage ?? 0) + '%'} label="Átlagos eredmény"
          color={player_stats.avg_percentage ? pctColor(player_stats.avg_percentage) : undefined} />
        <StatCard icon="🏆" value={(player_stats.best_percentage ?? 0) + '%'} label="Legjobb eredmény"
          color={player_stats.best_percentage ? pctColor(player_stats.best_percentage) : undefined} />
        <StatCard icon="🌟" value={player_stats.success_count}  label="Sikeres teljesítés" color="var(--success)" />
      </div>

      {/* Havi kitöltések + Kategória átlagok */}
      <div className="stats-row">
        <div className="stats-panel">
          <h3 className="section-title">Kitöltések havonta</h3>
          <MonthlyChart monthly={monthly} />
        </div>

        <div className="stats-panel">
          <h3 className="section-title">Kategóriánkénti átlagom</h3>
          {category_performance.length === 0 ? (
            <EmptyHint text="Még nincs elég adat a kategóriánkénti kimutatáshoz." />
          ) : (
            <div>
              {category_performance.map(r => (
                <CatPerfRow
                  key={r.category}
                  category={r.category}
                  avg_pct={r.avg_pct}
                  best_pct={r.best_pct}
                  cnt={r.cnt}
                  showBest
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legutóbbi kitöltések */}
      <div className="section" style={{ marginTop: 8 }}>
        <h3 className="section-title" style={{ marginBottom: 12 }}>Legutóbbi kitöltéseim</h3>
        {recent_attempts.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <span className="empty-icon" style={{ fontSize: 26 }}>📋</span>
            <p>Még nem töltöttél ki egyetlen kvízt sem.</p>
            <button className="dash-btn-outline" style={{ marginTop: 8 }}
              onClick={() => navigate('/dashboard/explore')}>
              Kvízek böngészése
            </button>
          </div>
        ) : (
          <div className="result-list">
            {recent_attempts.map((a, i) => {
              const pct = a.percentage;
              return (
                <div key={a.id ?? i} className="result-row">
                  <div className="result-info">
                    <span className="result-name">{a.quiz_title}</span>
                    <span className="result-date">
                      {a.category || ''}
                      {a.finished_at
                        ? (a.category ? ' · ' : '') + new Date(a.finished_at).toLocaleDateString('hu-HU')
                        : ''}
                    </span>
                  </div>
                  <div className="result-right" style={{ gap: 8 }}>
                    <div className="pct-bar-wrap">
                      <div className="pct-bar" style={{ width: `${pct}%`, background: pctColor(pct) }} />
                    </div>
                    <span className="result-score" style={{ color: pctColor(pct) }}>
                      {pct}%
                      {a.is_successful === true  && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>✓</span>}
                      {a.is_successful === false && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--error)',   fontWeight: 700 }}>✗</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          2. SZEKCIÓ – SAJÁT KVÍZEIM STATISZTIKÁI
      ══════════════════════════════════════════════════════════ */}
      <SectionDivider
        icon="📝"
        title="Saját kvízeimről"
        subtitle="Létrehozóként – mennyien töltötték ki és milyen eredménnyel"
      />

      {/* Összesítő kártyák */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard icon="📝" value={creator_stats.quiz_count}  label="Létrehozott kvíz" />
        <StatCard icon="👥" value={creator_stats.total_plays} label="Összes kitöltés" />
        <StatCard
          icon="🎯"
          value={creator_stats.avg_score_pct !== null ? (creator_stats.avg_score_pct + '%') : '–'}
          label="Átlagos kitöltői eredmény"
          color={creator_stats.avg_score_pct ? pctColor(creator_stats.avg_score_pct) : undefined}
        />
        <StatCard
          icon="🌍"
          value={own_quizzes.filter(q => q.is_public).length}
          label="Nyilvános kvíz"
        />
      </div>

      {creator_stats.quiz_count === 0 ? (
        <div className="empty-state" style={{ padding: '28px 0' }}>
          <span className="empty-icon" style={{ fontSize: 32 }}>📝</span>
          <p>Még nem hoztál létre kvízt.</p>
          <button className="dash-btn-primary" style={{ marginTop: 10 }}
            onClick={() => navigate('/dashboard/create')}>
            + Kvíz létrehozása
          </button>
        </div>
      ) : (
        <>
          <div className="stats-row">
            {/* Legtöbbet kitöltött kvízek */}
            <div className="stats-panel" style={{ flex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="section-title" style={{ margin: 0 }}>Legtöbbet kitöltött kvízeim</h3>
                <button className="link-btn" onClick={() => navigate('/dashboard/quizzes')}>
                  Összes →
                </button>
              </div>
              {own_quizzes.length === 0 ? (
                <EmptyHint text="Még nem töltötte ki senki a kvízeidet." />
              ) : (
                <div className="result-list">
                  {own_quizzes.map(q => (
                    <div key={q.id} className="result-row" style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/dashboard/quizzes/${q.id}/stats`)}>
                      <div className="result-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="result-name">{q.title}</span>
                          {!q.is_public && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99,
                              background: 'rgba(200,169,110,0.15)', color: 'var(--gold)', fontWeight: 600 }}>
                              🔒
                            </span>
                          )}
                        </div>
                        <span className="result-date">
                          {q.category || '–'}
                          {` · ${q.question_count ?? 0} kérdés`}
                          {q.avg_score_pct !== null && ` · kitöltői átlag: ${q.avg_score_pct}%`}
                        </span>
                      </div>
                      <div className="result-right" style={{ gap: 8 }}>
                        <div className="pct-bar-wrap">
                          <div className="pct-bar" style={{
                            width: `${Math.min((q.play_count / maxPlays) * 100, 100)}%`,
                            background: 'var(--gold)',
                          }} />
                        </div>
                        <span className="result-score" style={{ color: 'var(--gold)', minWidth: 72, textAlign: 'right' }}>
                          {q.play_count} kitöltés
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kategória-bontás */}
            {own_categories.length > 0 && (
              <div className="stats-panel" style={{ flex: 1 }}>
                <h3 className="section-title">Kitöltések kategóriánként</h3>
                {own_categories.map(r => {
                  const col = catColor(r.category);
                  const maxCatPlays = Math.max(...own_categories.map(x => x.total_plays), 1);
                  return (
                    <div key={r.category} style={{ padding: '8px 0',
                      borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: col, fontWeight: 600 }}>{r.category}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {r.quiz_count} kvíz · {r.total_plays} kitöltés
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border-light)',
                          borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(r.total_plays / maxCatPlays) * 100}%`,
                            background: col, borderRadius: 99,
                          }} />
                        </div>
                        {r.avg_score_pct !== null && (
                          <span style={{ fontSize: 12, fontWeight: 700,
                            color: pctColor(r.avg_score_pct), minWidth: 38, textAlign: 'right' }}>
                            ⌀{r.avg_score_pct}%
                          </span>
                        )}
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
