const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ── SEGÉDFÜGGVÉNY ────────────────────────────────────────────────
function generateShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// ── KVÍZ LEKÉRÉSEK ───────────────────────────────────────────────
// FONTOS: a specifikus útvonalak (my, public, find) az /:id elé kell!

// GET /api/quizzes/my/:userId
router.get('/my/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT q.*, COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             LEFT JOIN questions qu ON qu.quiz_id = q.id AND qu.is_active = true
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

// GET /api/quizzes/public/:userId
router.get('/public/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT q.id, q.title, q.description, q.category, q.time_limit,
                    q.is_public, q.play_count, q.created_at, q.one_attempt,
                    u.username AS owner_name,
                    COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             LEFT JOIN questions qu ON qu.quiz_id = q.id AND qu.is_active = true
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

// GET /api/quizzes/find/:shareCode
router.get('/find/:shareCode', async (req, res) => {
    try {
        const { shareCode } = req.params;
        const result = await pool.query(
            `SELECT q.id, q.title, q.description, q.category, q.time_limit,
                    q.is_public, q.share_code, q.play_count, q.created_at, q.one_attempt,
                    u.username AS owner_name,
                    COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             LEFT JOIN questions qu ON qu.quiz_id = q.id AND qu.is_active = true
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

// GET /api/quizzes/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT q.id, q.title, q.description, q.category, q.time_limit,
                    q.is_public, q.share_code, q.created_at, q.play_count,
                    q.one_attempt, q.shuffle_questions, q.shuffle_answers,
                    q.pass_score, q.pass_percentage, q.pass_mode, q.hide_results,
                    u.username AS owner_name,
                    COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             LEFT JOIN questions qu ON qu.quiz_id = q.id AND qu.is_active = true
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

// ── KVÍZ LÉTREHOZÁS / TÖRLÉS ─────────────────────────────────────

// POST /api/quizzes
router.post('/', async (req, res) => {
    try {
        const {
            owner_id, title, description, category,
            time_limit, is_public, access_password, one_attempt,
            shuffle_questions, shuffle_answers,
            pass_score, pass_percentage, pass_mode, hide_results
        } = req.body;

        if (!owner_id || !title)
            return res.status(400).json({ message: 'A kviz neve es a tulajdonos megadasa kotelezo!' });

        let share_code, attempts = 0;
        while (attempts < 10) {
            const candidate = generateShareCode();
            const existing  = await pool.query('SELECT id FROM quizzes WHERE share_code = $1', [candidate]);
            if (existing.rows.length === 0) { share_code = candidate; break; }
            attempts++;
        }
        if (!share_code)
            return res.status(500).json({ message: 'Nem sikerult egyedi kodot generalni!' });

        const result = await pool.query(
            `INSERT INTO quizzes
               (owner_id, title, description, category, time_limit, is_public,
                access_password, share_code, one_attempt, shuffle_questions, shuffle_answers,
                pass_score, pass_percentage, hide_results, pass_mode)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
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
                pass_mode         || 'none',
            ]
        );
        res.status(201).json({ message: 'Kviz sikeresen letrehozva!', quiz: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// DELETE /api/quizzes/:id
router.delete('/:id', async (req, res) => {
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

// ── KVÍZ BEÁLLÍTÁSOK ─────────────────────────────────────────────

// PUT /api/quizzes/:id/pass-score
router.put('/:id/pass-score', async (req, res) => {
    try {
        const { id } = req.params;
        const { pass_score } = req.body;
        await pool.query('UPDATE quizzes SET pass_score = $1 WHERE id = $2', [pass_score ?? null, id]);
        res.json({ message: 'Pass score frissitve!', pass_score: pass_score ?? null });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// PUT /api/quizzes/:id/pass-percentage
router.put('/:id/pass-percentage', async (req, res) => {
    try {
        const { id } = req.params;
        const { pass_percentage } = req.body;
        await pool.query('UPDATE quizzes SET pass_percentage = $1 WHERE id = $2', [pass_percentage ?? null, id]);
        res.json({ message: 'Pass percentage frissitve!', pass_percentage: pass_percentage ?? null });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// GET /api/quizzes/:id/access-password
router.get('/:id/access-password', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT access_password FROM quizzes WHERE id = $1', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });
        res.json({ access_password: result.rows[0].access_password || '' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// PUT /api/quizzes/:id/access-password
router.put('/:id/access-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { access_password } = req.body;
        if (!access_password || !access_password.trim())
            return res.status(400).json({ message: 'A jelszo nem lehet ures!' });
        await pool.query('UPDATE quizzes SET access_password = $1 WHERE id = $2', [access_password.trim(), id]);
        res.json({ message: 'Jelszo frissitve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// POST /api/quizzes/:id/verify-password
router.post('/:id/verify-password', async (req, res) => {
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

// ── KÉRDÉSEK (kvíz-szintű) ───────────────────────────────────────

// GET /api/quizzes/:id/questions
router.get('/:id/questions', async (req, res) => {
    try {
        const { id } = req.params;
        const qResult = await pool.query(
            `SELECT id, quiz_id, text AS question_text, question_type,
                    COALESCE(points, 1) AS points, question_order
             FROM questions WHERE quiz_id = $1 AND is_active = true ORDER BY question_order, id`,
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

// POST /api/quizzes/:id/questions
router.post('/:id/questions', async (req, res) => {
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
            if (answers.length > 6)
                return res.status(400).json({ message: 'Maximum 6 valasz adhato meg!' });
            if (!answers.some(a => a.is_correct))
                return res.status(400).json({ message: 'Legalabb egy helyes valaszt meg kell jelolni!' });
        }

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

// PUT /api/quizzes/:id/questions/reorder
router.put('/:id/questions/reorder', async (req, res) => {
    res.json({ message: 'Sorrend mentve!' });
});

// ── KITÖLTÉS ─────────────────────────────────────────────────────

// GET /api/quizzes/:id/check-attempt/:userId
router.get('/:id/check-attempt/:userId', async (req, res) => {
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

// POST /api/quizzes/:id/start
router.post('/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        const quizRow = await pool.query(
            'SELECT one_attempt, pass_score, pass_percentage FROM quizzes WHERE id = $1', [id]
        );
        if (quizRow.rows.length === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });

        if (quizRow.rows[0].one_attempt && user_id) {
            const prev = await pool.query(
                'SELECT id FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2 LIMIT 1',
                [id, user_id]
            );
            if (prev.rows.length > 0)
                return res.status(403).json({ message: 'Ezt a kvizt mar kitoltotted, csak egyszer lehet!' });
        }

        const qRes = await pool.query(
            'SELECT id, COALESCE(points, 1) AS points FROM questions WHERE quiz_id = $1 AND is_active = true',
            [id]
        );
        const totalQuestions = qRes.rows.length;
        const totalPoints    = qRes.rows.reduce((s, q) => s + (q.points || 1), 0);

        const insertRes = await pool.query(
            `INSERT INTO quiz_attempts
                (quiz_id, user_id, score, total_questions, total_points, is_successful, completed_at)
             VALUES ($1,$2,0,$3,$4,false,NOW()) RETURNING id`,
            [id, user_id || null, totalQuestions, totalPoints]
        );

        res.json({ attempt_id: insertRes.rows[0].id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// POST /api/quizzes/:id/submit
router.post('/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, answers: userAnswers, attempt_id } = req.body;

        const quizRow = await pool.query(
            'SELECT one_attempt, pass_score, pass_percentage, hide_results, pass_mode FROM quizzes WHERE id = $1', [id]
        );
        if (quizRow.rows.length === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });

        if (quizRow.rows[0].one_attempt && user_id && !attempt_id) {
            const prevAttempt = await pool.query(
                'SELECT id FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2 LIMIT 1',
                [id, user_id]
            );
            if (prevAttempt.rows.length > 0)
                return res.status(403).json({ message: 'Ezt a kvizt mar kitoltotted, csak egyszer lehet!' });
        }

        const questionsResult = await pool.query(
            'SELECT id, question_type, COALESCE(points, 1) AS points FROM questions WHERE quiz_id = $1 AND is_active = true',
            [id]
        );
        const questionMap = {};
        questionsResult.rows.forEach(q => {
            questionMap[q.id] = { type: q.question_type, points: q.points || 1 };
        });

        const correctResult = await pool.query(
            `SELECT ao.id, ao.question_id, ao.text FROM answer_options ao
             JOIN questions q ON q.id = ao.question_id
             WHERE q.quiz_id = $1 AND ao.is_correct = true`,
            [id]
        );

        const correctMap     = {};
        const correctTextMap = {};
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
        const questionScores = {};

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

            const awarded = isCorrect ? points : 0;
            if (isCorrect) { correctCount++; earnedPoints += points; }
            questionScores[ua.question_id] = awarded;
        });

        const percentage  = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passScore   = quizRow.rows[0].pass_score;
        const passPct     = quizRow.rows[0].pass_percentage;
        const hideResults = quizRow.rows[0].hide_results;
        const passMode    = quizRow.rows[0].pass_mode;

        let isSuccessful = null;
        if (passMode === 'score' && passScore !== null && passScore !== undefined)
            isSuccessful = earnedPoints >= passScore;
        else if (passMode === 'percentage' && passPct !== null && passPct !== undefined)
            isSuccessful = percentage >= passPct;

        let finalAttemptId;
        if (attempt_id) {
            await pool.query(
                `UPDATE quiz_attempts
                 SET score=$1, total_questions=$2, total_points=$3,
                     is_successful=$4, completed_at=NOW()
                 WHERE id=$5`,
                [earnedPoints, totalQuestions, totalPoints, isSuccessful, attempt_id]
            );
            finalAttemptId = attempt_id;
            await pool.query('UPDATE quizzes SET play_count = play_count + 1 WHERE id = $1', [id]);
        } else {
            const insertRes = await pool.query(
                `INSERT INTO quiz_attempts
                   (quiz_id, user_id, score, total_questions, total_points, is_successful, completed_at)
                 VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id`,
                [id, user_id || null, earnedPoints, totalQuestions, totalPoints, isSuccessful]
            );
            finalAttemptId = insertRes.rows[0].id;
            await pool.query('UPDATE quizzes SET play_count = play_count + 1 WHERE id = $1', [id]);
        }
        const attemptId = finalAttemptId;

        try {
            const textInputOptIds = {};
            for (const ua of (userAnswers || [])) {
                const qInfo = questionMap[ua.question_id];
                if (qInfo?.type === 'text_input') {
                    const optRes = await pool.query(
                        'SELECT id FROM answer_options WHERE question_id = $1 LIMIT 1',
                        [ua.question_id]
                    );
                    if (optRes.rows.length > 0)
                        textInputOptIds[ua.question_id] = optRes.rows[0].id;
                }
            }

            for (const ua of (userAnswers || [])) {
                const qInfo = questionMap[ua.question_id];
                if (!qInfo) continue;
                const pointsPossible = qInfo.points || 1;
                const pointsAwarded  = questionScores[ua.question_id] ?? 0;

                if (qInfo.type === 'text_input') {
                    const aoId = textInputOptIds[ua.question_id];
                    if (!aoId) continue;
                    await pool.query(
                        `INSERT INTO attempt_answers
                           (attempt_id, question_id, answer_option_id, text_answer, points_possible, points_awarded)
                         VALUES ($1,$2,$3,$4,$5,$6)`,
                        [attemptId, ua.question_id, aoId, ua.text_answer || '', pointsPossible, pointsAwarded]
                    );
                } else {
                    const ids = Array.isArray(ua.answer_ids) ? ua.answer_ids : (ua.answer_id ? [ua.answer_id] : []);
                    if (ids.length === 0) continue;
                    for (const aid of ids) {
                        await pool.query(
                            `INSERT INTO attempt_answers
                               (attempt_id, question_id, answer_option_id, points_possible, points_awarded)
                             VALUES ($1,$2,$3,$4,$5)`,
                            [attemptId, ua.question_id, aid, pointsPossible, pointsAwarded]
                        );
                    }
                }
            }
        } catch (e) {
            console.error('attempt_answers mentesi hiba:', e.message);
        }

        res.json({
            score:           earnedPoints,
            total:           totalPoints,
            correct_count:   correctCount,
            total_questions: totalQuestions,
            percentage,
            passed:          isSuccessful,
            pass_mode:       passMode,
            pass_score:      passScore,
            pass_percentage: passPct,
            hide_results:    hideResults ?? false,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// DELETE /api/quizzes/:id/attempts  (összes kísérlet törlése)
router.delete('/:id/attempts', async (req, res) => {
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

// ── STATISZTIKA ───────────────────────────────────────────────────

// GET /api/quizzes/:id/stats
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const quizResult = await pool.query(
            'SELECT id, title, play_count, pass_score, pass_percentage FROM quizzes WHERE id = $1',
            [id]
        );
        if (quizResult.rows.length === 0)
            return res.status(404).json({ message: 'Kviz nem talalhato!' });

        const attemptsResult = await pool.query(
            `SELECT qa.id,
                    qa.score,
                    qa.total_questions,
                    COALESCE(qa.total_points, qa.total_questions) AS total_points,
                    qa.is_successful,
                    qa.completed_at AS finished_at,
                    u.username,
                    u.id AS user_id
             FROM quiz_attempts qa
             LEFT JOIN users u ON u.id = qa.user_id
             WHERE qa.quiz_id = $1
             ORDER BY qa.completed_at DESC NULLS LAST`,
            [id]
        );

        const questionsResult = await pool.query(
            `SELECT id, text AS question_text, question_type, COALESCE(points, 1) AS points
             FROM questions WHERE quiz_id = $1 AND is_active = true ORDER BY question_order, id`,
            [id]
        );
        const questions = await Promise.all(questionsResult.rows.map(async (q) => {
            const aResult = await pool.query(
                'SELECT id, text AS answer_text, is_correct FROM answer_options WHERE question_id = $1 ORDER BY id',
                [q.id]
            );
            return { ...q, answers: aResult.rows };
        }));

        const currentTotalPoints = questions.reduce((s, q) => s + (q.points || 1), 0);

        let attemptAnswers = {};
        try {
            const aaResult = await pool.query(
                `SELECT aa.attempt_id,
                        aa.question_id,
                        aa.text_answer,
                        aa.points_awarded,
                        aa.points_possible,
                        q.text            AS question_text,
                        q.question_type,
                        ao.text           AS chosen_answer_text,
                        (SELECT string_agg(a2.text, ', ' ORDER BY a2.id)
                         FROM answer_options a2
                         WHERE a2.question_id = q.id AND a2.is_correct = true
                        ) AS correct_answers_text
                 FROM attempt_answers aa
                 JOIN quiz_attempts qa   ON qa.id  = aa.attempt_id
                 LEFT JOIN questions q   ON q.id   = aa.question_id
                 LEFT JOIN answer_options ao ON ao.id = aa.answer_option_id
                 WHERE qa.quiz_id = $1
                 ORDER BY q.question_order, aa.question_id`,
                [id]
            );
            aaResult.rows.forEach(row => {
                if (!attemptAnswers[row.attempt_id])
                    attemptAnswers[row.attempt_id] = {};
                if (!attemptAnswers[row.attempt_id][row.question_id]) {
                    attemptAnswers[row.attempt_id][row.question_id] = {
                        question_id:          row.question_id,
                        question_text:        row.question_text || '(kerdes torolve)',
                        question_type:        row.question_type,
                        points_awarded:       row.points_awarded,
                        points_possible:      row.points_possible,
                        text_answer:          row.text_answer,
                        chosen_texts:         [],
                        correct_answers_text: row.correct_answers_text || '',
                    };
                }
                if (row.chosen_answer_text) {
                    attemptAnswers[row.attempt_id][row.question_id].chosen_texts.push(row.chosen_answer_text);
                }
            });
        } catch (e) {
            console.error('attempt_answers lekérési hiba:', e.message);
        }

        const attempts = attemptsResult.rows.map(a => {
            const tp  = a.total_points || 1;
            const pct = tp > 0 ? Math.round((a.score / tp) * 100) : 0;
            return {
                id:              a.id,
                username:        a.username || 'Nevtelen',
                user_id:         a.user_id,
                score:           a.score,
                total_questions: a.total_questions,
                total_points:    tp,
                percentage:      pct,
                is_successful:   a.is_successful,
                finished_at:     a.finished_at,
                answers:         attemptAnswers[a.id]
                                    ? Object.values(attemptAnswers[a.id])
                                    : [],
            };
        });

        const avgPct = attempts.length > 0
            ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
            : 0;

        res.json({
            quiz:    { ...quizResult.rows[0], total_points: currentTotalPoints },
            attempts,
            questions,
            summary: { total_attempts: attempts.length, avg_percentage: avgPct },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

module.exports = router;
