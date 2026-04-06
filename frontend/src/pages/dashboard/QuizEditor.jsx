import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const emptyQuestion = () => ({
  question_text: '', question_type: 'multiple_choice', points: 1,
  answers: [
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
  ],
});

const isMultiAnswer = (answers) => answers.filter(a => a.is_correct).length > 1;

function QuestionForm({ initial, onSave, onCancel, saving }) {
  const [q, setQ] = useState(() => ({
    question_text: initial.question_text || '',
    question_type: initial.question_type === 'true_false' ? 'multiple_choice' : (initial.question_type || 'multiple_choice'),
    points: initial.points ?? 1,
    answers: initial.answers && initial.question_type !== 'true_false'
      ? initial.answers.map(a => ({ answer_text: a.answer_text, is_correct: !!a.is_correct }))
      : [{ answer_text: '', is_correct: false }, { answer_text: '', is_correct: false }],
  }));
  const [formError,  setFormError]  = useState('');
  const [allowMulti, setAllowMulti] = useState(
    () => initial.answers && initial.question_type !== 'true_false' ? isMultiAnswer(initial.answers) : false
  );

  const handleTypeChange = (type) => {
    setFormError('');
    if (type === 'text_input') {
      setQ(prev => ({ ...prev, question_text: prev.question_text, question_type: 'text_input', answers: [{ answer_text: '', is_correct: true }] }));
      setAllowMulti(false);
    } else {
      setQ(prev => ({ ...prev, question_text: prev.question_text, question_type: 'multiple_choice', answers: [
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
      ]}));
      setAllowMulti(false);
    }
  };

  const setAnswerText = (i, text) => setQ(prev => {
    const answers = [...prev.answers];
    answers[i] = { ...answers[i], answer_text: text };
    return { ...prev, answers };
  });

  const setSingleCorrect = (i) => setQ(prev => ({
    ...prev, answers: prev.answers.map((a, idx) => ({ ...a, is_correct: idx === i })),
  }));

  const toggleCorrect = (i) => setQ(prev => {
    const answers = [...prev.answers];
    answers[i] = { ...answers[i], is_correct: !answers[i].is_correct };
    return { ...prev, answers };
  });

  const handleAllowMultiToggle = () => {
    setAllowMulti(prev => {
      if (prev) {
        const first = q.answers.findIndex(a => a.is_correct);
        setQ(p => ({ ...p, answers: p.answers.map((a, i) => ({ ...a, is_correct: i === (first === -1 ? 0 : first) })) }));
      }
      return !prev;
    });
  };

  const addAnswer = () => {
    if (q.answers.length >= 4) return;
    setQ(prev => ({ ...prev, answers: [...prev.answers, { answer_text: '', is_correct: false }] }));
  };

  const removeAnswer = (i) => {
    if (q.answers.length <= 2) return;
    setQ(prev => ({ ...prev, answers: prev.answers.filter((_, idx) => idx !== i) }));
  };

  const handleSave = () => {
    setFormError('');
    if (!q.question_text.trim()) { setFormError('A kérdés szövege kötelező!'); return; }
    const pts = parseInt(q.points);
    if (isNaN(pts) || pts < 1) { setFormError('A pontszám legalább 1 kell legyen!'); return; }

    if (q.question_type === 'text_input') {
      if (!q.answers[0]?.answer_text.trim()) { setFormError('Add meg a helyes választ!'); return; }
    } else {
      if (q.answers.some(a => !a.answer_text.trim())) { setFormError('Minden válasz szövegét ki kell tölteni!'); return; }
      if (!q.answers.some(a => a.is_correct))          { setFormError('Jelölj meg legalább egy helyes választ!'); return; }
    }
    onSave({ ...q, points: pts });
  };

  const correctCount = q.answers.filter(a => a.is_correct).length;

  return (
    <div className="qform">
      {/* Típus választó */}
      <div className="qform-type-row">
        <button type="button"
          className={`vis-btn ${q.question_type === 'multiple_choice' ? 'active' : ''}`}
          onClick={() => handleTypeChange('multiple_choice')}>
          📋 Feleletválasztós
        </button>
        <button type="button"
          className={`vis-btn ${q.question_type === 'text_input' ? 'active' : ''}`}
          onClick={() => handleTypeChange('text_input')}>
          ✏️ Szöveges válasz
        </button>
      </div>

      {/* Többes mód (csak multiple_choice) */}
      {q.question_type === 'multiple_choice' && (
        <div className="qform-multi-row">
          <label className="qform-multi-label" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={allowMulti} onChange={handleAllowMultiToggle}
              style={{ marginRight: 8 }} />
            Több helyes válasz megengedett
          </label>
          {allowMulti && (
            <span className="qform-multi-hint">{correctCount} kijelölve</span>
          )}
        </div>
      )}

      {/* Kérdés szövege */}
      <div className="field">
        <label>Kérdés szövege</label>
        <textarea className="field-textarea" rows={2}
          placeholder="Pl. Mi Magyarország fővárosa?"
          value={q.question_text}
          onChange={e => setQ(prev => ({ ...prev, question_text: e.target.value }))} />
      </div>

      {/* Szöveges válasz típus */}
      {q.question_type === 'text_input' && (
        <div className="field">
          <label>Helyes válasz szövege</label>
          <input
            placeholder="pl. Budapest"
            value={q.answers[0]?.answer_text || ''}
            onChange={e => setAnswerText(0, e.target.value)}
          />
          <p className="field-hint">A kitöltő ezt a szöveget kell beírja (kis-/nagybetű nem számít).</p>
        </div>
      )}

      {/* Választós válaszok */}
      {q.question_type !== 'text_input' && (
        <div className="field">
          <label>
            {allowMulti
              ? `Válaszok (2–4 db, jelöld meg az összes helyeset)`
              : `Válaszok (2–4 db, jelöld meg az egyetlen helyeset)`}
          </label>
          <div className="answers-list">
            {q.answers.map((a, i) => (
              <div key={i} className={`answer-row ${a.is_correct ? 'correct' : ''}`}>
                {!allowMulti ? (
                  <button type="button"
                    className={`correct-dot ${a.is_correct ? 'active' : ''}`}
                    onClick={() => setSingleCorrect(i)} title="Ez a helyes válasz" />
                ) : (
                  <button type="button"
                    className={`correct-checkbox ${a.is_correct ? 'active' : ''}`}
                    onClick={() => toggleCorrect(i)} title="Helyes válasz be/ki">
                    {a.is_correct ? '✓' : ''}
                  </button>
                )}
                <input className="answer-input" placeholder={`${i + 1}. válasz`}
                  value={a.answer_text} onChange={e => setAnswerText(i, e.target.value)} />
                {q.answers.length > 2 && (
                  <button type="button" className="icon-btn" style={{ color: 'var(--error)', fontSize: 13 }}
                    onClick={() => removeAnswer(i)} title="Válasz törlése">✕</button>
                )}
              </div>
            ))}
          </div>
          {q.answers.length < 4 && (
            <button type="button" className="editor-add-btn"
              style={{ marginTop: 8, padding: '8px 14px', fontSize: 13, borderRadius: 8 }}
              onClick={addAnswer}>
              + Válasz hozzáadása ({q.answers.length}/4)
            </button>
          )}
        </div>
      )}

      {/* Pontszám */}
      <div className="field">
        <label>Pontszám</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="number" min="1" max="100"
            value={q.points}
            onChange={e => setQ(prev => ({ ...prev, points: e.target.value }))}
            style={{ width: 90 }}
          />
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>pont jár helyes válasz esetén</span>
        </div>
        <p className="field-hint">Alapértelmezett: 1 pont. Bonyolultabb kérdéseknél megadhatsz többet.</p>
      </div>

      {formError && <div className="error-msg" style={{ marginTop: 0 }}>{formError}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="dash-btn-primary"
          style={{ width: 'auto', padding: '9px 24px' }}
          onClick={handleSave} disabled={saving}>
          {saving ? 'Mentés...' : '✓ Kérdés mentése'}
        </button>
        <button type="button" className="dash-btn-outline"
          style={{ padding: '9px 20px' }} onClick={onCancel} disabled={saving}>
          Mégse
        </button>
      </div>
    </div>
  );
}

// ── Pass score szerkesztő panel a QuizEditorban ───────────────────
function PassScorePanel({ quiz, questions, onSaved }) {
  const totalPoints = questions.reduce((s, q) => s + (q.points ?? 1), 0);
  const [passScore, setPassScore] = useState(() => quiz.pass_score ?? '');
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null);

  const handleSave = async () => {
    const pts = passScore === '' ? null : parseInt(passScore);
    if (pts !== null && (isNaN(pts) || pts < 1 || pts > totalPoints)) {
      setMsg({ type: 'error', text: `A pont küszöb 1 és ${totalPoints} közé kell essen!` });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/${quiz.id}/pass-score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass_score: pts }),
      });
      if (!res.ok) { setMsg({ type: 'error', text: 'Mentés sikertelen!' }); return; }
      setMsg({ type: 'success', text: '✓ Pont küszöb mentve!' });
      onSaved(pts);
    } catch { setMsg({ type: 'error', text: 'Szerver hiba!' }); }
    finally { setSaving(false); }
  };

  if (questions.length === 0) return null;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-light)',
      borderRadius: 14,
      padding: '18px 22px',
      maxWidth: 720,
      marginBottom: 20,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>🎯 Pont alapú sikerességi küszöb</span>
        <span style={{
          fontSize: 12, padding: '2px 9px', borderRadius: 99,
          background: 'var(--gold-subtle)', color: 'var(--gold)', fontWeight: 600,
        }}>
          Összesen: {totalPoints} pont
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
        A kérdések jelenlegi összpontszáma <strong>{totalPoints} pont</strong>.
        Add meg, hány pontot kell elérni a kvíz sikeres teljesítéséhez, vagy hagyd üresen ha nincs küszöb.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="number" min="1" max={totalPoints}
          placeholder={`1 – ${totalPoints}`}
          value={passScore}
          onChange={e => setPassScore(e.target.value)}
          style={{ width: 110 }}
        />
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>/ {totalPoints} pont szükséges a sikerhez</span>
        <button className="dash-btn-primary" style={{ width: 'auto', padding: '8px 20px' }}
          onClick={handleSave} disabled={saving}>
          {saving ? '...' : 'Mentés'}
        </button>
        {passScore !== '' && passScore !== null && (
          <button className="dash-btn-outline" style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => { setPassScore(''); }}
            title="Küszöb törlése">✕ Törlés</button>
        )}
      </div>
      {/* Vizuális skála */}
      {totalPoints > 0 && passScore !== '' && !isNaN(parseInt(passScore)) && parseInt(passScore) >= 1 && parseInt(passScore) <= totalPoints && (
        <div style={{ marginTop: 14 }}>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${(parseInt(passScore) / totalPoints) * 100}%`,
              background: 'var(--gold)', borderRadius: 99, transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {Math.round((parseInt(passScore) / totalPoints) * 100)}% a küszöb
          </div>
        </div>
      )}
      {msg && (
        <div className={msg.type === 'success' ? 'success-msg' : 'error-msg'} style={{ marginTop: 12, marginBottom: 0 }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

export default function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const isAdmin = user?.role === 'ADMIN';

  const [quiz,      setQuiz]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadError('');
      try {
        const [qzRes, questRes] = await Promise.all([
          fetch(`http://localhost:5000/api/quizzes/${id}`),
          fetch(`http://localhost:5000/api/quizzes/${id}/questions`),
        ]);
        if (!qzRes.ok)    { setLoadError('A kvíz nem található.'); return; }
        if (!questRes.ok) { setLoadError('A kérdések betöltése sikertelen.'); return; }
        setQuiz(await qzRes.json());
        const qData = await questRes.json();
        setQuestions(qData.map(q => ({ ...q, answers: Array.isArray(q.answers) ? q.answers : [] })));
      } catch { setLoadError('Nem sikerült elérni a szervert.'); }
      finally  { setLoading(false); }
    };
    load();
  }, [id]);

  const handleAddSave = async (q) => {
    setSaving(true); setSaveError('');
    try {
      const res  = await fetch(`http://localhost:5000/api/quizzes/${id}/questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.message || 'Mentés sikertelen!'); return; }
      setQuestions(prev => [...prev, { ...data, answers: Array.isArray(data.answers) ? data.answers : [] }]);
      setAddingNew(false);
    } catch { setSaveError('Nem sikerült elérni a szervert!'); }
    finally { setSaving(false); }
  };

  const handleEditSave = async (q) => {
    setSaving(true); setSaveError('');
    try {
      const res  = await fetch(`http://localhost:5000/api/questions/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.message || 'Mentés sikertelen!'); return; }
      setQuestions(prev => prev.map(x => x.id === editingId
        ? { ...data, answers: Array.isArray(data.answers) ? data.answers : [] } : x));
      setEditingId(null);
    } catch { setSaveError('Nem sikerült elérni a szervert!'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (qId, text) => {
    if (!window.confirm(`Törlöd ezt a kérdést?\n"${text}"`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/questions/${qId}`, { method: 'DELETE' });
      if (!res.ok) { alert('Törlés sikertelen!'); return; }
      setQuestions(prev => prev.filter(x => x.id !== qId));
    } catch { alert('Törlés sikertelen!'); }
  };

  const typeBadge = (q) => {
    if (q.question_type === 'text_input')  return 'Szöveges';
    if (isMultiAnswer(q.answers))          return 'Többválasztós';
    return 'Feleletválasztós';
  };

  const totalPoints = questions.reduce((s, q) => s + (q.points ?? 1), 0);

  if (loading) return (
    <div className="tab-content">
      <div className="empty-state"><span className="empty-icon">⏳</span><p>Betöltés...</p></div>
    </div>
  );

  if (loadError) return (
    <div className="tab-content">
      <div className="page-header">
        <button className="dash-btn-outline" onClick={() => navigate(isAdmin ? '/dashboard/admin' : '/dashboard/quizzes')}>← Vissza</button>
      </div>
      <div className="error-msg" style={{ maxWidth: 480 }}>{loadError}</div>
    </div>
  );

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Kérdésszerkesztő</h2>
          <p className="page-sub">
            <strong>{quiz?.title}</strong> · {questions.length} kérdés
            {questions.length > 0 && (
              <span style={{ marginLeft: 10, fontSize: 12, background: 'var(--gold-subtle)',
                color: 'var(--gold)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                {totalPoints} pont összesen
              </span>
            )}
            {isAdmin && quiz && <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>👑 Admin szerkesztés</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="dash-btn-outline" onClick={() => navigate(isAdmin ? '/dashboard/admin' : '/dashboard/quizzes')}>
            ← Vissza a listához
          </button>
          <button className="dash-btn-primary"
            onClick={() => navigate(`/quiz/${id}`)}
            disabled={questions.length === 0}
            title={questions.length === 0 ? 'Adj hozzá legalább egy kérdést!' : ''}>
            ▶ Előnézet / Kitöltés
          </button>
        </div>
      </div>

      {saveError && (
        <div className="error-msg" style={{ maxWidth: 600, marginBottom: 16 }}>{saveError}</div>
      )}

      {/* Pont alapú küszöb panel – csak ha a kvízen pass_score mód van VAGY ha már vannak kérdések */}
      {quiz && quiz.pass_percentage === null && questions.length > 0 && (
        <PassScorePanel
          quiz={quiz}
          questions={questions}
          onSaved={(pts) => setQuiz(prev => ({ ...prev, pass_score: pts }))}
        />
      )}

      <div className="editor-questions">
        {questions.map((q, idx) => (
          <div key={q.id} className="editor-q-card">
            {editingId === q.id ? (
              <QuestionForm initial={q} onSave={handleEditSave}
                onCancel={() => { setEditingId(null); setSaveError(''); }} saving={saving} />
            ) : (
              <>
                <div className="editor-q-header">
                  <span className="editor-q-num">{idx + 1}.</span>
                  <span className="editor-q-type-badge">{typeBadge(q)}</span>
                  {/* Pont badge */}
                  <span style={{
                    fontSize: 12, padding: '2px 8px', borderRadius: 99, marginLeft: 4,
                    background: 'var(--gold-subtle)', color: 'var(--gold)', fontWeight: 700,
                  }}>
                    {q.points ?? 1} pt
                  </span>
                  <div style={{ flex: 1 }} />
                  <button className="icon-btn" title="Szerkesztés"
                    onClick={() => { setAddingNew(false); setEditingId(q.id); setSaveError(''); }}>✏️</button>
                  <button className="icon-btn" title="Törlés"
                    onClick={() => handleDelete(q.id, q.question_text)}>🗑️</button>
                </div>
                <div className="editor-q-text">{q.question_text}</div>
                <div className="editor-q-answers">
                  {q.question_type === 'text_input' ? (
                    <div className="editor-a-chip correct">
                      <span className="editor-a-tick">✓ </span>
                      Helyes válasz: {q.answers[0]?.answer_text}
                    </div>
                  ) : q.answers.map((a, ai) => (
                    <div key={a.id ?? ai} className={`editor-a-chip ${a.is_correct ? 'correct' : ''}`}>
                      {a.is_correct && <span className="editor-a-tick">✓ </span>}
                      {a.answer_text}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}

        {addingNew && (
          <div className="editor-q-card editor-q-card--new">
            <QuestionForm initial={emptyQuestion()} onSave={handleAddSave}
              onCancel={() => { setAddingNew(false); setSaveError(''); }} saving={saving} />
          </div>
        )}

        {!addingNew && editingId === null && (
          <button className="editor-add-btn"
            onClick={() => { setAddingNew(true); setSaveError(''); }}>
            + Új kérdés hozzáadása
          </button>
        )}

        {questions.length === 0 && !addingNew && (
          <div className="empty-state" style={{ paddingTop: 20 }}>
            <span className="empty-icon">🧩</span>
            <p>Még nincs kérdés. Kattints a gombra és adj hozzá egyet!</p>
          </div>
        )}
      </div>
    </div>
  );
}
