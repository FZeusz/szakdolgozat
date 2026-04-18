import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catColor } from './shared';

const pctColor = (pct) => {
  return pct >= 80 ? 'var(--success)' :
         pct >= 60 ? 'var(--good)' :
         pct >= 40 ? 'var(--neutral)' :
         pct >= 20 ? 'var(--warning)' :
                     'var(--error)';
};

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

function StatCard({ icon, value, label, color, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-card-icon">{icon}</span>
      <span className="stat-card-value" style={color ? { color } : {}}>{value}</span>
      <span className="stat-card-label">{label}</span>
      {sub && (
        <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</span>
      )}
    </div>
  );
}

function EmptyHint({ text }) {
  return <p style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>{text}</p>;
}

// ── Újrafelhasználható toggle gomb ─────────────────────────────
function ToggleBtn({ onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 15, padding: '2px 4px', borderRadius: 6,
        opacity: 0.7, transition: 'opacity .15s', color: 'var(--text)',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = 1}
      onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
    >
      🔄
    </button>
  );
}

// ── Kategória jelzés (pont + színes szöveg) ────────────────────
// Újrafelhasználható: result-date-n belül mindenütt ugyanígy néz ki
function CatLabel({ category }) {
  if (!category) return null;
  const col = catColor(category);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        display: 'inline-block', width: 8, height: 8,
        borderRadius: '50%', background: col, flexShrink: 0,
      }} />
      <span style={{ color: col, fontWeight: 500 }}>{category}</span>
    </span>
  );
}

// ── Havi bar chart (kitöltések + átlag%) ───────────────────────
function MonthlyChart({ monthly }) {
  const maxVal = Math.max(...monthly.map(b => b.val), 1);
  const hasAny = monthly.some(b => b.val > 0);
  if (!hasAny) return <EmptyHint text="Az elmúlt 6 hónapban nem volt kitöltés." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="bar-chart" style={{ alignItems: 'flex-end', minHeight: 160 }}>
        {monthly.map(b => (
          <div key={b.label} className="bar-col" style={{ position: 'relative' }}>
            <div className="bar-wrap" style={{ position: 'relative' }}>
              <div
                className="bar-fill"
                style={{
                  height:     `${(b.val / maxVal) * 100}%`,
                  background: b.avg_pct !== null ? pctColor(b.avg_pct) : 'var(--gold)',
                }}
              />
            </div>
            <span className="bar-label">{b.label}</span>
            <span className="bar-val">
              {b.val > 0 ? b.val : 0}
              {b.val > 0 && b.avg_pct !== null && (
                <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: pctColor(b.avg_pct) }}>
                  {b.avg_pct}%
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
        Az oszlopok színe és a szám melletti % az adott havi átlageredményt tükrözi
      </p>
    </div>
  );
}

// ── Kategória teljesítmény-sor (kitöltőként) ───────────────────
function CatPerfRow({ category, avg_pct, cnt, maxCnt, sortBy }) {
  const col      = catColor(category);
  const barWidth = sortBy === 'cnt'
    ? (maxCnt > 0 ? (cnt / maxCnt) * 100 : 0)
    : avg_pct;
  const barColor = sortBy === 'cnt' ? col : pctColor(avg_pct);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 0', borderBottom: '1px solid var(--border-light)',
    }}>
      <span style={{
        minWidth: 10, height: 10, borderRadius: '50%',
        background: col, flexShrink: 0, display: 'inline-block',
      }} />
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
        {category}
      </span>
      {sortBy === 'pct' ? (
        <span style={{ fontSize: 13, fontWeight: 700, color: col, minWidth: 38, textAlign: 'right' }}>
          {cnt}×
        </span>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: pctColor(avg_pct), minWidth: 36, textAlign: 'right' }}>
          {avg_pct}%
        </span>
      )}
      <div style={{ width: 100, height: 6, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: barColor, borderRadius: 99 }} />
      </div>
      {sortBy === 'pct' ? (
        <span style={{ fontSize: 13, fontWeight: 700, color: pctColor(avg_pct), minWidth: 38, textAlign: 'right' }}>
          {avg_pct}%
        </span>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: col, minWidth: 38, textAlign: 'right' }}>
          {cnt}×
        </span>
      )}
    </div>
  );
}

