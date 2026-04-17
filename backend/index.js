const express = require('express');
const cors    = require('cors');
const pool    = require('./db');
require('dotenv').config();

// ── ROUTEREK ─────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const quizRoutes    = require('./routes/quizzes');
const questionRoutes = require('./routes/questions');
const attemptRoutes = require('./routes/attempts');
const userRoutes    = require('./routes/users');
const reportRoutes  = require('./routes/reports');

const app  = express();
const PORT = 5000;

// ── MIDDLEWARE ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── SÉMA MIGRÁCIÓK ───────────────────────────────────────────────
async function runMigrations() {
    const migrations = [
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS pass_score INT DEFAULT NULL`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS pass_percentage INT DEFAULT NULL`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS hide_results BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS share_code VARCHAR DEFAULT NULL`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS one_attempt BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS access_password VARCHAR DEFAULT NULL`,
        `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS total_points INT DEFAULT NULL`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS pass_mode VARCHAR(20) DEFAULT 'none'`,
        `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS is_successful BOOLEAN DEFAULT NULL`,
    ];
    for (const sql of migrations) {
        try { await pool.query(sql); } catch (e) {}
    }
    try {
        await pool.query(`
            UPDATE quiz_attempts
            SET total_points = total_questions
            WHERE total_points IS NULL AND total_questions IS NOT NULL
        `);
    } catch (e) {}
    console.log('Migraciok lefutottak.');
}
runMigrations();

// ── ÚTVONALAK ────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('A szerver el es mozog!'));

app.use('/api',             authRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/quizzes',     quizRoutes);
app.use('/api/questions',   questionRoutes);
app.use('/api/attempts',    attemptRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/reports',     reportRoutes);

// ── SZERVER INDÍTÁS ──────────────────────────────────────────────
app.listen(PORT, () => console.log(`Szerver fut: http://localhost:${PORT}`));
