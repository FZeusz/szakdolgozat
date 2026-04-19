import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catColor } from './shared';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [tab,      setTab]      = useState('quizzes'); // 'quizzes' | 'users' | 'reports'
  const [quizzes,  setQuizzes]  = useState([]);
  const [users,    setUsers]    = useState([]);
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Szűrők
  const [quizSearch,   setQuizSearch]   = useState('');
  const [userSearch,   setUserSearch]   = useState('');
  const [reportSearch, setReportSearch] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [qRes, uRes, rRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/quizzes`),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/reports`),
      ]);
      if (qRes.ok) setQuizzes(await qRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setReports(await rRes.json());
    } catch { setError('Nem sikerült betölteni az adatokat.'); }
    finally { setLoading(false); }
  };

  const handleDeleteQuiz = async (qId, title) => {
    if (!window.confirm(`Törlöd ezt a kvízt?\n"${title}"\n\nEz visszavonhatatlan!`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes/${qId}`, { method: 'DELETE' });
      if (!res.ok) { alert('Törlés sikertelen!'); return; }
      setQuizzes(prev => prev.filter(q => q.id !== qId));
    } catch { alert('Törlés sikertelen!'); }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Törlöd ezt a felhasználót?\n"${username}"\n\nEz visszavonhatatlan, és az összes kapcsolódó kvíz is törlődik!`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) { alert('Törlés sikertelen!'); return; }
      setUsers(prev => prev.filter(u => u.id !== userId));
      setQuizzes(prev => prev.filter(q => q.owner_id !== userId));
    } catch { alert('Törlés sikertelen!'); }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm(`Kezelted/Törlöd ezt a jelentést?\n\nEzzel eltávolítod a listából.`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reports/${reportId}`, { method: 'DELETE' });
      if (!res.ok) { alert('Törlés sikertelen!'); return; }
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch { alert('Törlés sikertelen!'); }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="tab-content">
        <div className="error-msg" style={{ maxWidth: 480 }}>
          Nincs hozzáférésed ehhez az oldalhoz.
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="tab-content">
      <div className="empty-state"><span className="empty-icon">⏳</span><p>Betöltés...</p></div>
    </div>
  );

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(quizSearch.toLowerCase()) ||
    (q.owner_name || '').toLowerCase().includes(quizSearch.toLowerCase()) ||
    (q.category || '').toLowerCase().includes(quizSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredReports = reports.filter(r =>
    (r.quiz_title || '').toLowerCase().includes(reportSearch.toLowerCase()) ||
    (r.reporter_username || '').toLowerCase().includes(reportSearch.toLowerCase()) ||
    (r.message || '').toLowerCase().includes(reportSearch.toLowerCase())
  );

  return (
    <div className="tab-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">👑 Admin panel</h2>
          <p className="page-sub">Összes kvíz és felhasználó kezelése.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            background: 'rgba(200,169,110,0.15)',
            border: '1px solid var(--gold)',
            borderRadius: 10,
            padding: '6px 14px',
            fontSize: 13,
            color: 'var(--gold)',
            fontWeight: 600,
          }}>
            {quizzes.length} kvíz · {users.length} felhasználó · {reports.length} jelentés
          </div>
        </div>
      </div>

      {error && <div className="error-msg" style={{ maxWidth: 560, marginBottom: 16 }}>{error}</div>}

      {/* Fül kapcsoló */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`vis-btn ${tab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setTab('quizzes')}>📝 Kvízek ({quizzes.length})</button>
        <button className={`vis-btn ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}>👥 Felhasználók ({users.length})</button>
        <button className={`vis-btn ${tab === 'reports' ? 'active' : ''}`}
          onClick={() => setTab('reports')}>⚠️ Jelentések ({reports.length})</button>
      </div>

      {/* ── KVÍZEK TAB ── */}
      {tab === 'quizzes' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input className="search-input" placeholder="🔍 Keresés cím, készítő, kategória alapján..."
              value={quizSearch} onChange={e => setQuizSearch(e.target.value)} />
          </div>
          {filteredQuizzes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <p>Nincs találat.</p>
            </div>
          ) : (
            <div className="my-quiz-list">
              {filteredQuizzes.map(q => (
                <div key={q.id} className="my-quiz-row">
                  <div className="my-quiz-left">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="my-quiz-title">{q.title}</span>
                        {q.category && (
                          <span className="cat-badge" style={{
                            background: catColor(q.category) + '22',
                            color: catColor(q.category),
                          }}>{q.category}</span>
                        )}
                        <span style={{
                          fontSize: 11, padding: '2px 7px', borderRadius: 99,
                          background: q.is_public ? 'rgba(58,158,90,0.12)' : 'rgba(200,169,110,0.12)',
                          color: q.is_public ? 'var(--success)' : 'var(--gold)',
                          fontWeight: 600,
                        }}>
                          {q.is_public ? '🌐 Nyilvános' : '🔒 Privát'}
                        </span>
                      </div>
                      <div className="my-quiz-meta">
                        👤 @{q.owner_name} · {q.question_count} kérdés · {q.play_count ?? 0} kitöltés
                      </div>
                    </div>
                  </div>
                  <div className="my-quiz-actions">
                    <button className="icon-btn" title="Statisztikák"
                      onClick={() => navigate(`/dashboard/quizzes/${q.id}/stats`)}>📊</button>
                    <button className="icon-btn" title="Kérdések szerkesztése"
                      onClick={() => navigate(`/dashboard/quizzes/${q.id}/edit`)}>✏️</button>
                    <button className="icon-btn" title="Kvíz törlése"
                      style={{ color: 'var(--error)' }}
                      onClick={() => handleDeleteQuiz(q.id, q.title)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── FELHASZNÁLÓK TAB ── */}
      {tab === 'users' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input className="search-input" placeholder="🔍 Keresés felhasználónév vagy email alapján..."
              value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>Nincs találat.</p>
            </div>
          ) : (
            <div className="my-quiz-list">
              {filteredUsers.map(u => {
                const isSelf = u.id === user.id;
                const initials = (u.username || 'U').slice(0, 2).toUpperCase();
                return (
                  <div key={u.id} className="my-quiz-row">
                    <div className="my-quiz-left">
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: u.role === 'ADMIN' ? 'var(--gold)' : 'var(--border)',
                        color: u.role === 'ADMIN' ? '#fff' : 'var(--btn-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>{initials}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="my-quiz-title">{u.username}</span>
                          <span style={{
                            fontSize: 11, padding: '2px 7px', borderRadius: 99,
                            background: u.role === 'ADMIN' ? 'rgba(200,169,110,0.15)' : 'rgba(90,120,200,0.12)',
                            color: u.role === 'ADMIN' ? 'var(--gold)' : '#5a7de0',
                            fontWeight: 700,
                          }}>
                            {u.role === 'ADMIN' ? '👑 Admin' : '👥 User'}
                          </span>
                          {isSelf && (
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>(te)</span>
                          )}
                        </div>
                        <div className="my-quiz-meta">
                          {u.email || '—'} · Regisztrált: {u.created_at ? new Date(u.created_at).toLocaleDateString('hu-HU') : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="my-quiz-actions">
                      {!isSelf && (
                        <button className="icon-btn" title="Felhasználó törlése"
                          style={{ color: 'var(--error)' }}
                          onClick={() => handleDeleteUser(u.id, u.username)}>🗑️</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── JELENTÉSEK TAB ── */}
      {tab === 'reports' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input className="search-input" placeholder="🔍 Keresés kvíz, jelentő vagy üzenet alapján..."
              value={reportSearch} onChange={e => setReportSearch(e.target.value)} />
          </div>
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <p>Nincs egyetlen jelentés sem.</p>
            </div>
          ) : (
            <div className="my-quiz-list">
              {filteredReports.map(r => (
                <div key={r.id} className="my-quiz-row" style={{ alignItems: 'flex-start' }}>
                  <div className="my-quiz-left">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span className="my-quiz-title" style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => navigate(`/dashboard/quizzes/${r.quiz_id}/edit`)}
                              title="Ugrás a kvíz szerkesztőjébe">
                          {r.quiz_title || 'Ismeretlen kvíz'}
                        </span>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(217,79,79,0.12)', color: 'var(--error)', fontWeight: 600 }}>
                          ⚠️ Jelentve
                        </span>
                      </div>
                      <div className="my-quiz-meta" style={{ marginBottom: 6 }}>
                        👤 Jelentő: {r.reporter_username || 'Névtelen'} · 📅 {new Date(r.created_at).toLocaleString('hu-HU')}
                      </div>
                      {r.message && (
                        <div style={{
                          background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8,
                          fontSize: 13, color: 'var(--text)', borderLeft: '3px solid var(--error)',
                          whiteSpace: 'pre-wrap', fontStyle: 'italic'
                        }}>
                          "{r.message}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="my-quiz-actions" style={{ alignSelf: 'center' }}>
                    <button className="icon-btn" title="Kezelve / Törlés"
                      style={{ color: 'var(--success)' }}
                      onClick={() => handleDeleteReport(r.id)}>✅</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
