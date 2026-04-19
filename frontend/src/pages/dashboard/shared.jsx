// ── Megosztott mock adatok, segédfüggvények, kis komponensek ─────
// Ezeket majd a backend hívások váltják fel.

// FONTOS: minden szín 6 jegyű hex (#rrggbb), hogy a badge háttér
// (#rrggbb + '22' = #rrggbb22, érvényes 8 jegyű RGBA hex) helyesen jelenjen meg.
// A 3 jegyű #888 + '22' = '#88822' (5 karakter → érvénytelen CSS) volt a hiba.
export const CAT_COLORS = {
  Történelem: '#e07b4a',
  Matematika: '#5a7de0',
  Földrajz:   '#4ab87a',
  Szórakozás: '#c05ab8',
  Tech:       '#4a9de0',
  Főzés:      '#e0a44a',
  Nyelv:      '#7a5ae0',
  Tudomány:   '#4ab8b8',
  Irodalom:   '#b85a5a',
  Egyéb:      '#888888',   // ← 6 jegyű hex, így '#888888' + '22' = '#88888822' (érvényes)
};

// Ismeretlen kategória esetén is 6 jegyű hex-et ad vissza
export const catColor = (c) => CAT_COLORS[c] || '#888888';

// ── Csillag értékelés komponens ───────────────────────────────────
export function Stars({ r }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(r) ? '#c8a96e' : 'var(--border)' }}>★</span>
      ))}
      <span className="stars-num">{r.toFixed(1)}</span>
    </span>
  );
}

// ── Kvíz kártya komponens ─────────────────────────────────────────
export function QuizCard({ quiz, showAuthor }) {
  return (
    <div className="quiz-card">
      <div className="quiz-card-top">
        <span className="cat-badge" style={{ background: catColor(quiz.category) + '22', color: catColor(quiz.category) }}>
          {quiz.category}
        </span>
        <Stars r={quiz.rating} />
      </div>
      <div className="quiz-card-title">{quiz.title}</div>
      <div className="quiz-card-meta">
        <span>📋 {quiz.questions} kérdés</span>
        <span>▶ {quiz.plays} kitöltés</span>
      </div>
      {showAuthor && <div className="quiz-card-author">@{quiz.author}</div>}
      <button className="dash-btn-outline quiz-card-btn">Kitöltés →</button>
    </div>
  );
}
