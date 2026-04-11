import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function QuizStats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const isAdmin = user?.role === 'ADMIN';

  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [deleting,    setDeleting]    = useState(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/${id}/stats`);
      if (!res.ok) { setError('Nem sikerült betölteni a statisztikákat.'); return; }
      setData(await res.json());
    } catch { setError('Nem sikerült elérni a szervert.'); }
    finally  { setLoading(false); }
  };

  const handleDeleteAttempt = async (attemptId) => {
    if (!window.confirm('Törlöd ezt a kitöltést? Ez visszavonhatatlan!')) return;
    setDeleting(attemptId);
    try {
      const res = await fetch(`http://localhost:5000/api/attempts/${attemptId}`, { method: 'DELETE' });
      if (!res.ok) { alert('Törlés sikertelen!'); return; }
      setData(prev => ({
        ...prev,
        attempts: prev.attempts.filter(a => a.id !== attemptId),
        summary: {
          ...prev.summary,
          total_attempts: prev.summary.total_attempts - 1,
          avg_percentage: (() => {
            const rem = prev.attempts.filter(a => a.id !== attemptId);
            return rem.length > 0
              ? Math.round(rem.reduce((s, a) => s + a.percentage, 0) / rem.length)
              : 0;
          })(),
        },
      }));
      setExpandedIds(prev => { const n = new Set(prev); n.delete(attemptId); return n; });
    } catch { alert('Törlés sikertelen!'); }
    finally { setDeleting(null); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Törlöd az összes kitöltést? Ez visszavonhatatlan!')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/${id}/attempts`, { method: 'DELETE' });
      if (!res.ok) { alert('Törlés sikertelen!'); return; }
      setData(prev => ({ ...prev, attempts: [], summary: { total_attempts: 0, avg_percentage: 0 } }));
      setExpandedIds(new Set());
    } catch { alert('Törlés sikertelen!'); }
  };

  if (loading) return <div className="tab-content"><div className="empty-state"><span className="empty-icon">⏳</span><p>Betöltés...</p></div></div>;
  if (error)   return (
    <div className="tab-content">
      <div className="page-header">
        <button className="dash-btn-outline" onClick={() => navigate(isAdmin ? '/dashboard/admin' : '/dashboard/quizzes')}>← Vissza</button>
      </div>
      <div className="error-msg" style={{ maxWidth: 480 }}>{error}</div>
    </div>
  );

  const { quiz, attempts, questions, summary } = data;

  const currentTotalPoints = quiz.total_points
    ?? (questions ? questions.reduce((s, q) => s + (q.points ?? 1), 0) : 1);

  const pctColor = (pct) => pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--gold)' : 'var(--error)';

  const passLabel = () => {
    if (quiz.pass_score)      return `Sikeres: ≥ ${quiz.pass_score} pont`;
    if (quiz.pass_percentage) return `Sikeres: ≥ ${quiz.pass_percentage}%`;
    return null;
  };

  // is_successful: a beküldéskor egyszer elmentett érték – sosem újraszámolt.
  // null = nem volt küszöb beállítva a kitöltés pillanatában.
  const isPassed = (attempt) => attempt.is_successful ?? null;

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Statisztikák</h2>
          <p className="page-sub">
            <strong>{quiz.title}</strong>
            <span style={{ marginLeft: 10, fontSize: 12, background: 'var(--gold-subtle)',
              color: 'var(--gold)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
              {currentTotalPoints} pont (jelenlegi)
            </span>
            {passLabel() && (
              <span style={{ marginLeft: 8, fontSize: 12, background: 'var(--gold-subtle)',
                color: 'var(--gold)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                🎯 {passLabel()}
              </span>
            )}
            {isAdmin && (
              <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>👑 Admin nézet</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {attempts.length > 0 && (
            <button className="dash-btn-danger" onClick={handleDeleteAll}>🗑️ Összes törlése</button>
          )}
          <button className="dash-btn-outline" onClick={() => navigate(isAdmin ? '/dashboard/admin' : '/dashboard/quizzes')}>
            ← Vissza a listához
          </button>
        </div>
      </div>

      {/* Összesítő kártyák */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <span className="stat-card-icon">▶</span>
          <span className="stat-card-value">{summary.total_attempts}</span>
          <span className="stat-card-label">Kitöltés összesen</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">🎯</span>
          <span className="stat-card-value">{summary.avg_percentage}%</span>
          <span className="stat-card-label">Átlagos eredmény</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">🏆</span>
          <span className="stat-card-value">
            {attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) + '%' : '–'}
          </span>
          <span className="stat-card-label">Legjobb eredmény</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">👥</span>
          <span className="stat-card-value">
            {new Set(attempts.filter(a => a.user_id).map(a => a.user_id)).size}
          </span>
          <span className="stat-card-label">Különböző kitöltő</span>
        </div>
        {/* Sikeres kártya: csak ha van legalább egy attempt ahol is_successful nem null */}
        {attempts.some(a => a.is_successful !== null) && (
          <div className="stat-card">
            <span className="stat-card-icon">✅</span>
            <span className="stat-card-value" style={{ color: 'var(--success)' }}>
              {attempts.filter(a => a.is_successful === true).length}
            </span>
            <span className="stat-card-label">Sikeres kitöltés</span>
          </div>
        )}
      </div>

      {/* Kitöltések listája */}
      {attempts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Még senki nem töltötte ki ezt a kvízt.</p>
        </div>
      ) : (
        <div className="result-list">
          <div className="result-row" style={{ background: 'var(--surface-2)', fontWeight: 600 }}>
            <div className="result-info">
              <span className="result-name" style={{ color: 'var(--btn-muted)', fontSize: 12 }}>FELHASZNÁLÓ</span>
            </div>
            <div className="result-right" style={{ gap: 8 }}>
              <span className="result-score" style={{ color: 'var(--btn-muted)', fontSize: 12 }}>EREDMÉNY</span>
              <span style={{ minWidth: 80, fontSize: 12, color: 'var(--btn-muted)', textAlign: 'right' }}>MŰVELETEK</span>
            </div>
          </div>

          {attempts.map((a, i) => {
            const isExpanded = expandedIds.has(a.id);
            const passed     = isPassed(a);   // a.is_successful – eltárolt érték
            const pct        = a.percentage;
            const tp         = a.total_points;

            return (
              <div key={a.id ?? i}>
                <div className="result-row" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <div className="result-info">
                    <span className="result-name">
                      {a.user_id ? `👤 ${a.username}` : '🌐 Névtelen'}
                      {passed === true  && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>✓ Sikeres</span>}
                      {passed === false && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--error)',   fontWeight: 700 }}>✗ Sikertelen</span>}
                    </span>
                    <span className="result-date">
                      {a.finished_at ? new Date(a.finished_at).toLocaleString('hu-HU') : ''}
                    </span>
                  </div>
                  <div className="result-right" style={{ gap: 8 }}>
                    <div className="pct-bar-wrap">
                      <div className="pct-bar" style={{ width: `${pct}%`, background: pctColor(pct) }} />
                    </div>
                    <span className="result-score" style={{ color: pctColor(pct) }}>
                      {a.score} / {tp} pt – {pct}%
                    </span>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {a.answers?.length > 0 && (
                        <button className="icon-btn" title="Részletek" style={{ fontSize: 13 }}
                          onClick={() => setExpandedIds(prev => {
                            const n = new Set(prev);
                            n.has(a.id) ? n.delete(a.id) : n.add(a.id);
                            return n;
                          })}>
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                      <button className="icon-btn" title="Kitöltés törlése"
                        style={{ color: 'var(--error)', fontSize: 13 }}
                        disabled={deleting === a.id}
                        onClick={() => handleDeleteAttempt(a.id)}>
                        {deleting === a.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Részletes válaszok */}
                {isExpanded && a.answers?.length > 0 && (
                  <div style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-light)',
                    padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Válaszok részletesen
                    </div>
                    {a.answers.map((ans, qi) => {
                      const ptsPossible  = ans.points_possible ?? 1;
                      const ptsAwarded   = ans.points_awarded  ?? null;
                      const hasPointData = ptsAwarded !== null;
                      const correct      = hasPointData ? (ptsAwarded > 0) : null;
                      const hasChosen    = ans.question_type === 'text_input'
                        ? !!ans.text_answer
                        : (ans.chosen_texts?.length > 0);

                      return (
                        <div key={ans.question_id ?? qi} style={{
                          background: 'var(--surface)',
                          border: `1px solid ${correct === true ? 'rgba(58,158,90,0.3)' : correct === false ? 'rgba(217,79,79,0.3)' : 'var(--border-light)'}`,
                          borderRadius: 10, padding: '12px 16px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 22 }}>{qi + 1}.</span>
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', flex: 1 }}>
                              {ans.question_text}
                            </span>
                            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 99,
                              background: correct === true ? 'rgba(58,158,90,0.12)' : 'var(--gold-subtle)',
                              color: correct === true ? 'var(--success)' : 'var(--gold)',
                              fontWeight: 700, whiteSpace: 'nowrap', marginRight: 4, flexShrink: 0 }}>
                              {hasPointData ? ptsAwarded : '–'} / {ptsPossible} pt
                            </span>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>
                              {correct === true ? '✅' : correct === false ? '❌' : '❓'}
                            </span>
                          </div>
                          <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {hasChosen ? (
                              <div style={{ fontSize: 13 }}>
                                <span style={{ color: 'var(--muted)', marginRight: 6 }}>Válasz:</span>
                                <span style={{ color: correct === true ? 'var(--success)' : 'var(--error)', fontWeight: 500 }}>
                                  {ans.question_type === 'text_input'
                                    ? ans.text_answer || '(üres)'
                                    : ans.chosen_texts.join(', ')}
                                </span>
                              </div>
                            ) : (
                              <div style={{ fontSize: 13, color: 'var(--muted)' }}>(nincs rögzített válasz)</div>
                            )}
                            {correct === false && (
                              <div style={{ fontSize: 13 }}>
                                <span style={{ color: 'var(--muted)', marginRight: 6 }}>Helyes:</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                  {ans.correct_answers_text || '(ismeretlen)'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
