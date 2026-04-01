// ── Megosztott mock adatok, segédfüggvények, kis komponensek ─────
// Ezeket majd a backend hívások váltják fel.

export const MOCK_MY_QUIZZES = [
  { id: 1, title: 'Magyar történelem alapjai', questions: 12, plays: 148, rating: 4.7, category: 'Történelem', created: '2026-02-10' },
  { id: 2, title: 'Matematika – törtszámok',   questions: 8,  plays: 93,  rating: 4.2, category: 'Matematika',  created: '2026-03-01' },
  { id: 3, title: 'Földrajz kvíz',             questions: 15, plays: 210, rating: 4.9, category: 'Földrajz',    created: '2026-03-18' },
];

export const MOCK_EXPLORE = [
  { id: 4, title: 'Filmek és sorozatok 2025', questions: 20, plays: 512, rating: 4.8, category: 'Szórakozás', author: 'kovacs_peter' },
  { id: 5, title: 'Programozás alapjai',      questions: 10, plays: 330, rating: 4.6, category: 'Tech',        author: 'devguru42'    },
  { id: 6, title: 'Ételek és receptek',        questions: 14, plays: 189, rating: 4.3, category: 'Főzés',       author: 'chef_anna'    },
  { id: 7, title: 'Angol szókincs B2',         questions: 25, plays: 420, rating: 4.5, category: 'Nyelv',       author: 'english_pro'  },
  { id: 8, title: 'Csillagászat kvíz',         questions: 18, plays: 97,  rating: 4.1, category: 'Tudomány',    author: 'stargazer99'  },
  { id: 9, title: 'Magyar irodalom',           questions: 16, plays: 265, rating: 4.7, category: 'Irodalom',    author: 'bookworm_hu'  },
];

export const MOCK_STATS = [
  { label: 'Kitöltött kvízek',     value: 24,    icon: '✅' },
  { label: 'Létrehozott kvízek',   value: 3,     icon: '📝' },
  { label: 'Összes játékos',       value: 451,   icon: '👥' },
  { label: 'Átlagos pontszázalék', value: '78%', icon: '🎯' },
];

export const MOCK_RECENT = [
  { quiz: 'Filmek és sorozatok 2025', score: '18/20', pct: 90, date: '2026-03-28' },
  { quiz: 'Angol szókincs B2',        score: '19/25', pct: 76, date: '2026-03-25' },
  { quiz: 'Programozás alapjai',      score: '9/10',  pct: 90, date: '2026-03-20' },
  { quiz: 'Csillagászat kvíz',        score: '11/18', pct: 61, date: '2026-03-15' },
];

export const CAT_COLORS = {
  Történelem: '#e07b4a', Matematika: '#5a7de0', Földrajz: '#4ab87a',
  Szórakozás: '#c05ab8', Tech: '#4a9de0', Főzés: '#e0a44a',
  Nyelv: '#7a5ae0', Tudomány: '#4ab8b8', Irodalom: '#b85a5a',
};

export const catColor = (c) => CAT_COLORS[c] || '#888';

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
