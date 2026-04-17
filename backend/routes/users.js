const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/users/:userId/home-data
router.get('/:userId/home-data', async (req, res) => {
    try {
        const { userId } = req.params;
        const [quizCount, attemptCount, playsRow, avgRow] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS cnt FROM quizzes WHERE owner_id = $1', [userId]),
            pool.query('SELECT COUNT(*)::int AS cnt FROM quiz_attempts WHERE user_id = $1', [userId]),
            pool.query('SELECT COALESCE(SUM(play_count),0)::int AS total FROM quizzes WHERE owner_id = $1', [userId]),
            pool.query(
                `SELECT ROUND(AVG(
                    qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                 ))::int AS avg_pct
                 FROM quiz_attempts qa
                 JOIN quizzes q ON q.id = qa.quiz_id
                 WHERE qa.user_id = $1 AND qa.total_questions > 0 AND (q.hide_results IS NULL OR q.hide_results = false)`,
                [userId]
            ),
        ]);

        const recentRes = await pool.query(
            `SELECT qa.score,
                    qa.total_questions,
                    COALESCE(qa.total_points, qa.total_questions) AS total_points,
                    qa.is_successful,
                    qa.completed_at AS finished_at,
                    q.id AS quiz_id,
                    q.title AS quiz_title, q.category, q.one_attempt
             FROM quiz_attempts qa
             JOIN quizzes q ON q.id = qa.quiz_id
             WHERE qa.user_id = $1
               AND (q.hide_results IS NULL OR q.hide_results = false)
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
            recent_attempts: recentRes.rows.map(r => {
                const tp = r.total_points || r.total_questions || 1;
                return {
                    quiz_id:         r.quiz_id,
                    quiz_title:      r.quiz_title,
                    category:        r.category,
                    one_attempt:     r.one_attempt,
                    score:           r.score,
                    total_questions: r.total_questions,
                    total_points:    tp,
                    percentage:      tp > 0 ? Math.round((r.score / tp) * 100) : 0,
                    is_successful:   r.is_successful,
                    finished_at:     r.finished_at,
                };
            }),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// GET /api/users/:userId/stats-data
router.get('/:userId/stats-data', async (req, res) => {
    try {
        const { userId } = req.params;

        const [attemptCount, avgRow, successRow, bestRow] = await Promise.all([
            pool.query(
                `SELECT COUNT(*)::int AS cnt FROM quiz_attempts qa WHERE qa.user_id = $1`,
                [userId]
            ),
            pool.query(
                `SELECT ROUND(AVG(
                    qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                 ))::int AS avg_pct
                 FROM quiz_attempts qa
                 JOIN quizzes q ON q.id = qa.quiz_id
                 WHERE qa.user_id = $1 AND qa.total_questions > 0 AND (q.hide_results IS NULL OR q.hide_results = false)`,
                [userId]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS cnt FROM quiz_attempts WHERE user_id = $1 AND is_successful = true`,
                [userId]
            ),
            pool.query(
                `SELECT ROUND(MAX(
                    qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                 ))::int AS best_pct
                 FROM quiz_attempts qa
                 JOIN quizzes q ON q.id = qa.quiz_id
                 WHERE qa.user_id = $1 AND qa.total_questions > 0 AND (q.hide_results IS NULL OR q.hide_results = false)`,
                [userId]
            ),
        ]);

        const monthlyRes = await pool.query(
            `SELECT TO_CHAR(DATE_TRUNC('month', qa.completed_at), 'YYYY-MM') AS month,
                    COUNT(*)::int AS cnt,
                    ROUND(AVG(
                        qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                    ))::int AS avg_pct
             FROM quiz_attempts qa
             JOIN quizzes q ON q.id = qa.quiz_id
             WHERE qa.user_id = $1
               AND qa.completed_at >= NOW() - INTERVAL '6 months'
               AND (q.hide_results IS NULL OR q.hide_results = false)
             GROUP BY DATE_TRUNC('month', qa.completed_at)
             ORDER BY DATE_TRUNC('month', qa.completed_at)`,
            [userId]
        );

        const monthlyMap = {};
        monthlyRes.rows.forEach(r => { monthlyMap[r.month] = { cnt: r.cnt, avg_pct: r.avg_pct }; });
        const monthly = [];
        const HU_MONTHS = ['Jan','Feb','Már','Ápr','Máj','Jún','Júl','Aug','Sze','Okt','Nov','Dec'];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthly.push({
                label:   HU_MONTHS[d.getMonth()],
                val:     monthlyMap[key]?.cnt     ?? 0,
                avg_pct: monthlyMap[key]?.avg_pct ?? null,
            });
        }

        const catRes = await pool.query(
            `SELECT q.category,
                    COUNT(*)::int AS cnt,
                    ROUND(AVG(
                        qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                    ))::int AS avg_pct,
                    ROUND(MAX(
                        qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                    ))::int AS best_pct
             FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id
             WHERE qa.user_id = $1 AND qa.total_questions > 0 AND q.category IS NOT NULL
               AND (q.hide_results IS NULL OR q.hide_results = false)
             GROUP BY q.category ORDER BY avg_pct DESC LIMIT 8`,
            [userId]
        );

        const recentAttemptsRes = await pool.query(
            `SELECT qa.id,
                    qa.score,
                    COALESCE(qa.total_points, qa.total_questions) AS total_points,
                    qa.is_successful,
                    qa.completed_at AS finished_at,
                    q.title AS quiz_title,
                    q.category
             FROM quiz_attempts qa
             JOIN quizzes q ON q.id = qa.quiz_id
             WHERE qa.user_id = $1
               AND (q.hide_results IS NULL OR q.hide_results = false)
             ORDER BY qa.completed_at DESC NULLS LAST LIMIT 5`,
            [userId]
        );

        const [ownQuizCount, totalPlaysRow, ownAvgRow] = await Promise.all([
            pool.query(`SELECT COUNT(*)::int AS cnt FROM quizzes WHERE owner_id = $1`, [userId]),
            pool.query(`SELECT COALESCE(SUM(play_count),0)::int AS total FROM quizzes WHERE owner_id = $1`, [userId]),
            pool.query(
                `SELECT ROUND(AVG(
                    qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                 ))::int AS avg_pct
                 FROM quiz_attempts qa
                 JOIN quizzes q ON q.id = qa.quiz_id
                 WHERE q.owner_id = $1 AND qa.total_questions > 0`,
                [userId]
            ),
        ]);

        const ownQuizzesRes = await pool.query(
            `SELECT q.id, q.title, q.category, q.play_count, q.is_public,
                    COUNT(DISTINCT qu.id)::int AS question_count,
                    ROUND(AVG(
                        qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                    ))::int AS avg_score_pct,
                    COUNT(DISTINCT qa.id)::int AS attempt_count
             FROM quizzes q
             LEFT JOIN questions qu ON qu.quiz_id = q.id AND qu.is_active = true
             LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.total_questions > 0
             WHERE q.owner_id = $1
             GROUP BY q.id
             ORDER BY q.play_count DESC
             LIMIT 10`,
            [userId]
        );

        const ownCatRes = await pool.query(
            `SELECT q.category,
                    COUNT(DISTINCT q.id)::int AS quiz_count,
                    COALESCE(SUM(q.play_count), 0)::int AS total_plays,
                    ROUND(AVG(
                        qa.score::numeric / NULLIF(COALESCE(qa.total_points, qa.total_questions), 0) * 100
                    ))::int AS avg_score_pct
             FROM quizzes q
             LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.total_questions > 0
             WHERE q.owner_id = $1 AND q.category IS NOT NULL
             GROUP BY q.category
             ORDER BY total_plays DESC`,
            [userId]
        );

        res.json({
            player_stats: {
                attempt_count:   attemptCount.rows[0].cnt,
                avg_percentage:  avgRow.rows[0].avg_pct       ?? 0,
                success_count:   successRow.rows[0].cnt,
                best_percentage: bestRow.rows[0].best_pct     ?? 0,
            },
            monthly,
            category_performance: catRes.rows,
            recent_attempts: recentAttemptsRes.rows.map(r => {
                const tp = r.total_points || 1;
                return { ...r, percentage: tp > 0 ? Math.round((r.score / tp) * 100) : 0 };
            }),
            creator_stats: {
                quiz_count:    ownQuizCount.rows[0].cnt,
                total_plays:   totalPlaysRow.rows[0].total,
                avg_score_pct: ownAvgRow.rows[0].avg_pct ?? null,
            },
            own_quizzes:    ownQuizzesRes.rows,
            own_categories: ownCatRes.rows,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

module.exports = router;
