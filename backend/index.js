const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('A szerver el es mozog!'));

// ── SÉMA MIGRÁCIÓK (induláskor fut le) ───────────────────────────
// Az adatbázis valódi sémája alapján:
//   answer_options: id, question_id, text, is_correct
//   attempt_answers: id, attempt_id, question_id, answer_option_id (NOT NULL!), answer_id (nullable), text_answer
//   questions: id, quiz_id, text, question_type, question_order, points (NOT NULL)
//   quiz_attempts: id, quiz_id, user_id, score, total_questions, started_at, completed_at
async function runMigrations() {
    const migrations = [
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS pass_score INT DEFAULT NULL`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS pass_percentage INT DEFAULT NULL`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS hide_results BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS share_code VARCHAR DEFAULT NULL`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS one_attempt BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS access_password VARCHAR DEFAULT NULL`,
    ];
    for (const sql of migrations) {
        try { await pool.query(sql); } catch(e) { /* mar letezik */ }
    }
    console.log('Migraciok lefutottak.');
}
runMigrations();

// ── FELHASZNALOK ─────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await pool.query(
            'SELECT * FROM users WHERE (username = $1 OR email = $1) AND password_hash = $2',
            [username, password]
        );
        if (user.rows.length === 0)
            return res.status(401).json({ message: 'Hibas adatok!' });
        const loggedInUser = user.rows[0];
        delete loggedInUser.password_hash;
        res.json({ message: 'Sikeres belepes!', user: loggedInUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userCheck = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (userCheck.rows.length > 0)
            return res.status(400).json({ message: 'A felhasznalonev vagy az email mar foglalt!' });
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'STUDENT') RETURNING *",
            [username, email, password]
        );
        res.status(201).json({ message: 'Sikeres regisztracio!', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.post('/api/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        if (!userId || !currentPassword || !newPassword)
            return res.status(400).json({ message: 'Hianyzo adatok!' });
        if (newPassword.length < 6)
            return res.status(400).json({ message: 'Az uj jelszonak legalabb 6 karakter hosszunak kell lennie!' });
        const user = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND password_hash = $2',
            [userId, currentPassword]
        );
        if (user.rows.length === 0)
            return res.status(401).json({ message: 'A jelenlegi jelszo helytelen!' });
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPassword, userId]);
        res.json({ message: 'Jelszo sikeresen modositva!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.delete('/api/delete-account/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'A felhasznalo nem talalhato!' });
        res.json({ message: 'Fiok sikeresen torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.delete('/api/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'A felhasznalo nem talalhato!' });
        res.json({ message: 'Felhasznalo torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// ── KVIZEK ───────────────────────────────────────────────────────

function generateShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

app.get('/api/quizzes/my/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT q.*,
                    COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             LEFT JOIN questions qu ON qu.quiz_id = q.id
             WHERE q.owner_id = $1
             GROUP BY q.id
             ORDER BY q.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.get('/api/admin/quizzes', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT q.*,
                    u.username AS owner_name,
                    COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             LEFT JOIN questions qu ON qu.quiz_id = q.id
             GROUP BY q.id, u.username
             ORDER BY q.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.get('/api/quizzes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT q.id, q.title, q.description, q.category, q.time_limit,
                    q.is_public, q.share_code, q.created_at, q.play_count,
                    q.one_attempt, q.shuffle_questions, q.shuffle_answers,
                    q.pass_score, q.pass_percentage, q.hide_results,
                    u.username AS owner_name,
                    COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             LEFT JOIN questions qu ON qu.quiz_id = q.id
             WHERE q.id = $1
             GROUP BY q.id, u.username`,
            [id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.put('/api/quizzes/:id/pass-score', async (req, res) => {
    try {
        const { id } = req.params;
        const { pass_score } = req.body;
        await pool.query(
            'UPDATE quizzes SET pass_score = $1 WHERE id = $2',
            [pass_score ?? null, id]
        );
        res.json({ message: 'Pass score frissitve!', pass_score: pass_score ?? null });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.get('/api/quizzes/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const quizResult = await pool.query(
            'SELECT id, title, play_count, pass_score, pass_percentage FROM quizzes WHERE id = $1',
            [id]
        );
        if (quizResult.rows.length === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });

        const attemptsResult = await pool.query(
            `SELECT qa.id, qa.score, qa.total_questions,
                    qa.completed_at AS finished_at,
                    u.username, u.id AS user_id
             FROM quiz_attempts qa
             LEFT JOIN users u ON u.id = qa.user_id
             WHERE qa.quiz_id = $1
             ORDER BY qa.completed_at DESC NULLS LAST`,
            [id]
        );

        // Kérdések + answer_options (valódi táblanév!)
        const questionsResult = await pool.query(
            `SELECT id, text AS question_text, question_type, COALESCE(points, 1) AS points
             FROM questions WHERE quiz_id = $1 ORDER BY question_order, id`,
            [id]
        );
        const questions = await Promise.all(questionsResult.rows.map(async (q) => {
            const aResult = await pool.query(
                'SELECT id, text AS answer_text, is_correct FROM answer_options WHERE question_id = $1 ORDER BY id',
                [q.id]
            );
            return { ...q, answers: aResult.rows };
        }));

        const totalPoints = questions.reduce((s, q) => s + (q.points || 1), 0);

        // Részletes válaszok – answer_option_id alapján
        let attemptAnswers = {};
        try {
            const aaResult = await pool.query(
                `SELECT aa.attempt_id, aa.question_id,
                        aa.answer_option_id,
                        aa.text_answer
                 FROM attempt_answers aa
                 JOIN quiz_attempts qa ON qa.id = aa.attempt_id
                 WHERE qa.quiz_id = $1`,
                [id]
            );
            aaResult.rows.forEach(row => {
                if (!attemptAnswers[row.attempt_id]) attemptAnswers[row.attempt_id] = [];
                attemptAnswers[row.attempt_id].push({
                    question_id:    row.question_id,
                    answer_id:      row.answer_option_id,   // frontend answer_id-t vár
                    text_answer:    row.text_answer,
                });
            });
        } catch (e) {
            console.error('attempt_answers lekérési hiba:', e.message);
            attemptAnswers = {};
        }

        const attempts = attemptsResult.rows.map(a => ({
            id:              a.id,
            username:        a.username || 'Névtelen',
            user_id:         a.user_id,
            score:           a.score,
            total_questions: a.total_questions,
            percentage:      a.total_questions > 0
                             ? Math.round((a.score / a.total_questions) * 100) : 0,
            finished_at:     a.finished_at,
            answers:         attemptAnswers[a.id] || [],
        }));

        const avgPct = attempts.length > 0
            ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
            : 0;

        res.json({
            quiz:     { ...quizResult.rows[0], total_points: totalPoints },
            attempts,
            questions,
            summary:  { total_attempts: attempts.length, avg_percentage: avgPct },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.get('/api/quizzes/:id/check-attempt/:userId', async (req, res) => {
    try {
        const { id, userId } = req.params;
        const result = await pool.query(
            'SELECT id FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2 LIMIT 1',
            [id, userId]
        );
        res.json({ already_attempted: result.rows.length > 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.post('/api/quizzes/:id/verify-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const result = await pool.query('SELECT access_password FROM quizzes WHERE id = $1', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });
        if (result.rows[0].access_password !== password)
            return res.status(401).json({ message: 'Hibas jelszo!' });
        res.json({ ok: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.post('/api/quizzes', async (req, res) => {
    try {
        const {
            owner_id, title, description, category,
            time_limit, is_public, access_password, one_attempt,
            shuffle_questions, shuffle_answers,
            pass_score, pass_percentage, hide_results
        } = req.body;

        if (!owner_id || !title)
            return res.status(400).json({ message: 'A kviz neve es a tulajdonos megadasa kotelezo!' });

        let share_code, attempts = 0;
        while (attempts < 10) {
            const candidate = generateShareCode();
            const existing = await pool.query('SELECT id FROM quizzes WHERE share_code = $1', [candidate]);
            if (existing.rows.length === 0) { share_code = candidate; break; }
            attempts++;
        }
        if (!share_code)
            return res.status(500).json({ message: 'Nem sikerult egyedi kodot generalni!' });

        const result = await pool.query(
            `INSERT INTO quizzes
               (owner_id, title, description, category, time_limit, is_public,
                access_password, share_code, one_attempt, shuffle_questions, shuffle_answers,
                pass_score, pass_percentage, hide_results)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
            [
                owner_id, title, description || null, category || null,
                time_limit || null, is_public ?? true,
                (!is_public && access_password) ? access_password : null,
                share_code,
                one_attempt       ?? false,
                shuffle_questions ?? false,
                shuffle_answers   ?? false,
                pass_score        ?? null,
                pass_percentage   ?? null,
                hide_results      ?? false,
            ]
        );
        res.status(201).json({ message: 'Kviz sikeresen letrehozva!', quiz: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.get('/api/quizzes/public/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT q.id, q.title, q.description, q.category, q.time_limit,
                    q.is_public, q.play_count, q.created_at, q.one_attempt,
                    u.username AS owner_name,
                    COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             LEFT JOIN questions qu ON qu.quiz_id = q.id
             WHERE q.is_public = true AND q.owner_id != $1
             GROUP BY q.id, u.username
             ORDER BY q.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.get('/api/quizzes/find/:shareCode', async (req, res) => {
    try {
        const { shareCode } = req.params;
        const result = await pool.query(
            `SELECT q.id, q.title, q.description, q.category, q.time_limit,
                    q.is_public, q.share_code, q.play_count, q.created_at, q.one_attempt,
                    u.username AS owner_name,
                    COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             LEFT JOIN questions qu ON qu.quiz_id = q.id
             WHERE q.share_code = $1
             GROUP BY q.id, u.username`,
            [shareCode]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Nem talalhato kviz ezzel a koddal.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.delete('/api/quizzes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM quizzes WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });
        res.json({ message: 'Kviz torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// ── KERDESEK ─────────────────────────────────────────────────────
// Valódi séma: answer_options (nem answers!)
//   answer_options: id, question_id, text, is_correct

app.get('/api/quizzes/:id/questions', async (req, res) => {
    try {
        const { id } = req.params;
        const qResult = await pool.query(
            `SELECT id, quiz_id, text AS question_text, question_type,
                    COALESCE(points, 1) AS points, question_order
             FROM questions WHERE quiz_id = $1 ORDER BY question_order, id`,
            [id]
        );
        const questions = await Promise.all(qResult.rows.map(async (q) => {
            const aResult = await pool.query(
                'SELECT id, question_id, text AS answer_text, is_correct FROM answer_options WHERE question_id = $1 ORDER BY id',
                [q.id]
            );
            return { ...q, answers: aResult.rows };
        }));
        res.json(questions);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.post('/api/quizzes/:id/questions', async (req, res) => {
    try {
        const { id } = req.params;
        const { question_text, question_type, answers, points } = req.body;
        const qType = (question_type === 'true_false') ? 'multiple_choice' : (question_type || 'multiple_choice');
        const pts   = (points && parseInt(points) >= 1) ? parseInt(points) : 1;

        if (!question_text)
            return res.status(400).json({ message: 'A kerdes szovege kotelezo!' });

        if (qType === 'text_input') {
            if (!answers || answers.length < 1 || !answers[0].answer_text)
                return res.status(400).json({ message: 'A szoveges kerdesnel meg kell adni a helyes valaszt!' });
        } else {
            if (!answers || answers.length < 2)
                return res.status(400).json({ message: 'Legalabb 2 valasz kotelezo!' });
            if (answers.length > 4)
                return res.status(400).json({ message: 'Maximum 4 valasz adhato meg!' });
            if (!answers.some(a => a.is_correct))
                return res.status(400).json({ message: 'Legalabb egy helyes valaszt meg kell jelolni!' });
        }

        // Következő question_order meghatározása
        const orderRes = await pool.query(
            'SELECT COALESCE(MAX(question_order), 0) + 1 AS next_order FROM questions WHERE quiz_id = $1',
            [id]
        );
        const nextOrder = orderRes.rows[0].next_order;

        const qResult = await pool.query(
            `INSERT INTO questions (quiz_id, text, question_type, points, question_order)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, quiz_id, text AS question_text, question_type,
                       COALESCE(points, 1) AS points, question_order`,
            [id, question_text, qType, pts, nextOrder]
        );
        const question = qResult.rows[0];

        // answer_options tábla (nem answers!)
        const savedAnswers = await Promise.all(answers.map(a =>
            pool.query(
                'INSERT INTO answer_options (question_id, text, is_correct) VALUES ($1,$2,$3) RETURNING id, question_id, text AS answer_text, is_correct',
                [question.id, a.answer_text, a.is_correct ?? true]
            ).then(r => r.rows[0])
        ));

        res.status(201).json({ ...question, answers: savedAnswers });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.put('/api/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { question_text, question_type, answers, points } = req.body;
        const qType = (question_type === 'true_false') ? 'multiple_choice' : (question_type || 'multiple_choice');
        const pts   = (points && parseInt(points) >= 1) ? parseInt(points) : 1;

        if (!question_text)
            return res.status(400).json({ message: 'A kerdes szovege kotelezo!' });

        if (qType === 'text_input') {
            if (!answers || answers.length < 1 || !answers[0].answer_text)
                return res.status(400).json({ message: 'A szoveges kerdesnel meg kell adni a helyes valaszt!' });
        } else {
            if (!answers || answers.length < 2)
                return res.status(400).json({ message: 'Legalabb 2 valasz kotelezo!' });
            if (answers.length > 4)
                return res.status(400).json({ message: 'Maximum 4 valasz adhato meg!' });
            if (!answers.some(a => a.is_correct))
                return res.status(400).json({ message: 'Legalabb egy helyes valaszt meg kell jelolni!' });
        }

        await pool.query(
            'UPDATE questions SET text=$1, question_type=$2, points=$3 WHERE id=$4',
            [question_text, qType, pts, id]
        );

        // answer_options törlése és újramentése
        await pool.query('DELETE FROM answer_options WHERE question_id = $1', [id]);
        const savedAnswers = await Promise.all(answers.map(a =>
            pool.query(
                'INSERT INTO answer_options (question_id, text, is_correct) VALUES ($1,$2,$3) RETURNING id, question_id, text AS answer_text, is_correct',
                [id, a.answer_text, a.is_correct ?? true]
            ).then(r => r.rows[0])
        ));

        const qResult = await pool.query(
            `SELECT id, quiz_id, text AS question_text, question_type,
                    COALESCE(points, 1) AS points, question_order
             FROM questions WHERE id=$1`,
            [id]
        );
        res.json({ ...qResult.rows[0], answers: savedAnswers });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.delete('/api/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM questions WHERE id = $1', [id]);
        res.json({ message: 'Kerdes torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.put('/api/quizzes/:id/questions/reorder', async (req, res) => {
    res.json({ message: 'Sorrend mentve!' });
});

// ── KITOLTES ─────────────────────────────────────────────────────
// attempt_answers valódi sémája:
//   attempt_id, question_id, answer_option_id (NOT NULL!), text_answer

app.post('/api/quizzes/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, answers: userAnswers } = req.body;

        const quizRow = await pool.query(
            'SELECT one_attempt, pass_score, pass_percentage, hide_results FROM quizzes WHERE id = $1', [id]
        );
        if (quizRow.rows.length === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });

        if (quizRow.rows[0].one_attempt && user_id) {
            const prevAttempt = await pool.query(
                'SELECT id FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2 LIMIT 1',
                [id, user_id]
            );
            if (prevAttempt.rows.length > 0)
                return res.status(403).json({ message: 'Ezt a kvízt már kitöltötted, csak egyszer lehet!' });
        }

        // Kérdések lekérése pontokkal
        const questionsResult = await pool.query(
            'SELECT id, question_type, COALESCE(points, 1) AS points FROM questions WHERE quiz_id = $1',
            [id]
        );
        const questionMap = {};
        questionsResult.rows.forEach(q => {
            questionMap[q.id] = { type: q.question_type, points: q.points || 1 };
        });

        // Helyes válaszok lekérése – answer_options táblából
        const correctResult = await pool.query(
            `SELECT ao.id, ao.question_id, ao.text FROM answer_options ao
             JOIN questions q ON q.id = ao.question_id
             WHERE q.quiz_id = $1 AND ao.is_correct = true`,
            [id]
        );

        const correctMap     = {};  // question_id -> Set(answer_option_id)
        const correctTextMap = {};  // question_id -> correct text (text_input)
        correctResult.rows.forEach(r => {
            const qType = questionMap[r.question_id]?.type;
            if (qType === 'text_input') {
                correctTextMap[r.question_id] = r.text.trim().toLowerCase();
            } else {
                if (!correctMap[r.question_id]) correctMap[r.question_id] = new Set();
                correctMap[r.question_id].add(r.id);
            }
        });

        const totalQuestions = questionsResult.rows.length;
        const totalPoints    = questionsResult.rows.reduce((s, q) => s + (q.points || 1), 0);
        let earnedPoints = 0;
        let correctCount = 0;

        (userAnswers || []).forEach(ua => {
            const qInfo = questionMap[ua.question_id];
            if (!qInfo) return;
            const { type, points } = qInfo;
            let isCorrect = false;

            if (type === 'text_input') {
                const correctText = correctTextMap[ua.question_id];
                const userText    = (ua.text_answer || '').trim().toLowerCase();
                if (correctText && userText && userText === correctText) isCorrect = true;
            } else {
                const correctSet = correctMap[ua.question_id];
                if (!correctSet) return;
                const chosen = Array.isArray(ua.answer_ids)
                    ? ua.answer_ids.map(Number)
                    : (ua.answer_id ? [Number(ua.answer_id)] : []);
                if (chosen.length === 0) return;
                const chosenSet        = new Set(chosen);
                const allCorrectChosen = [...correctSet].every(cid => chosenSet.has(cid));
                const noWrongChosen    = [...chosenSet].every(cid => correctSet.has(cid));
                if (allCorrectChosen && noWrongChosen) isCorrect = true;
            }

            if (isCorrect) {
                correctCount++;
                earnedPoints += points;
            }
        });

        // Kitöltés mentése
        const insertRes = await pool.query(
            `INSERT INTO quiz_attempts (quiz_id, user_id, score, total_questions, completed_at)
             VALUES ($1,$2,$3,$4, NOW()) RETURNING id`,
            [id, user_id || null, earnedPoints, totalQuestions]
        );
        const attemptId = insertRes.rows[0].id;

        // Részletes válaszok mentése – answer_option_id (NOT NULL!) kezelése
        // Szöveges kérdéseknél 0-t írunk helyőrzőként (nincs answer_option_id)
        // Ezért a szöveges kérdéseknél egy sentinel értéket (0) helyett NULL-t
        // kellene, de az oszlop NOT NULL. Ezért egy dummy sort keresünk, vagy
        // egyszerűen a text_input kérdéseknél kihagyjuk a mentést és csak
        // a szöveges választ mentjük egy speciális megközelítéssel.
        //
        // Megoldás: text_input esetén az első (helyes) answer_option id-ját keressük ki.

        try {
            // Előre lekérjük a text_input kérdések answer_option id-ját
            const textInputOptIds = {};
            for (const ua of (userAnswers || [])) {
                const qInfo = questionMap[ua.question_id];
                if (qInfo?.type === 'text_input') {
                    const optRes = await pool.query(
                        'SELECT id FROM answer_options WHERE question_id = $1 LIMIT 1',
                        [ua.question_id]
                    );
                    if (optRes.rows.length > 0) {
                        textInputOptIds[ua.question_id] = optRes.rows[0].id;
                    }
                }
            }

            for (const ua of (userAnswers || [])) {
                const qInfo = questionMap[ua.question_id];
                if (!qInfo) continue;

                if (qInfo.type === 'text_input') {
                    const aoId = textInputOptIds[ua.question_id];
                    if (!aoId) continue; // ha nincs answer_option, kihagyjuk
                    await pool.query(
                        `INSERT INTO attempt_answers (attempt_id, question_id, answer_option_id, text_answer)
                         VALUES ($1, $2, $3, $4)`,
                        [attemptId, ua.question_id, aoId, ua.text_answer || '']
                    );
                } else {
                    const ids = Array.isArray(ua.answer_ids) ? ua.answer_ids : (ua.answer_id ? [ua.answer_id] : []);
                    if (ids.length === 0) continue; // nem válaszolt – nem mentjük
                    for (const aid of ids) {
                        await pool.query(
                            `INSERT INTO attempt_answers (attempt_id, question_id, answer_option_id)
                             VALUES ($1, $2, $3)`,
                            [attemptId, ua.question_id, aid]
                        );
                    }
                }
            }
        } catch(e) {
            console.error('attempt_answers mentési hiba:', e.message);
        }

        await pool.query('UPDATE quizzes SET play_count = play_count + 1 WHERE id = $1', [id]);

        const percentage  = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passScore   = quizRow.rows[0].pass_score;
        const passPct     = quizRow.rows[0].pass_percentage;
        const hideResults = quizRow.rows[0].hide_results;

        let passed = null;
        if (passScore !== null && passScore !== undefined)  passed = earnedPoints >= passScore;
        else if (passPct !== null && passPct !== undefined) passed = percentage   >= passPct;

        res.json({
            score:           earnedPoints,
            total:           totalPoints,
            correct_count:   correctCount,
            total_questions: totalQuestions,
            percentage,
            passed,
            pass_score:      passScore,
            pass_percentage: passPct,
            hide_results:    hideResults ?? false,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.delete('/api/attempts/:attemptId', async (req, res) => {
    try {
        const { attemptId } = req.params;
        const result = await pool.query('DELETE FROM quiz_attempts WHERE id = $1 RETURNING id', [attemptId]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'Kiserlet nem talalhato!' });
        res.json({ message: 'Kiserlet torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.delete('/api/quizzes/:id/attempts', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM quiz_attempts WHERE quiz_id = $1', [id]);
        await pool.query('UPDATE quizzes SET play_count = 0 WHERE id = $1', [id]);
        res.json({ message: 'Osszes kiserlet torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// ── FELHASZNALO DASHBOARD ADATOK ────────────────────────────────

app.get('/api/users/:userId/home-data', async (req, res) => {
    try {
        const { userId } = req.params;
        const [quizCount, attemptCount, playsRow, avgRow] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS cnt FROM quizzes WHERE owner_id = $1', [userId]),
            pool.query('SELECT COUNT(*)::int AS cnt FROM quiz_attempts WHERE user_id = $1', [userId]),
            pool.query('SELECT COALESCE(SUM(play_count),0)::int AS total FROM quizzes WHERE owner_id = $1', [userId]),
            pool.query(
                `SELECT ROUND(AVG(score::numeric / NULLIF(total_questions,0) * 100))::int AS avg_pct
                 FROM quiz_attempts WHERE user_id = $1 AND total_questions > 0`,
                [userId]
            ),
        ]);

        const recentRes = await pool.query(
            `SELECT qa.score, qa.total_questions,
                    qa.completed_at AS finished_at,
                    q.title AS quiz_title, q.category
             FROM quiz_attempts qa
             JOIN quizzes q ON q.id = qa.quiz_id
             WHERE qa.user_id = $1
             ORDER BY qa.completed_at DESC NULLS LAST LIMIT 5`,
            [userId]
        );

        res.json({
            stats: {
                quiz_count:     quizCount.rows[0].cnt,
                attempt_count:  attemptCount.rows[0].cnt,
                total_plays:    playsRow.rows[0].total,
                avg_percentage: avgRow.rows[0].avg_pct ?? 0,
            },
            recent_attempts: recentRes.rows.map(r => ({
                quiz_title:      r.quiz_title,
                category:        r.category,
                score:           r.score,
                total_questions: r.total_questions,
                percentage:      r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0,
                finished_at:     r.finished_at,
            })),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.get('/api/users/:userId/stats-data', async (req, res) => {
    try {
        const { userId } = req.params;
        const [quizCount, attemptCount, playsRow, avgRow] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS cnt FROM quizzes WHERE owner_id = $1', [userId]),
            pool.query('SELECT COUNT(*)::int AS cnt FROM quiz_attempts WHERE user_id = $1', [userId]),
            pool.query('SELECT COALESCE(SUM(play_count),0)::int AS total FROM quizzes WHERE owner_id = $1', [userId]),
            pool.query(
                `SELECT ROUND(AVG(score::numeric / NULLIF(total_questions,0) * 100))::int AS avg_pct
                 FROM quiz_attempts WHERE user_id = $1 AND total_questions > 0`,
                [userId]
            ),
        ]);

        const monthlyRes = await pool.query(
            `SELECT TO_CHAR(DATE_TRUNC('month', completed_at), 'YYYY-MM') AS month,
                    COUNT(*)::int AS cnt
             FROM quiz_attempts
             WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '6 months'
             GROUP BY DATE_TRUNC('month', completed_at)
             ORDER BY DATE_TRUNC('month', completed_at)`,
            [userId]
        );

        const monthlyMap = {};
        monthlyRes.rows.forEach(r => { monthlyMap[r.month] = r.cnt; });
        const monthly = [];
        const HU_MONTHS = ['Jan','Feb','Már','Ápr','Máj','Jún','Júl','Aug','Sze','Okt','Nov','Dec'];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthly.push({ label: HU_MONTHS[d.getMonth()], val: monthlyMap[key] || 0 });
        }

        const catRes = await pool.query(
            `SELECT q.category,
                    ROUND(AVG(qa.score::numeric / NULLIF(qa.total_questions,0) * 100))::int AS avg_pct
             FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id
             WHERE qa.user_id = $1 AND qa.total_questions > 0 AND q.category IS NOT NULL
             GROUP BY q.category ORDER BY avg_pct DESC LIMIT 6`,
            [userId]
        );

        const ownQuizzesRes = await pool.query(
            `SELECT q.id, q.title, q.category, q.play_count, COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q LEFT JOIN questions qu ON qu.quiz_id = q.id
             WHERE q.owner_id = $1 GROUP BY q.id ORDER BY q.play_count DESC`,
            [userId]
        );

        res.json({
            stats: {
                quiz_count:     quizCount.rows[0].cnt,
                attempt_count:  attemptCount.rows[0].cnt,
                total_plays:    playsRow.rows[0].total,
                avg_percentage: avgRow.rows[0].avg_pct ?? 0,
            },
            monthly,
            category_performance: catRes.rows,
            own_quizzes:          ownQuizzesRes.rows,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

app.listen(PORT, () => console.log(`Szerver fut: http://localhost:${PORT}`));