// ── Saját kategória-sor (létrehozóként) ────────────────────────
function OwnCatRow({ category, quiz_count, total_plays, avg_score_pct, maxPlays, sortBy }) {
  const col      = catColor(category);
  const barWidth = sortBy === 'plays'
    ? (maxPlays > 0 ? (total_plays / maxPlays) * 100 : 0)
    : (avg_score_pct !== null ? avg_score_pct : 0);
  const barColor = sortBy === 'plays' ? col : pctColor(avg_score_pct ?? 0);

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: col, fontWeight: 600 }}>{category}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {quiz_count} kvíz
          {sortBy === 'plays'
            ? (avg_score_pct !== null ? ` · ${avg_score_pct}%` : '')
            : ` · ${total_plays} kitöltés`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barWidth}%`, background: barColor, borderRadius: 99 }} />
        </div>
        {sortBy === 'plays' ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: col, minWidth: 38, textAlign: 'right' }}>
            {total_plays}×
          </span>
        ) : (
          avg_score_pct !== null && (
            <span style={{ fontSize: 12, fontWeight: 700, color: pctColor(avg_score_pct), minWidth: 38, textAlign: 'right' }}>
              {avg_score_pct}%
            </span>
          )
        )}
      </div>
    </div>
  );
}

// ── Streak segédfüggvények ─────────────────────────────────────
function streakLabel(days) {
  if (days === 0) return 'Nincs aktív széria';
  if (days === 1) return '1 napos széria';
  return `${days} napos széria`;
}
function streakColor(days) {
  if (days === 0) return 'var(--muted)';
  if (days < 3)  return 'var(--warning)';
  if (days < 7)  return 'var(--good)';
  return 'var(--success)';
}

const CAT_ROW_HEIGHT = 37;
const CAT_VISIBLE    = 5;

// ── Főkomponens ─────────────────────────────────────────────────
export default function DashboardStats() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [catSortBy,    setCatSortBy]    = useState('pct');
  const [ownCatSortBy, setOwnCatSortBy] = useState('plays');

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

  const maxPlays       = Math.max(...own_quizzes.map(q => q.play_count), 1);
  const streakDays     = player_stats.streak_days ?? 0;
  const totalQuestions = own_quizzes.reduce((sum, q) => sum + (q.question_count ?? 0), 0);

  const sortedCategories = [...category_performance].sort((a, b) =>
    catSortBy === 'cnt' ? b.cnt - a.cnt : b.avg_pct - a.avg_pct
  );
  const maxCnt = Math.max(...category_performance.map(r => r.cnt), 1);

  const sortedOwnCats = [...own_categories].sort((a, b) =>
    ownCatSortBy === 'plays'
      ? b.total_plays - a.total_plays
      : (b.avg_score_pct ?? 0) - (a.avg_score_pct ?? 0)
  );
  const maxOwnPlays = Math.max(...own_categories.map(r => r.total_plays), 1);

  const catListMaxHeight = CAT_ROW_HEIGHT * CAT_VISIBLE;

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

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard
          icon={streakDays > 0 ? '🔥' : '💤'}
          value={streakDays}
          label="Aktív széria (nap)"
          color={streakColor(streakDays)}
          sub={streakLabel(streakDays)}
        />
        <StatCard icon="✅" value={player_stats.attempt_count} label="Kitöltött kvízek" />
        <StatCard icon="🌟" value={player_stats.success_count} label="Sikeres teljesítés" color="var(--success)" />
        <StatCard
          icon="🎯"
          value={(player_stats.avg_percentage ?? 0) + '%'}
          label="Átlagos eredmény"
          color={player_stats.avg_percentage ? pctColor(player_stats.avg_percentage) : undefined}
        />
      </div>

      <div className="stats-row" style={{ alignItems: 'stretch' }}>
        <div className="stats-panel">
          <h3 className="section-title">Kitöltések havonta</h3>
          <MonthlyChart monthly={monthly} />
        </div>

        <div className="stats-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 className="section-title" style={{ margin: 0 }}>Kategóriánkénti átlagom</h3>
            {category_performance.length > 0 && (
              <ToggleBtn
                onClick={() => setCatSortBy(s => s === 'pct' ? 'cnt' : 'pct')}
                title={catSortBy === 'pct' ? 'Váltás: kitöltések szerinti sorrend' : 'Váltás: eredmény szerinti sorrend'}
              />
            )}
          </div>
          {category_performance.length > 0 && (
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
              {catSortBy === 'pct'
                ? 'Rendezve: átlagos eredmény szerint (csökkenő)'
                : 'Rendezve: kitöltések száma szerint (csökkenő)'}
            </p>
          )}
          {category_performance.length === 0 ? (
            <EmptyHint text="Még nincs elég adat a kategóriánkénti kimutatáshoz." />
          ) : (
            <>
              <div style={{
                maxHeight: catListMaxHeight, overflowY: 'auto', overflowX: 'hidden',
                scrollbarWidth: 'thin', scrollbarColor: 'var(--border-light) transparent',
              }}>
                {sortedCategories.map(r => (
                  <CatPerfRow
                    key={r.category}
                    category={r.category}
                    avg_pct={r.avg_pct}
                    cnt={r.cnt}
                    maxCnt={maxCnt}
                    sortBy={catSortBy}
                  />
                ))}
              </div>
              {sortedCategories.length > CAT_VISIBLE && (
                <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 6 }}>
                  ↕ {sortedCategories.length - CAT_VISIBLE} további kategória görgetéssel
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Legutóbbi kitöltések ── */}
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
            {recent_attempts.map((r, i) => (
              <div key={r.id ?? i} className="result-row">
                <div className="result-info">
                  <span className="result-name">{r.quiz_title}</span>
                  <span className="result-date" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {r.category && <CatLabel category={r.category} />}
                    {r.finished_at && (
                      <span style={{ color: 'var(--muted)' }}>
                        {r.category ? '· ' : ''}{new Date(r.finished_at).toLocaleDateString('hu-HU')}
                      </span>
                    )}
                  </span>
                </div>
                <div className="result-right">
                  <div className="pct-bar-wrap">
                    <div className="pct-bar" style={{ width: `${r.percentage}%`, background: pctColor(r.percentage) }} />
                  </div>
                  <span className="result-score" style={{ color: pctColor(r.percentage) }}>
                    {r.score} / {r.total_points} — {r.percentage}%
                    {r.is_successful === true  && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>✓ Sikeres</span>}
                    {r.is_successful === false && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--error)',   fontWeight: 700 }}>✗ Sikertelen</span>}
                  </span>
                  {!r.one_attempt && r.quiz_id && (
                    <button
                      className="icon-btn"
                      title="Kvíz újra kitöltése"
                      style={{ marginLeft: 8, fontSize: 13, flexShrink: 0 }}
                      onClick={() => navigate(`/quiz/${r.quiz_id}`)}
                    >
                      🔄
                    </button>
                  )}
                </div>
              </div>
            ))}
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

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard icon="📝" value={creator_stats.quiz_count}  label="Létrehozott kvíz" />
        <StatCard icon="✏️" value={totalQuestions}            label="Megírt kérdések" />
        <StatCard icon="👥" value={creator_stats.total_plays} label="Összes kitöltés" />
        <StatCard
          icon="🎯"
          value={creator_stats.avg_score_pct !== null ? (creator_stats.avg_score_pct + '%') : '–'}
          label="Átlagos kitöltői eredmény"
          color={creator_stats.avg_score_pct ? pctColor(creator_stats.avg_score_pct) : undefined}
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
            {/* Legtöbbet kitöltött kvízeim */}
            <div className="stats-panel" style={{ flex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="section-title" style={{ margin: 0 }}>Legtöbbet kitöltött kvízeim</h3>
                <button className="link-btn" onClick={() => navigate('/dashboard/quizzes')}>Összes →</button>
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
                        {/* Kategória: színes pont + szöveg, utána meta */}
                        <span className="result-date" style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          {q.category && <CatLabel category={q.category} />}
                          <span style={{ color: 'var(--muted)' }}>
                            {q.category ? '· ' : ''}{q.question_count ?? 0} kérdés
                            {q.avg_score_pct !== null ? ` · kitöltői átlag: ${q.avg_score_pct}%` : ''}
                          </span>
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

            {/* Kitöltések kategóriánként */}
            {own_categories.length > 0 && (
              <div className="stats-panel" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 className="section-title" style={{ margin: 0 }}>Kitöltések kategóriánként</h3>
                  <ToggleBtn
                    onClick={() => setOwnCatSortBy(s => s === 'plays' ? 'pct' : 'plays')}
                    title={ownCatSortBy === 'plays' ? 'Váltás: átlagos eredmény szerinti sorrend' : 'Váltás: kitöltések szerinti sorrend'}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
                  {ownCatSortBy === 'plays'
                    ? 'Rendezve: kitöltések száma szerint (csökkenő)'
                    : 'Rendezve: átlagos eredmény szerint (csökkenő)'}
                </p>
                {sortedOwnCats.map(r => (
                  <OwnCatRow
                    key={r.category}
                    category={r.category}
                    quiz_count={r.quiz_count}
                    total_plays={r.total_plays}
                    avg_score_pct={r.avg_score_pct}
                    maxPlays={maxOwnPlays}
                    sortBy={ownCatSortBy}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
