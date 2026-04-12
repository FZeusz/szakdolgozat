import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const isMultiAnswer = (answers) => answers.filter(a => a.is_correct).length > 1;

// ── Jelentés modal ────────────────────────────────────────────────
function ReportModal({ quizId, userId, onClose }) {
  const [message,     setMessage]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: quizId, user_id: userId || null, message: message.trim() || null }),
      });
      if (!res.ok) { setError('Beküldés sikertelen, próbáld újra!'); return; }
      setSubmitted(true);
      setTimeout(onClose, 1800);
    } catch { setError('Nem sikerült elérni a szervert.'); }
    finally { setSubmitting(false); }
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Modal kártya – kattintás ne zárdja be */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border-light)',
          borderRadius: 18, padding: '28px 28px 24px', width: '100%', maxWidth: 420,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>Köszönjük a jelentést!</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
              Az adminok hamarosan átnézik.
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🚩</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Kvíz jelentése</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Írd le, mi a probléma ezzel a kvízzel.</div>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label>Indoklás <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcionális)</span></label>
              <textarea
                className="field-textarea"
                rows={4}
                placeholder="pl. Helytelen kérdések, sértő tartalom, spam..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>

            {error && <div className="error-msg" style={{ marginBottom: 14 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="dash-btn-primary"
                style={{ flex: 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Küldés...' : '🚩 Jelentés beküldése'}
              </button>
              <button className="dash-btn-outline" onClick={onClose} disabled={submitting}>
                Mégse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Timer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef(null);
  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);
  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const pct  = (left / seconds) * 100;
  const urgent = left <= 60;
  return (
    <div className={`tq-timer ${urgent ? 'urgent' : ''}`}>
      <span className="tq-timer-icon">⏱</span>
      <span className="tq-timer-text">{mins}:{String(secs).padStart(2, '0')}</span>
      <div className="tq-timer-bar-wrap">
        <div className="tq-timer-bar" style={{ width: `${pct}%`, background: urgent ? 'var(--error)' : 'var(--gold)' }} />
      </div>
    </div>
  );
}

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [phase,       setPhase]       = useState('loading');
  const [quiz,        setQuiz]        = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [error,       setError]       = useState('');

  const [pwInput,     setPwInput]     = useState('');
  const [pwError,     setPwError]     = useState('');
  const [pwLoading,   setPwLoading]   = useState(false);

  const [current,     setCurrent]     = useState(0);
  const [selected,    setSelected]    = useState({});
  const [expired,     setExpired]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [attemptId,   setAttemptId]   = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  // Jelentés modal
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/quizzes/${id}`);
        if (!res.ok) { setError('A kvíz nem található.'); setPhase('error'); return; }
        const data = await res.json();
        setQuiz(data);

        const qRes  = await fetch(`http://localhost:5000/api/quizzes/${id}/questions`);
        const qData = await qRes.json();
        setQuestions(qData);

        if (!qData.length) { setError('Ennek a kvíznek még nincsenek kérdései.'); setPhase('error'); return; }

        if (data.one_attempt && user?.id) {
          const checkRes  = await fetch(`http://localhost:5000/api/quizzes/${id}/check-attempt/${user.id}`);
          const checkData = await checkRes.json();
          if (checkData.already_attempted) {
            setError('Ezt a kvízt már kitöltötted. Csak egyszer lehet kitölteni.');
            setPhase('error');
            return;
          }
        }

        if (data.one_attempt && !user?.id) {
          setError('Ez a kvíz csak bejelentkezett felhasználók számára elérhető, és csak egyszer tölthető ki.');
          setPhase('error');
          return;
        }

        setPhase(data.is_public ? 'intro' : 'password');
      } catch { setError('Nem sikerült betölteni a kvízt.'); setPhase('error'); }
    };
    load();
  }, [id]);

  const handlePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/${id}/verify-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwInput }),
      });
      if (!res.ok) { setPwError('Hibás jelszó!'); return; }
      setPhase('intro');
    } catch { setPwError('Szerver hiba!'); }
    finally { setPwLoading(false); }
  };

  const selectSingle = (questionId, answerId) => {
    setShowWarning(false);
    setSelected(prev => ({ ...prev, [questionId]: new Set([answerId]) }));
  };

  const toggleMulti = (questionId, answerId) => {
    setShowWarning(false);
    setSelected(prev => {
      const cur = new Set(prev[questionId] || []);
      if (cur.has(answerId)) cur.delete(answerId); else cur.add(answerId);
      return { ...prev, [questionId]: cur };
    });
  };

  const setTextAnswer = (questionId, text) => {
    setShowWarning(false);
    setSelected(prev => ({ ...prev, [questionId]: { text } }));
  };

  const handleSubmit = async () => {
    const answers = questions.map(q => {
      if (q.question_type === 'text_input') {
        return { question_id: q.id, text_answer: selected[q.id]?.text || '' };
      }
      return { question_id: q.id, answer_ids: [...(selected[q.id] || new Set())] };
    });
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/${id}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, answers, attempt_id: attemptId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || 'Beküldés sikertelen!'); return; }
      setResult(data);
      setPhase('result');
    } catch { alert('Beküldés sikertelen!'); }
  };

  const isAnswered = (q) => {
    if (q.question_type === 'text_input') return !!(selected[q.id]?.text?.trim());
    return (selected[q.id]?.size ?? 0) > 0;
  };

  // ── Renderelés ────────────────────────────────────────────────

  if (phase === 'loading') return (
    <div className="tq-root"><div className="tq-center">
      <span className="empty-icon">⏳</span><p>Betöltés...</p>
    </div></div>
  );

  if (phase === 'error') return (
    <div className="tq-root"><div className="tq-center" style={{ flexDirection: 'column', gap: 16 }}>
      <span className="empty-icon">❌</span>
      <p style={{ color: 'var(--error)', textAlign: 'center', maxWidth: 360 }}>{error}</p>
      <button className="dash-btn-outline" onClick={() => navigate(-1)}>← Vissza</button>
    </div></div>
  );

  if (phase === 'password') return (
    <div className="tq-root"><div className="tq-center">
      <div className="tq-card">
        <div className="tq-lock-icon">🔒</div>
        <h2 className="tq-card-title">{quiz.title}</h2>
        <p className="tq-card-sub">Ez egy privát kvíz. Add meg a belépési jelszót!</p>
        <form onSubmit={handlePassword} style={{ width: '100%' }}>
          <div className="field">
            <label>Jelszó</label>
            <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)}
              placeholder="••••••••" autoFocus />
          </div>
          {pwError && <div className="error-msg">{pwError}</div>}
          <button type="submit" className="dash-btn-primary" style={{ width: '100%' }} disabled={pwLoading}>
            {pwLoading ? '...' : 'Belépés'}
          </button>
        </form>
        <button className="link-btn" style={{ marginTop: 12 }} onClick={() => navigate(-1)}>← Vissza</button>
      </div>
    </div></div>
  );

  if (phase === 'intro') {
    const totalPts = questions.reduce((s, q) => s + (q.points ?? 1), 0);
    const allSame  = questions.every(q => (q.points ?? 1) === (questions[0]?.points ?? 1));

    return (
      <div className="tq-root"><div className="tq-center">
        <div className="tq-card">
          {quiz.category && (
            <span className="cat-badge" style={{ marginBottom: 12, display: 'inline-block',
              background: '#c8a96e22', color: '#c8a96e' }}>{quiz.category}</span>
          )}
          <h2 className="tq-card-title">{quiz.title}</h2>
          {quiz.description && <p className="tq-card-sub">{quiz.description}</p>}
          <div className="tq-intro-meta">
            <span>📋 {questions.length} kérdés</span>
            <span>🏅 {totalPts} pont összesen{!allSame ? ' (vegyes)' : ''}</span>
            {quiz.time_limit && <span>⏱ {Math.round(quiz.time_limit / 60)} perc</span>}
            {quiz.pass_mode === 'score'      && quiz.pass_score      && <span>🎯 Sikeres: ≥ {quiz.pass_score} pont</span>}
            {quiz.pass_mode === 'percentage' && quiz.pass_percentage && <span>🎯 Sikeres: ≥ {quiz.pass_percentage}%</span>}
            {quiz.pass_mode === 'none'       && <span>🎯 Nincs sikerességi küszöb</span>}
            {quiz.hide_results    && <span>🙈 Az eredmény rejtett</span>}
            {quiz.one_attempt     && <span>1️⃣ Csak egyszer tölthető ki</span>}
            {quiz.shuffle_questions && <span>🔀 Véletlenszerű kérdéssorrend</span>}
            {quiz.shuffle_answers   && <span>🔀 Véletlenszerű válaszok</span>}
            <span>👤 @{quiz.owner_name}</span>
          </div>
          <button className="dash-btn-primary" style={{ width: '100%', marginTop: 20 }}
            onClick={async () => {
              if (quiz.shuffle_questions || quiz.shuffle_answers) {
                const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
                setQuestions(prev => {
                  const qs = quiz.shuffle_questions ? shuffle(prev) : prev;
                  return qs.map(q => ({
                    ...q,
                    answers: quiz.shuffle_answers && q.question_type !== 'text_input'
                      ? shuffle(q.answers) : q.answers,
                  }));
                });
              }
              try {
                const startRes = await fetch(`http://localhost:5000/api/quizzes/${id}/start`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: user?.id }),
                });
                const startData = await startRes.json();
                if (startRes.ok) setAttemptId(startData.attempt_id);
              } catch { /* silent */ }
              setPhase('taking');
            }}>
            Kvíz indítása ▶
          </button>
          <button className="link-btn" style={{ marginTop: 12 }} onClick={() => navigate(-1)}>← Vissza</button>
        </div>
      </div></div>
    );
  }

  if (phase === 'taking') {
    const q      = questions[current];
    const totalQ = questions.length;
    const answeredCount = questions.filter(isAnswered).length;
    const multi  = q.question_type === 'multiple_choice' && isMultiAnswer(q.answers);
    const qSel   = selected[q.id] || new Set();

    return (
      <div className="tq-root">
        {/* Jelentés modal */}
        {showReport && (
          <ReportModal
            quizId={id}
            userId={user?.id}
            onClose={() => setShowReport(false)}
          />
        )}

        <div className="tq-header">
          <span className="tq-header-title">{quiz.title}</span>
          <span className="tq-progress-text">{current + 1} / {totalQ}</span>
          {quiz.time_limit && !expired && (
            <Timer seconds={quiz.time_limit} onExpire={() => { setExpired(true); handleSubmit(); }} />
          )}
          {/* Kvíz jelentése gomb – csak 'taking' fázisban látszik */}
          <button
            onClick={() => setShowReport(true)}
            title="Kvíz jelentése"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 13,
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = 'var(--error)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            🚩 Jelentés
          </button>
        </div>
        <div className="tq-progress-bar-wrap">
          <div className="tq-progress-bar" style={{ width: `${((current + 1) / totalQ) * 100}%` }} />
        </div>

        <div className="tq-body">
          <div className="tq-q-card">
            <div className="tq-q-num">
              Kérdés {current + 1}
              <span style={{
                marginLeft: 8, fontSize: 11, padding: '2px 7px', borderRadius: 99,
                background: 'var(--gold-subtle)', color: 'var(--gold)', fontWeight: 700,
              }}>
                {q.points ?? 1} pt
              </span>
              {multi && <span className="tq-multi-badge"> · Több helyes válasz lehetséges</span>}
              {q.question_type === 'text_input' && <span className="tq-multi-badge"> · Írd be a választ</span>}
            </div>
            <div className="tq-q-text">{q.question_text}</div>

            {q.question_type === 'text_input' && (
              <div className="tq-text-input-wrap">
                <input
                  className="tq-text-input"
                  placeholder="Írd ide a válaszod..."
                  value={selected[q.id]?.text || ''}
                  onChange={e => setTextAnswer(q.id, e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {q.question_type !== 'text_input' && (
              <div className="tq-answers">
                {q.answers.map(a => {
                  const isChosen = qSel instanceof Set && qSel.has(a.id);
                  return (
                    <button key={a.id}
                      className={`tq-answer-btn ${isChosen ? 'selected' : ''} ${multi ? 'multi' : ''}`}
                      onClick={() => multi ? toggleMulti(q.id, a.id) : selectSingle(q.id, a.id)}>
                      {multi && (
                        <span className={`tq-checkbox ${isChosen ? 'active' : ''}`}>
                          {isChosen ? '✓' : ''}
                        </span>
                      )}
                      {a.answer_text}
                    </button>
                  );
                })}
              </div>
            )}

            {showWarning && !isAnswered(q) && (
              <div style={{ marginTop: 16, fontSize: 13, color: 'var(--error)', textAlign: 'center', fontWeight: 500 }}>
                ⚠️ A továbblépéshez meg kell válaszolnod a kérdést!
              </div>
            )}
          </div>

          <div className="tq-nav">
            <button className="dash-btn-outline" onClick={() => { setShowWarning(false); setCurrent(c => c - 1); }} disabled={current === 0}>
              ← Előző
            </button>
            <span className="tq-answered-hint">{answeredCount} / {totalQ} megválaszolva</span>
            {current < totalQ - 1 ? (
              <button className="dash-btn-primary" style={{ width: 'auto' }}
                onClick={() => {
                  if (!isAnswered(q)) { setShowWarning(true); }
                  else { setShowWarning(false); setCurrent(c => c + 1); }
                }}>
                Következő →
              </button>
            ) : (
              <button className="dash-btn-primary" style={{ width: 'auto', background: 'var(--success)' }}
                onClick={() => {
                  if (!isAnswered(q)) { setShowWarning(true); }
                  else { handleSubmit(); }
                }}>
                ✓ Befejezés
              </button>
            )}
          </div>

          <div className="tq-dots">
            {questions.map((qq, i) => {
              const canJump = i <= current || questions.slice(0, i).every(isAnswered);
              return (
                <button key={i}
                  className={`tq-dot ${i === current ? 'active' : ''} ${isAnswered(qq) ? 'answered' : ''}`}
                  onClick={() => { if (canJump) { setShowWarning(false); setCurrent(i); } }}
                  style={!canJump ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    if (result.hide_results) {
      return (
        <div className="tq-root"><div className="tq-center">
          <div className="tq-card tq-result-card">
            <div className="tq-result-emoji">📬</div>
            <h2 className="tq-card-title">Kvíz beküldve!</h2>
            <p className="tq-card-sub" style={{ textAlign: 'center' }}>
              A kvíz készítője úgy döntött, hogy az eredmény nem jelenik meg azonnal.
            </p>
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border-light)',
              borderRadius: 10, padding: '14px 20px', fontSize: 14, color: 'var(--muted)',
              textAlign: 'center',
            }}>
              🙈 Az eredmény rejtett
            </div>
            <button className="dash-btn-outline" style={{ marginTop: 8 }}
              onClick={() => navigate(user ? '/dashboard/explore' : '/')}>
              ← Vissza
            </button>
          </div>
        </div></div>
      );
    }

    const pct    = result.percentage;
    const color  = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--gold)' : 'var(--error)';
    const emoji  = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪';
    const passed = result.passed;
    const isWeighted = result.total !== result.total_questions;

    return (
      <div className="tq-root"><div className="tq-center">
        <div className="tq-card tq-result-card">
          <div className="tq-result-emoji">{emoji}</div>
          <h2 className="tq-card-title">{quiz.title}</h2>

          <div className="tq-result-circle" style={{ borderColor: color }}>
            <span className="tq-result-pct" style={{ color }}>{pct}%</span>
            <span className="tq-result-frac" style={{ fontSize: 12 }}>
              {result.score} / {result.total} pt
            </span>
          </div>

          {isWeighted && (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {result.correct_count} / {result.total_questions} helyes válasz
            </div>
          )}

          <p className="tq-result-msg" style={{ color }}>
            {pct >= 80 ? 'Kiváló eredmény!' : pct >= 60 ? 'Szép munka!' : 'Próbálkozz újra!'}
          </p>

          {passed !== null && passed !== undefined && (
            <div style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              background: passed ? 'rgba(58,158,90,0.12)' : 'rgba(217,79,79,0.10)',
              border: `1px solid ${passed ? 'rgba(58,158,90,0.35)' : 'rgba(217,79,79,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, fontSize: 15, fontWeight: 700,
              color: passed ? 'var(--success)' : 'var(--error)',
            }}>
              {passed ? '✅ Sikeresen teljesítetted!' : '❌ Nem sikerült teljesíteni'}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}>
                {result.pass_mode === 'score'      && result.pass_score      ? `(küszöb: ${result.pass_score} pont)`
                 : result.pass_mode === 'percentage' && result.pass_percentage ? `(küszöb: ${result.pass_percentage}%)`
                 : ''}
              </span>
            </div>
          )}

          <div className="tq-review">
            <h3 className="section-title" style={{ marginBottom: 12 }}>Válaszaid áttekintése</h3>
            {questions.map((q, i) => {
              const correctAnswers = q.answers.filter(a => a.is_correct);
              let isOk = false;
              if (q.question_type === 'text_input') {
                const userText    = (selected[q.id]?.text || '').trim().toLowerCase();
                const correctText = (correctAnswers[0]?.answer_text || '').trim().toLowerCase();
                isOk = userText.length > 0 && userText === correctText;
              } else {
                const chosenIds  = selected[q.id] instanceof Set ? selected[q.id] : new Set();
                const correctIds = new Set(correctAnswers.map(a => a.id));
                const allOk      = [...correctIds].every(cid => chosenIds.has(cid));
                const noWrong    = [...chosenIds].every(cid => correctIds.has(cid));
                isOk             = allOk && noWrong && chosenIds.size > 0;
              }
              return (
                <div key={q.id} className={`tq-review-row ${isOk ? 'ok' : 'wrong'}`}>
                  <div className="tq-review-q">
                    <span className="tq-review-num">{i + 1}.</span>
                    <span style={{ flex: 1 }}>{q.question_text}</span>
                    <span style={{ fontSize: 11, color: isOk ? 'var(--success)' : 'var(--muted)',
                      fontWeight: 600, whiteSpace: 'nowrap', marginRight: 4 }}>
                      {isOk ? `+${q.points ?? 1}pt` : `0pt`}
                    </span>
                    <span className="tq-review-icon">{isOk ? '✅' : '❌'}</span>
                  </div>
                  {!isOk && (
                    <div className="tq-review-detail">
                      {q.question_type === 'text_input' ? (
                        <>
                          {selected[q.id]?.text && <span className="tq-wrong-ans">Te: {selected[q.id].text}</span>}
                          <span className="tq-correct-ans">Helyes: {correctAnswers[0]?.answer_text}</span>
                        </>
                      ) : (
                        <>
                          {selected[q.id] instanceof Set && selected[q.id].size > 0 && (
                            <span className="tq-wrong-ans">
                              Te: {q.answers.filter(a => selected[q.id].has(a.id)).map(a => a.answer_text).join(', ')}
                            </span>
                          )}
                          <span className="tq-correct-ans">
                            Helyes: {correctAnswers.map(a => a.answer_text).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {!quiz.one_attempt && (
              <button className="dash-btn-primary" style={{ width: 'auto' }}
                onClick={() => { setSelected({}); setCurrent(0); setResult(null); setPhase('intro'); }}>
                🔄 Újra
              </button>
            )}
            <button className="dash-btn-outline"
              onClick={() => navigate(user ? '/dashboard/explore' : '/')}>
              ← Vissza
            </button>
          </div>
        </div>
      </div></div>
    );
  }

  return null;
}
